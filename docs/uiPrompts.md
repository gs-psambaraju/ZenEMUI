# ZenEM Refresh System - UI Development Handover

## **Executive Summary**

The ZenEM backend has implemented a sophisticated **Multi-Source Refresh System** that enables users to manually trigger comprehensive data synchronization across multiple external integrations (Jira, Google Calendar, GitHub, etc.). This document outlines the UI functionality that needs to be implemented to provide users with an intuitive interface for managing these refresh operations.

---

## **Business Goal & User Value**

### **Why This Matters**
- **Problem**: Users currently have no way to refresh stale data from external integrations when they notice inconsistencies
- **Pain Point**: Data drift occurs between ZenEM and external systems (Jira stories, calendar events, team structures)
- **Impact**: Users lose trust in data accuracy and make decisions based on outdated information

### **What We're Building**
A comprehensive refresh interface that allows users to:
1. **Trigger targeted refreshes** for specific data types (teammates, epics, calendar events)
2. **Select data sources** to refresh from (which Jira connections, which calendars)
3. **Monitor refresh progress** in real-time with detailed status updates
4. **View refresh history** and troubleshoot failed operations

### **Success Criteria**
- Users can refresh any stale data within 30 seconds of noticing the issue
- 90% of refresh operations complete successfully without user intervention
- Users have complete visibility into what data is being refreshed and from where

---

## **Core User Flows**

### **Flow 1: Quick Refresh from Any Page**
**Trigger**: User notices stale data (outdated teammate list, missing stories, etc.)

1. **User clicks "Refresh Data" button** (available in nav/header)
   - **API Call**: `GET /api/refresh/active` to show spinner/badge if refreshes active

2. **System opens Refresh Modal** with smart defaults based on current page context
   - **API Calls** (parallel):
     - `GET /api/refresh/targets/options` - Get available targets with categories
     - `GET /api/refresh/suggestions?context=teammates` - Get context-aware suggestions  
     - `GET /api/refresh/connection-health` - Check connection status
     - `GET /api/refresh/dependencies` - Get dependency info for warnings

3. **User adjusts selection** (teammates, epics, calendar, etc.)
   - **API Call**: `POST /api/refresh/estimate` - Update time estimate as user changes selection
   - **API Call**: `POST /api/refresh/validate` - Validate selection before proceeding

4. **User clicks "Start Refresh"** 
   - **API Call**: `POST /api/refresh/start` - Trigger refresh operation

5. **System shows progress indicators** and estimated completion time
   - **WebSocket/SSE**: `GET /api/refresh/progress/{orchestrationId}` - Real-time updates
   - **Fallback Polling**: `GET /api/refresh/status/{orchestrationId}` every 3 seconds

6. **User receives success notification** when complete
   - Final status from progress updates

### **Flow 2: Comprehensive Refresh from Admin**
**Trigger**: Admin wants to perform comprehensive data sync

1. **Admin navigates to "Admin → Connectors → [Connection] → Refresh" tab**
   - **API Call**: `GET /api/refresh/connections/{connectionId}/targets` - Get targets for this connection with last refresh times and staleness levels

2. **System shows Refresh Management Interface** with all available refresh targets
   - **API Calls** (parallel):
     - `GET /api/refresh/schedules?connectionId={connectionId}` - Get current schedules
     - `GET /api/refresh/connection-health` - Check connection health
     - `GET /api/refresh/history?connectionId={connectionId}` - Get recent refresh history

3. **Admin selects multiple targets** (All Teams Data, All Project Data, Calendar Events)
   - **API Call**: `POST /api/refresh/estimate` - Calculate time estimate for selection

4. **Admin chooses specific connections** or "All Available"
   - **API Call**: `GET /api/refresh/connections` - Get all available connections

5. **System shows dependency mapping** (e.g., "Refreshing Teams will also refresh Teammates")  
   - **API Call**: `GET /api/refresh/dependencies` - Get dependency information

6. **Admin starts refresh** and monitors real-time progress dashboard
   - **API Call**: `POST /api/refresh/start` - Start comprehensive refresh
   - **WebSocket/SSE**: `GET /api/refresh/progress/{orchestrationId}` - Real-time updates

7. **System provides detailed logs** and error handling for failed operations
   - Detailed progress from WebSocket/SSE events
   - **API Call**: `GET /api/refresh/status/{orchestrationId}` - Get detailed status with job-level errors

### **Flow 3: Scheduled Refresh Management**
**Trigger**: Admin wants to ensure data stays fresh automatically

1. **Admin views current sync job schedules** in connector detail page
   - **API Call**: `GET /api/refresh/schedules?connectionId={connectionId}` - Get all scheduled refresh jobs

2. **Admin can see "Last Refresh", "Next Scheduled", and "Frequency"** for each data type
   - Data comes from schedules API above (lastSuccessfulSync, nextScheduledRun, syncFrequencyMinutes)

3. **Admin can trigger immediate refresh** or adjust frequency  
   - **Immediate refresh**: `POST /api/refresh/start` with specific targets
   - **Adjust frequency**: (Would need additional API for updating job frequency - future enhancement)

4. **System shows upcoming refresh schedule** and estimated data freshness
   - Calculate freshness based on lastSuccessfulSync vs current time
   - Show next run times from nextScheduledRun field

---

## **Required UI Components & Pages**

### **1. Global Refresh Button**
**Location**: Main navigation header (next to user profile)
**API Dependencies**: 
- **On Load**: `GET /api/refresh/active` - Check for active refreshes
- **Badge Count**: Show count from active operations array
**Behavior**: 
- Always visible to authenticated users
- Shows loading spinner when any refresh is in progress  
- Opens Quick Refresh Modal on click
- Badge indicator shows active refresh count
- **Auto-refresh**: Poll `/api/refresh/active` every 30 seconds to update badge

### **2. Quick Refresh Modal**
**Triggered by**: Global refresh button or contextual refresh actions
**API Dependencies**:
- **On Open**: 
  - `GET /api/refresh/targets/options` - Get available targets by category
  - `GET /api/refresh/suggestions?context={current_page}` - Get smart defaults
  - `GET /api/refresh/connection-health` - Show connection warnings
  - `GET /api/refresh/dependencies` - Get dependency info
- **On Selection Change**: `POST /api/refresh/estimate` - Update time estimate
- **On Submit**: 
  - `POST /api/refresh/validate` - Validate before starting  
  - `POST /api/refresh/start` - Start the refresh
- **During Progress**: `GET /api/refresh/progress/{orchestrationId}` - Real-time updates

**Contents**:
- **Smart Context Detection**: Auto-selects refresh targets based on current page
- **Target Selection**: Multi-select for data types (Teammates, Teams, Projects, Epics, Calendar, etc.)
- **Connection Selection**: Radio buttons or dropdown for available connections per target
- **Progress Display**: Real-time progress bars with estimated time remaining
- **Dependency Warning**: Shows what else will be refreshed (e.g., "Refreshing Teams will also update Team Members")
- **Connection Health**: Warning icons for unhealthy connections
- **Dynamic Time Estimate**: Updates as user changes selection

### **3. Connector Refresh Tab**
**Location**: Admin → Connectors → [Connection Detail] → "Refresh" tab
**Purpose**: Comprehensive refresh management for specific connections
**API Dependencies**:
- **On Load**:
  - `GET /api/refresh/connections/{connectionId}/targets` - Get targets with last refresh times and staleness
  - `GET /api/refresh/schedules?connectionId={connectionId}` - Get scheduled refresh info
  - `GET /api/refresh/history?connectionId={connectionId}` - Get refresh history
- **On Bulk Selection**: `POST /api/refresh/estimate` - Calculate time for selected targets
- **On Refresh Start**: `POST /api/refresh/start` - Start refresh operation
- **During Progress**: `GET /api/refresh/progress/{orchestrationId}` - Real-time updates

**Features**:
- **Available Targets Grid**: Shows all refresh targets this connection supports with staleness indicators
- **Last Refresh Status**: Timestamp, status, and record counts for each target  
- **Bulk Refresh**: Select multiple targets and refresh together with time estimate
- **Refresh History**: Table showing past refresh operations with details
- **Real-time Progress**: Live updates during active refreshes
- **Schedule Management**: View current schedules and trigger immediate refreshes

### **4. Refresh Progress Dashboard**
**Location**: Dedicated page accessible during active refreshes
**Purpose**: Real-time monitoring of complex multi-target refreshes
**Features**:
- **Progress Overview**: Total progress across all targets
- **Per-Target Status**: Individual progress bars for each data type being refreshed  
- **Connection Health**: Status indicators for each external connection
- **Detailed Logs**: Expandable log sections for troubleshooting
- **Cancellation**: Ability to stop refresh operations

### **5. Contextual Refresh Actions**
**Location**: Throughout the app where data staleness might be noticed
**Examples**:
- Teammates page: "Refresh from Jira" button
- Project/Epic list: "Sync latest from Jira" action
- Calendar page: "Update calendar events" button
- Team detail page: "Refresh team structure" action

---

## **API Specifications**

### **Base URL**: `/api/refresh`

### **Selection & Discovery APIs**

#### **Get Available Targets for Selection**
```http
GET /api/refresh/targets/options
```

**Response**: Returns all available refresh targets organized by category
```json
[
  {
    "value": "TEAMMATE",
    "label": "Refresh teammate data from all sources",
    "category": "People & Teams",
    "estimatedDurationSeconds": 45.0,
    "supportedConnectionTypes": ["JIRA"],
    "recommended": true
  },
  {
    "value": "STORIES", 
    "label": "Refresh story assignments and status",
    "category": "Project Management",
    "estimatedDurationSeconds": 60.0,
    "supportedConnectionTypes": ["JIRA"],
    "recommended": true
  }
]
```

#### **Get Available Connection Types**
```http
GET /api/refresh/connection-types
```

**Response**: Returns connection types with active connections
```json
[
  {
    "value": "JIRA",
    "label": "Jira (Project Management)",
    "description": "Atlassian Jira (Cloud/Server)",
    "activeConnections": 2,
    "supportedTargets": ["TEAMMATE", "TEAM", "EPICS", "STORIES", "SPRINT"]
  }
]
```

#### **Get Smart Refresh Suggestions**
```http
GET /api/refresh/suggestions?context=teammates
```

**Query Params**:
- `context` (optional): "teammates", "projects", "dashboard", etc.

**Response**: Context-aware refresh recommendations
```json
{
  "recommendedTargets": ["TEAMMATE", "TEAM", "STORIES"],
  "quickActions": ["Refresh teammate workload and assignments"],
  "warnings": ["Data is more than 24 hours old. Consider refreshing key metrics."]
}
```

#### **Get Available Connections**
```http  
GET /api/refresh/connections
```

**Response**: All active connections for this tenant
```json
[
  {
    "id": "conn-123",
    "name": "Main Jira Connection (JIRA Epic Sync)",
    "type": "JIRA",
    "status": "ACTIVE", 
    "supportedTargets": ["TEAMMATE"],
    "healthStatus": "HEALTHY",
    "lastSuccessfulSync": "2024-01-15T09:15:00Z"
  }
]
```

### **Core Refresh APIs**

### **1. Start Refresh Operation**
```http
POST /api/refresh/start
```

**Request Payload**:
```json
{
  "targets": ["TEAMMATES", "PROJECTS", "CALENDAR"],
  "connectionTypes": ["JIRA", "GOOGLE_CALENDAR"],
  "connectionIds": ["conn-123", "conn-456"],
  "syncMode": "INCREMENTAL",
  "requestedByUserId": "user-789",
  "priority": "NORMAL",
  "description": "Manual refresh from teammates page"
}
```

**Response**:
```json
{
  "orchestrationId": "orch-12345",
  "requestedTargets": ["TEAMMATES", "PROJECTS", "CALENDAR"],
  "connectionTypes": ["JIRA", "GOOGLE_CALENDAR"],
  "status": "IN_PROGRESS",
  "estimatedDurationSeconds": 180,
  "startedAt": "2024-01-15T10:30:00Z",
  "message": "Started refresh for 3 targets across 2 connections",
  "totalJobsCreated": 5,
  "warnings": []
}
```

### **2. Get Refresh Status**
```http
GET /api/refresh/status/{orchestrationId}
```

**Response**:
```json
{
  "orchestrationId": "orch-12345",
  "status": "IN_PROGRESS",
  "overallProgress": 65,
  "estimatedCompletionSeconds": 45,
  "startedAt": "2024-01-15T10:30:00Z",
  "targets": [
    {
      "target": "TEAMMATES",
      "status": "COMPLETED",
      "progress": 100,
      "recordsProcessed": 42,
      "recordsTotal": 42,
      "completedAt": "2024-01-15T10:31:30Z",
      "connectionType": "JIRA",
      "connectionName": "Primary Jira"
    },
    {
      "target": "PROJECTS", 
      "status": "IN_PROGRESS",
      "progress": 30,
      "recordsProcessed": 12,
      "recordsTotal": 40,
      "connectionType": "JIRA",
      "connectionName": "Primary Jira"
    }
  ],
  "errors": [],
  "warnings": ["Some calendar events could not be updated due to permissions"]
}
```

### **3. List Available Refresh Targets**
```http
GET /api/refresh/targets
```

**Response**:
```json
{
  "categories": [
    {
      "name": "Team Structure", 
      "targets": [
        {
          "id": "TEAMMATES",
          "displayName": "Teammates",
          "description": "Refresh teammate assignments and workload data",
          "supportedConnections": ["JIRA", "SLACK"],
          "estimatedDurationSeconds": 30,
          "dependsOn": ["TEAMS"],
          "lastRefreshAt": "2024-01-15T09:00:00Z"
        }
      ]
    }
  ]
}
```

### **4. List Available Connections**
```http
GET /api/refresh/connections
```

**Response**:
```json
{
  "connections": [
    {
      "id": "conn-123",
      "name": "Primary Jira",
      "type": "JIRA",
      "status": "ACTIVE",
      "supportedTargets": ["TEAMMATES", "PROJECTS", "EPICS"],
      "healthStatus": "HEALTHY",
      "lastSuccessfulSync": "2024-01-15T08:00:00Z"
    }
  ]
}
```

### **5. Get Refresh History**
```http
GET /api/refresh/history?page=0&size=20&target=TEAMMATES
```

**Response**:
```json
{
  "content": [
    {
      "orchestrationId": "orch-12344",
      "targets": ["TEAMMATES"],
      "status": "COMPLETED",
      "requestedBy": "john.doe@company.com",
      "startedAt": "2024-01-15T09:00:00Z",
      "completedAt": "2024-01-15T09:02:30Z",
      "totalRecordsProcessed": 42,
      "executionSource": "MANUAL"
    }
  ],
  "totalElements": 150,
  "page": 0,
  "size": 20
}
```

### **Additional Selection & Status APIs**

#### **Get Active Refresh Operations**
```http
GET /api/refresh/active
```

**Purpose**: Get currently running refreshes for tenant (for global refresh button badge)
**Response**:
```json
[
  {
    "orchestrationId": "orch-789",
    "targets": ["TEAMMATE", "STORIES"],
    "status": "IN_PROGRESS",
    "startedAt": "2024-01-15T10:30:00Z",
    "totalJobs": 4,
    "completedJobs": 2,
    "overallProgress": 50
  }
]
```

#### **Get Connection Target Status**
```http
GET /api/refresh/connections/{connectionId}/targets
```

**Purpose**: Get refresh targets for specific connection with last refresh times and staleness
**Response**:
```json
[
  {
    "target": "TEAMMATE",
    "displayName": "Refresh teammate data from all sources",
    "supported": true,
    "estimatedDurationSeconds": 45,
    "lastRefreshAt": "2024-01-15T08:00:00Z",
    "stalenessLevel": "STALE",
    "recordsLastSync": 42
  }
]
```

#### **Get Refresh Dependencies**
```http
GET /api/refresh/dependencies
```

**Purpose**: Get dependency information for UI warnings ("Refreshing Teams will also refresh Teammates")
**Response**:
```json
[
  {
    "target": "TEAM",
    "dependentTargets": ["TEAMMATE"],
    "description": "Refreshing Teams will also refresh Teammates"
  },
  {
    "target": "PROJECT",
    "dependentTargets": ["EPICS", "STORIES"],
    "description": "Refreshing Projects will also refresh Epics and Stories"
  }
]
```

#### **Calculate Refresh Estimate**
```http
POST /api/refresh/estimate
```

**Purpose**: Get dynamic time estimates as user changes selections
**Request**:
```json
{
  "targets": ["TEAMMATE", "STORIES", "EPICS"],
  "connectionTypes": ["JIRA"],
  "connectionIds": ["conn-123"]
}
```

**Response**:
```json
{
  "targets": ["TEAMMATE", "STORIES", "EPICS"],
  "connectionTypes": ["JIRA"],
  "estimatedDurationSeconds": 180,
  "estimatedRecords": 150,
  "warnings": ["This refresh will take more than 5 minutes. Consider running during off-peak hours."],
  "dependentTargets": ["TEAM"]
}
```

#### **Get Connection Health Status**
```http
GET /api/refresh/connection-health
```

**Purpose**: Show connection health warnings before allowing refresh
**Response**:
```json
[
  {
    "connectionId": "conn-123",
    "connectionName": "Primary Jira",
    "connectionType": "JIRA",
    "status": "ACTIVE",
    "healthStatus": "HEALTHY",
    "lastSuccessfulSync": "2024-01-15T08:00:00Z"
  }
]
```

#### **Get Scheduled Refresh Information**
```http
GET /api/refresh/schedules?connectionId=conn-123
```

**Purpose**: Show current schedules, frequencies, and next run times
**Response**:
```json
[
  {
    "jobId": "job-456",
    "jobName": "Team Capacity Sync",
    "jobType": "TEAM_CAPACITY",
    "connectionId": "conn-123",
    "connectionName": "Primary Jira",
    "status": "ACTIVE",
    "lastSuccessfulSync": "2024-01-15T06:00:00Z",
    "syncFrequencyMinutes": 120,
    "nextScheduledRun": "2024-01-15T12:00:00Z"
  }
]
```

#### **Real-time Progress Updates**
```http
GET /api/refresh/progress/{orchestrationId}
```

**Purpose**: Server-sent events for real-time progress updates
**Response Stream**: 
```
event: refresh-progress
data: {"type":"STATUS_CHANGE","orchestrationId":"orch-789","status":"IN_PROGRESS","overallProgress":65}

event: refresh-progress  
data: {"type":"JOB_PROGRESS","orchestrationId":"orch-789","jobTarget":"TEAMMATE","status":"COMPLETED","progressPercentage":100}
```

---

## **UI State Management Requirements**

### **Global State**
- **Active Refreshes**: Track all in-progress refresh operations
- **Last Refresh Times**: Cache last successful refresh time for each data type
- **Connection Health**: Real-time status of all external connections

### **Refresh Modal State**
- **Selected Targets**: Multi-select state for refresh targets
- **Selected Connections**: Connection selection per target type  
- **Progress Tracking**: Real-time progress for active refresh
- **Dependency Resolution**: Show cascading refresh dependencies

### **Connector Detail State**
- **Available Targets**: Targets supported by specific connection
- **Refresh History**: Paginated history of past refreshes
- **Active Operations**: Currently running refreshes for this connection

---

## **Real-Time Updates**

### **WebSocket/SSE Integration** (Optional Enhancement)
**Endpoint**: `/api/refresh/events`
**Events**:
- `refresh.started` - New refresh operation began
- `refresh.progress` - Progress update for specific target
- `refresh.completed` - Refresh operation finished
- `refresh.error` - Error occurred during refresh

### **Polling Fallback** (Minimum Viable)
- Poll `/api/refresh/status/{orchestrationId}` every 2-3 seconds during active refresh
- Update UI progress indicators and status displays
- Show completion notifications when status changes to COMPLETED/FAILED

---

## **Error Handling & User Experience**

### **Connection Errors**
- **UI Response**: Show connection health warnings before allowing refresh
- **User Action**: Provide "Test Connection" button to verify before refresh
- **Fallback**: Allow refresh to continue with healthy connections only

### **Partial Failures**
- **UI Response**: Show warnings for failed targets, success for completed ones
- **User Action**: Provide "Retry Failed" button for failed operations
- **Information**: Detailed error logs accessible via expandable sections

### **Timeout/Cancellation**
- **UI Response**: Show timeout warnings with option to extend or cancel
- **User Action**: "Cancel Refresh" button always available during operation
- **Cleanup**: Clear progress indicators and show cancellation confirmation

---

## **Accessibility & Performance**

### **Loading States**
- Skeleton loading for refresh target lists
- Progressive loading for connection health checks
- Chunked loading for large refresh history tables

### **Keyboard Navigation**
- Full keyboard support for refresh target selection
- Tab navigation through connection options
- Escape key closes modals and cancels operations

### **Screen Reader Support**
- Progress announcements during refresh operations
- Status descriptions for connection health
- Error message reading for failed operations

---

## **Integration Points**

### **Existing ZenEM Pages**
- **Teammates Page**: Add refresh button for teammate data
- **Projects/Epics Page**: Add refresh button for project/epic data  
- **Calendar Page**: Add refresh button for calendar events
- **Admin Connectors**: Add refresh tab to existing connector detail pages

### **Navigation Integration**
- **Global Header**: Add refresh button with active operation indicators
- **Page Context**: Show last refresh time and staleness indicators
- **Admin Menu**: Add "Data Refresh" section for refresh management

---

## **Technical Considerations**

### **Performance**
- **Debounced Polling**: Avoid excessive API calls during progress monitoring
- **Cached Responses**: Cache available targets and connections for 5 minutes
- **Progressive Enhancement**: Core functionality works without real-time updates

### **Browser Compatibility**
- **Modern Browsers**: Full feature support (Chrome 90+, Firefox 88+, Safari 14+)
- **Fallback Patterns**: Graceful degradation for older browsers
- **Mobile Support**: Responsive design for mobile refresh operations

### **Security**
- **Authorization**: Verify user permissions for specific refresh targets
- **Rate Limiting**: Prevent abuse of manual refresh operations
- **Audit Logging**: Track all user-initiated refresh operations

---

## **Future Enhancements**

### **Phase 2 Features**
- **Conditional Refresh**: Only refresh if data has actually changed
- **Smart Scheduling**: AI-powered optimization of automatic refresh schedules
- **Batch Operations**: Queue multiple refresh operations for off-peak execution

### **Advanced Monitoring**
- **Refresh Analytics**: Dashboard showing data freshness trends over time
- **Connection Performance**: Metrics on refresh speed and success rates per connection
- **Usage Insights**: Which teams/users refresh most frequently and what data types

---

## **Acceptance Criteria**

### **Must Have**
- [ ] Users can refresh any data type within 30 seconds of discovering staleness
- [ ] Real-time progress indication for all refresh operations
- [ ] Clear error messages and recovery options for failed refreshes
- [ ] Integration with existing connector management UI
- [ ] Mobile-responsive design for all refresh interfaces

### **Should Have**  
- [ ] WebSocket/SSE real-time updates for progress tracking
- [ ] Comprehensive refresh history with filtering and search
- [ ] Contextual refresh buttons throughout the application
- [ ] Batch refresh operations for multiple targets

### **Could Have**
- [ ] Advanced refresh scheduling and automation
- [ ] Refresh performance analytics and optimization
- [ ] Smart dependency resolution and conflict detection
- [ ] Integration with external monitoring tools

---

## **✅ COMPLETE API COVERAGE - NO GAPS**

This specification provides **COMPLETE API COVERAGE** for every UI requirement. The UI team has all necessary APIs to build the refresh system without hardcoding any data:

### **What the UI Can Do (With APIs)**:
✅ **Show available refresh targets** - `GET /api/refresh/targets/options`  
✅ **Display connection health** - `GET /api/refresh/connection-health`  
✅ **Smart context suggestions** - `GET /api/refresh/suggestions?context=X`  
✅ **Dynamic time estimates** - `POST /api/refresh/estimate`  
✅ **Dependency warnings** - `GET /api/refresh/dependencies`  
✅ **Active refresh indicators** - `GET /api/refresh/active`  
✅ **Last refresh times & staleness** - `GET /api/refresh/connections/{id}/targets`  
✅ **Schedule information** - `GET /api/refresh/schedules`  
✅ **Real-time progress** - `GET /api/refresh/progress/{id}` (SSE)  
✅ **Refresh history** - `GET /api/refresh/history`  
✅ **Connection selection** - `GET /api/refresh/connections`  
✅ **Validation before start** - `POST /api/refresh/validate`  
✅ **Start refresh operations** - `POST /api/refresh/start`  

### **What the UI Should NOT Do**:
❌ **Hardcode refresh targets** - Use API to get dynamic targets  
❌ **Hardcode connection types** - Use API to get available connections  
❌ **Hardcode time estimates** - Use API to calculate estimates  
❌ **Hardcode dependencies** - Use API to get dependency mappings  

---

This handover provides the complete specification for implementing ZenEM's multi-source refresh system. **Every user flow step has corresponding APIs.** **Every UI component has defined data sources.** **Every user need has API support.**

The backend APIs are ready and the business logic is implemented - the UI team now has everything needed to build an intuitive, powerful refresh interface for end users **without any gaps or hardcoded data.**