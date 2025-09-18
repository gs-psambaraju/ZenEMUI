ZenEM POC (EM + Scrum) — User Stories and Acceptance Criteria

Purpose
- Define a concrete, buildable POC scope for one role (Engineering Manager) following Scrum
- Provide specific, testable acceptance criteria
- Separate UI versus Backend responsibilities per story

Scope and Assumptions
- Role: Engineering Manager (single role for POC); future roles kept in mind but not implemented
- Methodology: Scrum only; SAFe-friendly design later
- Navigation (POC): Home, Projects, Releases, Team Members, Sprints
- Data sources: Manual input; Jira key linkage supported, sync UX out-of-scope for POC
- Security: JWT-authenticated APIs; tenant-aware (claims already in tokens)

Non-Goals (POC)
- Advanced Jira sync and field-mapping UI
- Capacity planning, velocity charts, burndowns
- Repository integration
- Multi-outcome navigation

Definitions (POC data contracts at a high level)
- Project core fields used in POC: name, description, team, projectType, status, priority, startDate, targetEndDate, plannedReleaseDate, actualReleaseDate, engineeringManager, productManager, healthStatus, jiraKey, releaseVersions
- Sprint minimal fields (to be added): name, team, startDate, endDate, status, plannedStoryPoints, completedStoryPoints, current flag
- Note (to be added): projectId, createdAt, authorId, text
- Risk (to be added): projectId, createdAt, ownerId, title, severity, status

Navigation Shell (POC)
Story N.1 — Left navigation available to EM
Description: As an Engineering Manager, I can access Home, Projects, Releases, Team Members, and Sprints from the left navigation on desktop.
Acceptance Criteria
- Navigation items visible: Home, Projects, Releases, Team Members, Sprints
- The active section is visually indicated
- Navigation persists across page reloads within the session
- All pages require authentication; unauthorized users are redirected to login
UI Tasks
- Implement persistent left navigation on desktop with active-state highlight
- Route definitions for each top-level section
BE Tasks
- None beyond existing authentication; ensure 401 is returned for unauthenticated requests

Home
Story H.1 — EM dashboard KPIs
Description: As an EM, I see at-a-glance KPIs for my projects and near-term delivery.
Acceptance Criteria
- KPIs displayed above the fold: count of active projects, count of at-risk projects (healthStatus is YELLOW or RED), number of releases in next 30 days (plannedReleaseDate within next 30 days), current sprint name and date range if a current sprint exists
- Counts are tenant-scoped and EM-scoped: projects where engineeringManager equals the logged-in EM identifier as defined in Engineering Manager mapping (see Projects stories)
- Data refreshes on page load; a manual refresh button is available
UI Tasks
- Render KPI strip with four cards: Active Projects, At-Risk Projects, Upcoming Releases (30 days), Current Sprint
- Provide a Refresh control; show last-updated timestamp on the page header
BE Tasks
- Provide a single dashboard endpoint that returns KPI counts and current sprint metadata; performance target under 300 ms for 500 projects dataset
- Data rules: at-risk = healthStatus is YELLOW or RED; upcoming release = plannedReleaseDate between today and day 30 inclusive; EM-scoped = engineeringManager matches logged-in user identity

Story H.2 — My Projects widget
Description: As an EM, I see a list of my top five projects sorted by most recently updated.
Acceptance Criteria
- Shows up to five projects where engineeringManager matches logged-in user; fields: name, status, health, plannedReleaseDate, lastUpdated relative time
- Each item links to the project detail Overview tab
- If fewer than one project, show an empty state with a Create Project call-to-action
UI Tasks
- Implement a compact list with the specified fields and click-through behavior
- Implement empty state with Create Project CTA
BE Tasks
- Extend the dashboard endpoint or provide a dedicated endpoint to return up to five projects filtered by engineeringManager and sorted by updatedAt descending

Story H.3 — Sprint Snapshot widget
Description: As an EM, I can view current sprint summary.
Acceptance Criteria
- Shows current sprint name and dates; shows plannedStoryPoints and completedStoryPoints; shows up to three blocker notes if provided on the sprint detail
- If no current sprint exists, show empty state with Set Current Sprint CTA linking to Sprints
UI Tasks
- Implement compact sprint snapshot card with the above fields
BE Tasks
- Provide sprint read endpoints that identify the current sprint; include planned and completed points; include up to three latest sprint blockers notes if present

Story H.4 — Upcoming Releases widget
Description: As an EM, I see a list of projects releasing in the next 30 days.
Acceptance Criteria
- Lists up to five projects by ascending plannedReleaseDate with fields: project name, plannedReleaseDate, confidence indicator derived from healthStatus (GREEN high, YELLOW medium, RED low)
- Each item links to project detail Overview
UI Tasks
- Implement compact list with derived confidence indicator
BE Tasks
- Provide releases data aggregated from projects filtered by date window and sorted by plannedReleaseDate ascending

Projects
Story P.1 — Projects list with filters
Description: As an EM, I can view and filter a paginated list of projects.
Acceptance Criteria
- Table columns: name, status, healthStatus, priority, team, plannedReleaseDate, actualReleaseDate, jiraKey, updatedAt
- Default sort by updatedAt descending; pagination default page size 20; support page and size parameters
- Filters available: status (multi-select), healthStatus (multi-select), team (multi-select), plannedReleaseDate (range), search by name or jiraKey (contains)
- Results are tenant-scoped; if a global filter is set to “My Projects,” results are restricted to projects where engineeringManager matches logged-in EM
UI Tasks
- Implement table with columns and sticky header; implement filter panel with the above filters; implement pagination controls
- Persist last-used filters in URL query parameters so reloads restore state
BE Tasks
- Implement projects listing endpoint supporting pagination, sorting, and the filter fields matching the ProjectFilterRequest DTO; enforce tenant scoping

Story P.2 — Create project (manual)
Description: As an EM, I can create a new project manually.
Acceptance Criteria
- Required fields: name, team; optional fields accepted: description, projectType, status, priority, startDate, targetEndDate, plannedReleaseDate, engineeringManager, productManager, jiraKey
- Defaults if absent: status NOT_STARTED, priority MEDIUM, projectType FEATURE, healthStatus GREEN
- engineeringManager resolution rule (POC): value must be set to the logged-in user’s ID or email; the same rule will be used by backend to scope “My Projects”
- After successful creation, the user is redirected to project detail Overview
- Validation errors are shown inline for missing required fields and invalid dates (end dates not before start dates)
UI Tasks
- Implement create form with the above fields and validations; on success, navigate to detail
BE Tasks
- Implement project create endpoint with server-side validation; set default values when omitted; set createdAt and updatedAt; return the created project resource

Story P.3 — Edit project
Description: As an EM, I can update core project fields.
Acceptance Criteria
- Editable fields: description, team, projectType, status, priority, startDate, targetEndDate, plannedReleaseDate, actualReleaseDate, engineeringManager, productManager, jiraKey, healthStatus
- updatedAt is refreshed on successful update
- Audit-safe behavior: if no changes are made, backend returns a no-op response and does not change updatedAt
UI Tasks
- Implement edit capability on Overview tab or an Edit action with a form dialog
BE Tasks
- Implement project update endpoint with optimistic validation and audit behavior

Story P.4 — Project detail Overview tab
Description: As an EM, I can see a single project’s key information.
Acceptance Criteria
- Displays name, description, team, owners, status, healthStatus, priority, core dates (startDate, targetEndDate, plannedReleaseDate, actualReleaseDate), Jira key, releaseVersions list
- Shows last updated relative time; provides Edit and Link Jira actions
UI Tasks
- Implement Overview layout with two-column summary and key dates section; include Edit and Link Jira actions
BE Tasks
- Provide project read-by-id endpoint returning all displayed fields

Story P.5 — Link Jira epic to project
Description: As an EM, I can link a Jira epic to a project by setting jiraKey.
Acceptance Criteria
- Accepts only uppercase project key format followed by dash and digits; invalid formats are rejected with a clear error
- The Overview shows the Jira key after linking
UI Tasks
- Implement Link Jira action with input validation and error display
BE Tasks
- Reuse project update endpoint; validate jiraKey format and persist on project

Story P.6 — Project Notes (MOMs) minimal
Description: As an EM, I can record meeting notes and decisions per project.
Acceptance Criteria
- List shows notes in reverse chronological order; each note has createdAt, author label, and text up to a practical length
- I can add and delete my own notes; delete requires confirmation
- Empty state explains typical usage (meeting summaries, decisions, follow-ups)
UI Tasks
- Implement Notes tab with add and delete; confirm delete; handle empty state
BE Tasks
- Introduce a simple notes data model associated to projects; implement create, list, and delete endpoints; enforce tenant scoping

Story P.7 — Project Risks minimal
Description: As an EM, I can capture risks for a project.
Acceptance Criteria
- Each risk has title, severity (Low, Medium, High, Critical), status (Open, Mitigated, Closed), owner label, createdAt
- List shows newest first and can be filtered by status; risks can be added and updated; deletion is allowed
UI Tasks
- Implement Risks tab with list, add, edit, delete; severity and status as dropdowns
BE Tasks
- Introduce a simple risks data model associated to projects; implement create, list, update, delete endpoints; enforce tenant scoping

Releases
Story R.1 — Releases list from projects
Description: As an EM, I can view a list of upcoming and recent releases derived from projects.
Acceptance Criteria
- A release row corresponds to a project with plannedReleaseDate or actualReleaseDate; show fields: project name, plannedReleaseDate, actualReleaseDate, confidence derived from healthStatus, status, owner
- Default view shows planned releases within next 90 days and actual releases within last 30 days; filters for date window and team are available
UI Tasks
- Implement list view with filters and click-through to project detail
BE Tasks
- Provide releases listing endpoint that aggregates from projects with the date windows and returns the specified fields

Story R.2 — Releases calendar view (lightweight)
Description: As an EM, I can visualize releases on a simple calendar timeline.
Acceptance Criteria
- Month and week views; items show project name with color cue from confidence; clicking navigates to project detail
UI Tasks
- Implement basic calendar view fed by the same data source as releases list
BE Tasks
- None beyond the releases listing endpoint used by list view

Team Members
Story T.1 — Team Members list
Description: As an EM, I can view all users in my tenant and see their assigned project count.
Acceptance Criteria
- Table columns: name, email, role, assigned project count, last login; search by name or email
- Assigned project count is number of projects where engineeringManager equals the user’s identifier per P.2; if both id and email are stored across records, counting uses either match
UI Tasks
- Implement table with search and pagination
BE Tasks
- Provide users listing endpoint returning the above fields plus assigned project counts computed from projects; enforce tenant scoping

Story T.2 — Team Member detail (lightweight)
Description: As an EM, I can view a user’s basic profile and assigned projects.
Acceptance Criteria
- Shows name, email, role, assigned projects list with status and plannedReleaseDate
UI Tasks
- Implement detail page reachable from list row click
BE Tasks
- Provide user by id endpoint and a companion endpoint that lists projects assigned to the user by engineeringManager matching rule

Sprints
Story S.1 — Introduce Sprint entity and service (minimal)
Description: As an EM, I can manage sprints with minimal attributes.
Acceptance Criteria
- Sprint fields: id, name, team, startDate, endDate, status (Planned, Active, Completed), plannedStoryPoints, completedStoryPoints, isCurrent flag; validation ensures endDate is not before startDate; only one sprint per team can have isCurrent true
UI Tasks
- None for this story; enables Sprints UI stories
BE Tasks
- Add JPA entity, repository, and service; create and update endpoints; enforce uniqueness of current sprint per team at persistence layer

Story S.2 — Sprints list
Description: As an EM, I can view current and upcoming sprints with key metrics.
Acceptance Criteria
- List shows sprint name, team, date range, status, plannedStoryPoints, completedStoryPoints; filter by status and team; current sprints are visually distinct
UI Tasks
- Implement list with filters and pagination
BE Tasks
- Provide sprints listing endpoint supporting filters and pagination; tenant scoping enforced

Story S.3 — Sprint detail and set current
Description: As an EM, I can view and update sprint details and mark a sprint as current.
Acceptance Criteria
- Detail view shows all fields; I can update plannedStoryPoints, completedStoryPoints, status; I can toggle isCurrent true which must clear current flag for other sprints in the same team
UI Tasks
- Implement detail form with validation; provide Set Current action
BE Tasks
- Provide sprint read and update endpoints; on set current, ensure other sprints in the team are updated to isCurrent false within a transaction

Home Integration
Story H.5 — Home consumes sprint and releases data
Description: As an EM, the Home dashboard reflects current sprint and upcoming releases consistently with the Sprints and Releases sections.
Acceptance Criteria
- Home widgets for sprint and releases display the same values as the Sprints and Releases sections for the same filters and time windows
UI Tasks
- Wire Home widget data sources to the defined endpoints; ensure consistent date formatting and relative time labels
BE Tasks
- Ensure dashboard endpoint composes data consistently from projects and sprints endpoints

Security and Cross-Cutting
Story X.1 — Authentication and authorization for POC endpoints
Description: As an EM, my access is authenticated and restricted to my tenant.
Acceptance Criteria
- All new endpoints require a valid JWT; tenant scoping is applied to all queries and mutations; unauthorized requests return 401; forbidden access returns 403 when applicable
UI Tasks
- Attach bearer token to all requests; handle 401 by redirecting to login
BE Tasks
- Apply authentication filters; extract tenantId and userId claims from token; ensure repository queries are tenant-filtered

Story X.2 — Pagination, sorting, and error responses
Description: As an EM, I experience consistent tables and errors.
Acceptance Criteria
- Tables default to page size 20; server returns total count and page metadata; sorting defaults documented per list; validation errors return structured errors with field name and message
UI Tasks
- Implement reusable table and error presentation; persist query parameters in URL
BE Tasks
- Standardize list responses to include page, size, totalElements, totalPages, sort; standardize validation error structure and HTTP status codes

Quality Bar (POC)
- Performance: list endpoints return within 500 ms for 500 projects and 50 sprints
- Reliability: server-side validation for required fields and date ranges; uniqueness for current sprint per team
- Observability: log request ids and error details at WARN and above; redact sensitive data

Out-of-Scope Confirmations
- Jira data sync, conflict resolution, and field mapping UI
- Capacity and velocity reports
- Repos integration
- Role-based UI beyond EM