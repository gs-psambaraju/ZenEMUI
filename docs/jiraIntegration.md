# Jira Integration – Backend Clarifications Needed

The UI wizard is being wired end‑to‑end per the latest PRDs. To finish the Smart Suggestions → Field Mapping → Activation flow cleanly (without extra round‑trips or client assumptions), we need the following backend confirmations/adjustments.

## 1) Suggestions Payload – Single Exercise, Entity Context Included ✅ **IMPLEMENTED**

**Backend Response:** This is already implemented via the entity-structured endpoint:

**Endpoint:** `GET /api/admin/connectors/{connectionId}/jobs/{jobId}/suggestions?format=entities`

**Actual Response Structure:**
```json
{
  "jobId": "job-123",
  "jobType": "PROJECT_HEALTH", 
  "format": "entities",
  "entities": [
    {
      "entityType": "projects",
      "entityLabel": "Project Information",
      "autoMappedFields": [
        {
          "zenemField": "projects.name",
          "zenemFieldLabel": "Project Name",
          "required": true,
          "jiraField": { /* discovered Jira field with sample data */ }
        }
      ],
      "unmappedFields": [
        {
          "zenemField": "projects.status", 
          "zenemFieldLabel": "Project Status",
          "required": false,
          "availableJiraFields": ["Status", "Resolution"] // Simplified for UI
        }
      ]
    }
  ]
}
```

**Additional Endpoint for Complete Field Schema:** `GET /api/admin/connectors/{connectionId}/jobs/{jobId}/field-schema`

This provides the complete `availableZenemFields` catalog per entity with field definitions, required flags, and categories.

**Status:** ✅ Ready - covers your requirements with entity-grouped structure and required field information.

## 2) Mappings API – Semantics ✅ **CONFIRMED**

**Backend Response:**

**Endpoint:** `PUT /api/admin/connectors/{connectionId}/jobs/{jobId}/mappings`

**Semantics:** 
- ✅ **Full Replacement** - The endpoint deletes all existing mappings for the job and saves the complete new set
- ✅ **Validation** - Returns validation errors for invalid mappings without saving if validation fails
- ✅ **Response** - Returns status and validation results, but not the canonical saved set

**Current Response:**
```json
{
  "jobId": "job-123",
  "nextStep": "PREVIEW", 
  "totalMappings": 5,
  "validMappings": 5,
  "invalidMappings": 0,
  "validationErrors": []
}
```

**Missing for UI Reconciliation:** ❌ The canonical saved mappings are not returned in the response. 

**Concurrency:** ❌ No ETag/version control currently implemented.

**Action Required:** 
- [ ] Modify PUT /mappings to return the saved mappings in response
- [ ] Consider implementing optimistic locking with version field if multi-tab scenarios are critical

**GET /mappings Alternative:** The existing `GET /mappings` endpoint returns the current saved mappings if immediate reconciliation is needed.

## 3) Required Fields Enforcement ⚠️ **NEEDS MODIFICATION**

**Backend Response:**

**Current Behavior:** The `POST /api/admin/connectors/{connectionId}/jobs/{jobId}/activate` endpoint validates required fields but **throws exceptions on validation failure** instead of returning validation details.

**Current Validation Logic:**
- ✅ Required field mappings are checked per job type:
  - `PROJECT_HEALTH`: requires `projects.name`, `projects.jiraKey`
  - `SPRINT_ANALYTICS`: requires `sprints.name`, `sprints.jiraKey`
  - etc.
- ✅ Validation logic exists in `JobActivationService.validateRequiredMappingsForJobType()`
- ❌ **Issue**: Throws `IllegalArgumentException` instead of returning validation results

**Current Response (Success):**
```json
{
  "jobId": "job-123", 
  "status": "ACTIVE",
  "nextRunAt": "2024-01-15T10:00:00",
  "message": "Job activated successfully"
}
```

**Current Response (Failure):** `400 Bad Request` with error message

**Action Required:**
- [ ] Modify `POST /activate` to return validation results instead of throwing exceptions
- [ ] Add validation block to response DTO with missing required fields
- [ ] Allow activation to return validation details even when invalid

**Suggested Response Structure:**
```json
{
  "jobId": "job-123",
  "validation": {
    "configurationValid": false,
    "requiredFieldsMapped": false, 
    "missingRequired": ["projects.name", "stories.title"]
  },
  "status": "DRAFT", // Don't activate if invalid
  "errors": ["Required field mapping missing: projects.name for job type PROJECT_HEALTH"]
}
```

## 4) Discovery – "Discover Again" Behavior ⚠️ **NEEDS CLARIFICATION**

**Backend Response:**

**Current Behavior:**
- ✅ **New Trigger**: Generates new `discoveryId` and starts async process
- ⚠️ **Concurrent Runs**: **No prevention** - multiple discoveries can run simultaneously for the same job
- ✅ **Atomic Results**: Latest discovery results replace cached results when completed
- ❌ **No TTL**: In-memory cache with no expiration policy
- ⚠️ **Discovery ID Tracking**: `findLatestDiscoveryId()` may not reliably find the most recent discovery

**Issues Identified:**
1. **Race Conditions**: Multiple concurrent discoveries can cause confusion
2. **Resource Usage**: No limits on concurrent discovery processes
3. **Cache Management**: No TTL or cleanup policy for old results

**Recommended Behavior:**
- **Option A (Cancel Prior)**: Cancel any running discovery when new one is triggered
- **Option B (Ignore New)**: Return existing discovery ID if one is already RUNNING  
- **Option C (Queue)**: Queue new discovery to start after current one completes

**Current Cache Behavior:**
- Results are cached with key pattern: `{discoveryId}_results`
- Status is cached with key: `{discoveryId}`
- Latest discovery replaces cached results atomically on completion
- UI can refresh without diffing - results are completely replaced

**Action Required:**
- [ ] Implement concurrency control for discovery triggers
- [ ] Add TTL for cached results (suggest 24 hours)
- [ ] Improve discovery ID tracking to ensure latest discovery is found

## 5) Preview Defaults and Limits ✅ **CONFIRMED**

**Backend Response:**

**Current Implementation:**
- ✅ **Testing Endpoint**: `POST /api/admin/connectors/{connectionId}/jobs/{jobId}/test`
- ✅ **Default Sample Size**: 5 records (in `JobTestingDtos.TestJobRequest`)
- ⚠️ **No Time-based Filtering**: No `previewDays` parameter currently implemented
- ✅ **Configurable Sample Size**: `sampleSize` parameter accepts custom values

**Current Defaults:**
```json
{
  "sampleSize": 5  // Default in JobTestingDtos.TestJobRequest
}
```

**Constraints:**
- ❌ **No documented maximum** for `sampleSize` parameter
- ❌ **No rate limiting** currently implemented  
- ❌ **No `previewDays` concept** - uses job's configured date range filters

**Recommendations for UI:**
- **Default sampleSize**: Use 5-10 records for quick preview
- **Maximum sampleSize**: Cap at 100 records (reasonable for UI display)
- **Preview Days**: Use job's existing date range configuration instead of separate parameter

**Action Required:**
- [ ] Consider adding `previewDays` parameter if time-based preview filtering is needed
- [ ] Document maximum `sampleSize` limits (suggest 100)
- [ ] Add rate limiting if needed for production use

## 6) Error & Status Codes (Discovery) ✅ **IMPLEMENTED**

**Backend Response:**

**404 Handling:** ✅ **DEPLOYED**
- `GET /api/admin/connectors/{connectionId}/jobs/{jobId}/discover/status` returns `404 Not Found` when no discovery exists
- Implementation: `FieldDiscoveryController` catches `IllegalArgumentException` with "No field discovery found" message

**Current Error Responses:**
```json
// 404 - No discovery found
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 404,
  "error": "Not Found", 
  "path": "/api/admin/connectors/.../discover/status"
}

// Discovery failed with errorDetails
{
  "discoveryId": "abc-123",
  "status": "FAILED",
  "message": "Field discovery failed: Connection timeout",
  "errorDetails": "javax.net.ConnectException: Connection refused",
  "updatedAt": "2024-01-15T10:30:00"
}
```

**Status Values:**
- `"RUNNING"` - Discovery in progress
- `"COMPLETED"` - Discovery successful  
- `"FAILED"` - Discovery failed (includes `errorDetails`)
- `"RESULTS_CACHED"` - Results available for retrieval

**Error Handling:**
- ✅ **Custom errorDetails**: Included in FAILED status responses
- ✅ **Standard HTTP codes**: 404, 401, 500 as appropriate
- ✅ **Retry-friendly**: Failed discoveries can be re-triggered

**Status:** ✅ Ready for production use

## 7) Draft / Auto‑Save Expectations ✅ **IMPLEMENTED**

**Backend Response:**

**Auto-Save Endpoints:**
- ✅ **Filters**: `PUT /api/admin/connectors/{connectionId}/jobs/{jobId}/filters`
- ✅ **Mappings**: `PUT /api/admin/connectors/{connectionId}/jobs/{jobId}/mappings`  
- ✅ **Job Details**: `PUT /api/admin/connectors/{connectionId}/jobs/{jobId}` (name, description, schedule)

**Step Tracking:** ✅ **AUTOMATIC**
- **No manual step transitions required** - steps are calculated automatically
- Steps determined by configuration completeness in `SyncJobService.determineJobStep()`
- Available via `GET /api/admin/connectors/{connectionId}/jobs/{jobId}` response

**Current Step Values:**
```json
{
  "step": "FILTERS",        // No filters configured
  "step": "FIELD_DISCOVERY", // Filters set, no mappings  
  "step": "MAPPING",        // Discovery done, incomplete mappings
  "step": "PREVIEW",        // All mappings configured
  "step": "ACTIVE"          // Job activated
}
```

**Step Logic:**
- `FILTERS`: No projects or JQL configured
- `FIELD_DISCOVERY`: Filters set but no field mappings
- `MAPPING`: Field mappings exist but required mappings incomplete
- `PREVIEW`: All required mappings configured  
- `ACTIVE`: Job is activated and running

**Auto-Save Behavior:**
- ✅ **Immediate persistence**: All PUT endpoints save changes immediately
- ✅ **Step progression**: Steps automatically advance based on saved configuration
- ✅ **Validation**: Invalid configurations prevent step progression
- ❌ **No explicit step API**: Steps cannot be manually set

**Status:** ✅ Fully automatic - no additional step management API needed

## 8) Target Field Catalogue (If Needed) ✅ **AVAILABLE**

**Backend Response:**

**Primary Source:** ✅ **Included in Suggestions**
- `GET /api/admin/connectors/{connectionId}/jobs/{jobId}/suggestions?format=entities` includes complete `availableZenemFields` information
- **No separate catalogue call needed** for standard mapping workflow

**Standalone Catalogue:** ✅ **AVAILABLE**
- `GET /api/admin/connectors/{connectionId}/jobs/{jobId}/field-schema` provides complete ZenEM field catalogue
- Accepts implicit `jobType` from job configuration (no query parameter needed)

**Response Structure:**
```json
{
  "jobType": "PROJECT_HEALTH",
  "entities": [
    {
      "entityType": "projects",
      "entityLabel": "Project Information", 
      "entityDescription": "Configure project-level data from Jira",
      "fields": [
        {
          "path": "projects.name",
          "label": "Project Name",
          "type": "string", 
          "required": true,
          "category": "basic",
          "description": "The display name of the project"
        },
        {
          "path": "projects.jiraKey", 
          "label": "Project Key",
          "type": "string",
          "required": true,
          "category": "integration",
          "description": "Unique project identifier in Jira"
        }
      ]
    }
  ]
}
```

**Entity Grouping:**
- ✅ **Projects**: `projects.*` fields
- ✅ **Stories**: `stories.*` fields  
- ✅ **Sprints**: `sprints.*` fields
- ✅ **Releases**: `releases.*` fields
- ✅ **Team Members**: `teamMembers.*` fields

**Field Categories:**
- `basic` - Core information fields
- `metrics` - Numeric/measurement fields  
- `planning` - Date/time fields
- `team` - People/assignment fields
- `integration` - ID/key fields

**Usage Recommendation:**
- **Primary**: Use suggestions endpoint with `format=entities` for mapping workflow
- **Fallback**: Use standalone field-schema endpoint if needed for dropdown population

**Status:** ✅ Both approaches available

---

## Backend Summary for UI Team

**✅ Ready for Implementation:**
- Question 1: Entity-structured suggestions API 
- Question 5: Preview/testing with configurable sample sizes
- Question 6: Discovery error handling with 404 support
- Question 7: Automatic step tracking and auto-save
- Question 8: Complete field catalogue via multiple endpoints

**⚠️ Requires Backend Updates:**
- **Question 2**: Add saved mappings to PUT /mappings response for UI reconciliation
- **Question 3**: Modify POST /activate to return validation details instead of throwing exceptions
- **Question 4**: Add concurrency control for field discovery

**Recommended Next Steps:**
1. **UI Team**: Can proceed with Questions 1, 5, 6, 7, 8 implementations
2. **Backend Team**: Address Questions 2, 3, 4 before full production deployment 
3. **Both Teams**: Test end-to-end flow with current APIs to identify any gaps

The backend supports the complete wizard flow from discovery → smart mapping → field selection → activation with comprehensive validation and step tracking.