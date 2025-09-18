Jira Integration — Phase 2 (Webhooks-first + Weekend Reconciliation)

Purpose
- Finalize ingestion strategy and admin UX for webhooks-first sync with periodic reconciliation.
- Provide concrete API contracts (endpoints, params, payloads) for UI implementation.

Principles
- Webhooks as primary: near real-time updates after initial backfill.
- Safe-guarded reconciliation: periodic deltas to catch webhook gaps; more frequent runs on weekends when change load is low.
- Data minimization: ingest only admin-scoped entities and mapped fields; always track lineage.

Scheduling model
- Initial backfill: once per connector after mapping + scope saved.
- Incremental: webhooks process changes continuously.
- Reconciliation deltas (polling):
  - Weekdays: once daily (updated >= now-7d)
  - Weekends: every 2 hours (updated >= now-7d)
- Manual runs: admin can trigger on demand with params.
- Rate-limit aware: 429 Retry-After + exponential backoff with jitter; bounded concurrency.

Admin UX placement
- Admin → Connectors → Jira → Connection Detail
  - Tabs: Overview | Health | Field Mapping | User Mapping | Scope | Sync | Logs | Settings
  - New in Phase 2: Settings (webhooks & schedules), Sync (manual reconcile/backfill actions + status)

Error format (standard)
```json
{
  "success": false,
  "error": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | RUNTIME_ERROR | INVALID_ARGUMENT",
  "message": "Human readable message",
  "fieldErrors": {"field": "error"}
}
```

Common headers
```http
Authorization: Bearer <JWT>
Accept: application/json
Content-Type: application/json
```

Stories, Acceptance Criteria, and API Contracts

1) Webhooks management (Cloud-first)
- Story: Enable/disable webhooks, rotate secret, validate delivery
- AC:
  - Admin can enable webhooks; system registers a webhook and stores a secret.
  - Can rotate secret; old secret invalidated immediately.
  - Delivery validation endpoint verifies HMAC signature.
- Endpoints:
  - POST /admin/connectors/{id}/webhooks/register → { "registered": true, "secretSet": true }
  - POST /admin/connectors/{id}/webhooks/rotate → { "rotated": true, "rotatedAt": "2025-08-10T10:00:00" }
  - GET /admin/connectors/{id}/webhooks/status → { "registered": true, "lastEventAt": "2025-08-10T11:20:00", "events24h": 123 }
  - Receiver (internal): POST /webhooks/jira/{id}
    - Headers: X-Jira-Signature: <hmac>; must return 202 on accept

2) Scheduling & Settings
- Story: Configure incremental and reconciliation schedules per connector
- AC:
  - Admin can toggle reconciliation schedules and set aggressiveness for weekends.
  - Defaults: weekdays daily @ 02:00; weekends every 2h; both on.
- Endpoints:
  - GET /admin/connectors/{id}/settings
  - PUT /admin/connectors/{id}/settings
    - Request
      { "reconcileWeekdayCron": "0 0 2 * * ?", "reconcileWeekendCron": "0 0 0/2 ? * SAT,SUN *", "webhooksEnabled": true }
    - Response
      { "saved": true, "updatedAt": "2025-08-10T10:10:00" }

3) Manual reconciliation (delta)
- Story: Admin triggers a delta fetch for issues/epics updated since a timestamp
- AC:
  - Accepts windowDays (default 7), entity filters (epic, issue), optional JQL override.
  - Job status shows progress and completion.
- Endpoints:
  - POST /admin/connectors/{id}/sync/reconcile
    - Request
      { "windowDays": 7, "entities": ["epic","issue"], "jql": "project in (ABC,XYZ)" }
    - Response
      { "jobId": "recon_001", "status": "QUEUED" }
  - GET /admin/connectors/{id}/sync/status?jobId=recon_001
    - Response
      { "jobId": "recon_001", "status": "RUNNING", "progress": { "pages": 12, "issuesFetched": 1200, "upserts": 980 }, "lastError": null }

4) Manual backfill (history extension)
- Story: Admin initiates a backfill beyond the current history window
- AC:
  - Accepts from/to dates or a daysBack parameter; uses scope JQL.
  - Idempotent; safe to re-run.
- Endpoints:
  - POST /admin/connectors/{id}/sync/backfill
    - Request
      { "daysBack": 365, "entities": ["epic","issue"] }
    - Response
      { "jobId": "backfill_001", "status": "QUEUED" }

5) Releases (versions) sync
- Story: Sync Jira project versions and map to releases view
- AC:
  - Upserts fields: id, name, description, released, releaseDate, startDate, archived, projectKey.
  - Included in reconciliation and backfill.
- Endpoints:
  - POST /admin/connectors/{id}/sync/versions (manual)
    - Request { "projects": ["ABC","XYZ"] }
    - Response { "accepted": true }
  - Included in reconcile/backfill jobs if entities includes "version".

6) Sprints sync and metrics
- Story: Sync sprints for selected boards and compute planned/completed points for active sprints
- AC:
  - Upsert sprint: id, name, state, startDate, endDate, completeDate, goal, boardId.
  - For active sprints, compute storyPoints planned/completed from mapped field.
- Endpoints:
  - POST /admin/connectors/{id}/sync/sprints
    - Request { "boards": [12,34], "includeCompleted": false }
    - Response { "accepted": true }
  - GET /admin/connectors/{id}/sprints?boardId=12&state=active → array of sprints

7) Field discovery with samples (extended)
- Story: Show live sample values to clarify customfield_xxx
- AC:
  - Return 3–5 distinct sample values for each field based on selected projects/issue types.
  - Type-aware formatting (options, user, dates).
- Endpoint:
  - GET /admin/connectors/{id}/fields?includeSamples=true&projects=ABC,XYZ&issueTypes=Epic,Story&sampleCount=5
  - Response (array)
    [ { "id":"customfield_10026","key":"customfield_10026","name":"Story Points","schema":{"type":"number"},"samples":["3","5","8"],"usageInSample":41,"alias":"storyPoints" } ]

8) Save/test mappings (versioned)
- Story: Save mapping versions and test on a sample set
- AC:
  - Only one ACTIVE version; test returns coverage %, warnings, sample rows.
- Endpoints:
  - PUT /admin/connectors/{id}/mappings
    - Request
      { "versionName":"v2","projects": { "name": {"fieldId":"summary"}, "status": {"fieldId":"status","enumMap":{"In Progress":"IN_PROGRESS"}}}, "stories": { "title": {"fieldId":"summary"}, "storyPoints": {"fieldId":"customfield_10026","type":"number"} } }
    - Response { "versionId":"map_v2","active": true, "createdAt":"2025-08-10T12:00:00" }
  - POST /admin/connectors/{id}/mappings/test
    - Request { "sampleSize": 50, "projects": ["ABC"], "issueTypes": ["Epic","Story"] }
    - Response { "sampled":50, "mapped":48, "coveragePct":96, "enumWarnings":[{"field":"status","jiraValue":"Deprecated","mappedTo":"NOT_STARTED"}], "samples":[{"jiraKey":"ABC-101","project":{"name":"Payments"},"story":{"title":"Add card"}}] }

9) User discovery & mapping (refinements)
- Story: Improve auto-map and manual override experience
- AC:
  - Auto-map by email; allow manual selection of Jira accountId; show unresolved list.
- Endpoints:
  - POST /admin/connectors/{id}/discover-users → { "accepted": true }
  - GET /admin/connectors/{id}/users?search=doe&page=0&size=20 → Page<UserRef>
  - PUT /admin/connectors/{id}/user-mappings
    - Request { "mappings": [ {"zenemEmail":"em@example.com","jiraAccountId":"acc_1"} ] }
    - Response { "updated": 1 }

10) Sync status & metrics
- Story: Unified status and telemetry for all jobs
- AC:
  - Show job state, progress (issues fetched/upserts/pages), conflicts, rate-limit events, last checkpoint.
- Endpoints:
  - GET /admin/connectors/{id}/sync/status (latest) or with jobId param
    - Response
      { "jobId":"recon_001","status":"RUNNING","startedAt":"...","progress":{"issuesFetched":1200,"upserts":980,"pages":12},"rateLimits":{"last429At":"...","retryAfterSec":30,"events":3},"lastError":null }

11) Logs & replay
- Story: View logs and replay failures
- AC:
  - Filter by level/time; replay only failed items since a timestamp with current mapping.
- Endpoints:
  - GET /admin/connectors/{id}/logs?level=ERROR&since=2025-08-10T00:00:00&page=0&size=50 → Page<LogEntry>
  - POST /admin/connectors/{id}/replay
    - Request { "jobId":"recon_001","since":"2025-08-10T11:00:00","limit":100 }
    - Response { "accepted": true }

12) Health & rate-limit surface
- Story: Show connection health, remaining budget, and last error
- AC:
  - Health endpoint exposes lastSuccessAt, lastErrorAt, httpStatus, rateLimitRemaining.
- Endpoint:
  - GET /admin/connectors/{id}/health → { "reachable":true, "lastSuccessAt":"...", "lastErrorAt":null, "httpStatus":200, "rateLimitRemaining":4500, "errorCode":null, "message":"OK" }

Notes
- All responses camelCase; secrets never returned; tokens encrypted at rest.
- Lineage: each upsert sets sourceConnectionId, sourceMetadata, lastSyncTimestamp, mappingVersion.
- Sprints planned/completed points computed from mapped Story Points via issue search per sprint.