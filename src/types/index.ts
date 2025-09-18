// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
}

// Onboarding status types
export type OnboardingStatusType = 'NOT_ONBOARDED' | 'PARTIALLY_ONBOARDED' | 'FULLY_ONBOARDED' | 'COMPLETED';

export interface OnboardingStatus {
  status: OnboardingStatusType;
  description: string;
  nextActions: NextAction[];
}

export interface NextAction {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
}

export interface StatusResponse {
  user: User;
  onboardingStatus: OnboardingStatus;
  company: {
    name: string;
    tenantId: string;
  };
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Loading and error states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Form validation
export interface FormErrors {
  [key: string]: string;
}

// Re-export for better compatibility
export type { FormErrors as FormErrorsType };

// Planning Periods types (Story 0.1)
export type PeriodType = 'YEAR' | 'HALF' | 'QUARTER' | 'MONTH';

export interface PlanningPeriod {
  id: string;
  name: string;
  periodType: PeriodType;
  level: number;
  parentPeriodId?: string;
  startDate: string;
  endDate: string;
  planningStartDate?: string;
  planningEndDate?: string;
  reviewStartDate?: string;
  reviewEndDate?: string;
  isActive: boolean;
}

export interface CreatePlanningPeriodRequest {
  name: string;
  periodType: PeriodType;
  level: number;
  parentPeriodId?: string;
  startDate: string;
  endDate: string;
  planningStartDate?: string;
  planningEndDate?: string;
  reviewStartDate?: string;
  reviewEndDate?: string;
  isActive: boolean;
}

export interface FiscalConfig {
  fiscalYearStartMonth: number; // 1-12 (Jan=1, Feb=2, etc.)
}

export interface ApplyTemplateRequest {
  template: 'STANDARD' | 'UK' | 'CUSTOM';
  year: number;
}

export interface PlanningPeriodError {
  message: string;
  code: string;
  fieldErrors?: Record<string, string>;
}

// OKR Types types (Story 0.2)
export interface OkrType {
  id: string;
  code: string;
  name: string;
  displayName: string;
  level: number;
  description: string | null;
  isActive: boolean;
}

export interface UpdateOkrTypeRequest {
  displayName: string;
  isActive: boolean;
  description?: string | null;
}

export interface OkrTypeError {
  message: string;
  code: 'IMMUTABLE_FIELD' | 'TYPE_IN_USE';
  fieldErrors?: Record<string, string>;
}

// Project Management types (from uiPrompts.md)
export type ProjectType = 'EPIC' | 'FEATURE' | 'INITIATIVE' | 'BUG_FIX' | 'TECHNICAL_DEBT' | 'RESEARCH';

export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'ON_HOLD' | 'DONE' | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export type MocksStatus = 'GROOMED' | 'YET_TO_BE_DISCUSSED' | 'NOT_APPLICABLE';

export interface Project {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  teamName?: string;
  initiativeId?: string;
  initiativeName?: string;
  projectType: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  healthStatus: HealthStatus;
  
  // Timeline fields
  startDate?: string;
  targetEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  plannedReleaseDate?: string;
  actualReleaseDate?: string;
  plannedDeploymentDate?: string;
  actualDeploymentDate?: string;
  
  // Readiness tracking
  groomedDate?: string;
  mocksStatus?: MocksStatus;
  mocksFinalizedDate?: string;
  
  // Team assignments
  engineeringManagerId?: string;
  engineeringManagerName?: string;
  productManagerId?: string;
  productManagerName?: string;
  
  // Jira integration
  jiraKey?: string;
  jiraConnectionId?: string;
  jiraProjectKey?: string;
  jiraIssueId?: string;
  jiraLastSync?: string;
  
  // Hierarchy
  parentProjectId?: string;
  parentProjectName?: string;
  
  // Release versions
  releaseVersions?: string[];
  
  // Audit fields
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  teamId: string;
  initiativeId?: string;
  projectType?: ProjectType;
  priority?: Priority;
  
  // Timeline Planning
  startDate?: string;
  targetEndDate?: string;
  plannedReleaseDate?: string;
  plannedDeploymentDate?: string;
  
  // Readiness Tracking
  groomedDate?: string;
  mocksStatus?: MocksStatus;
  mocksFinalizedDate?: string;
  
  // Team Assignments
  engineeringManagerId?: string;
  productManagerId?: string;
  
  // Jira Integration
  jiraKey?: string;
  jiraConnectionId?: string;
  jiraProjectKey?: string;
  
  // Release Management
  releaseVersions?: string[];
  
  // Hierarchy
  parentProjectId?: string;
}

// Epic type aliases for terminology change (backend compatibility)
export type EpicType = ProjectType;
export type CreateEpicRequest = CreateProjectRequest;
export type UpdateEpicRequest = UpdateProjectRequest;

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  healthStatus?: HealthStatus;
  priority?: Priority;
  
  // Timeline updates
  actualStartDate?: string;
  actualEndDate?: string;
  actualReleaseDate?: string;
  actualDeploymentDate?: string;
  
  // Team reassignments
  engineeringManagerId?: string;
  productManagerId?: string;
  
  // Jira sync updates
  jiraIssueId?: string;
  
  // Release version updates (replaces existing)
  releaseVersions?: string[];
}

// Teams & Teammates Management types (from uiPrompts.md)
export type TeammateRole = 'DEVELOPER' | 'QA' | 'DESIGNER' | 'PM' | 'EM';

// New role metadata types (domain-driven)
export interface RoleOption {
  code: string; // enum code used by backend
  displayName: string; // user label
  category?: string;
  level?: string | null;
  specialization?: string | null;
  isLegacy?: boolean;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  activeProjectCount: number;
  members?: Teammate[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface Teammate {
  id: string;
  name: string;
  email: string;
  role: TeammateRole; // legacy
  primaryRoleCode?: string; // new
  secondaryRoleCode?: string | null; // legacy - single role (deprecated)
  secondaryRoles?: string[]; // new - multiple roles array
  primaryRoleDisplayName?: string;
  secondaryRoleDisplayName?: string; // legacy - single role display name
  secondaryRoleDisplayNames?: string[]; // new - multiple role display names
  teamId?: string | null;
  teamName?: string | null;
  capacity: number;
  currentAllocation: number;
  assignedProjectCount: number;
  assignedStoryCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeammateRequest {
  name: string;
  email: string;
  role?: TeammateRole; // legacy compatibility
  primaryRoleCode?: string; // new
  secondaryRoleCode?: string | null; // legacy - single role (deprecated)
  secondaryRoles?: string[]; // new - multiple roles array
  teamId?: string | null;
  capacity?: number;
  // currentAllocation is calculated by backend from team allocations
}

export interface UpdateTeammateRequest {
  name?: string;
  email?: string;
  role?: TeammateRole; // legacy compatibility
  primaryRoleCode?: string; // new
  secondaryRoleCode?: string | null; // legacy - single role (deprecated)
  secondaryRoles?: string[]; // new - multiple roles array
  teamId?: string | null;
  capacity?: number;
  // currentAllocation is calculated by backend from team allocations
}

export interface AssignTeamRequest {
  teamId: string | null;
}

export interface BulkAssignTeammatesRequest {
  teammateIds: string[];
}

export interface BulkAssignResponse {
  assignedCount: number;
  assignedTeammates: Array<{
    id: string;
    name: string;
    teamId: string;
    teamName: string;
  }>;
}

// Leave Management types (from uiPrompts.md)
export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'BEREAVEMENT' | 'PARENTAL' | 'TRAINING' | 'JURY_DUTY' | 'EMERGENCY' | 'SABBATICAL' | 'PLANNED_VACATION';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';

export type CapacityStatus = 'AVAILABLE' | 'AT_CAPACITY' | 'OVER_ALLOCATED';

export interface TeammateLeave {
  id: string;
  teamMemberId: string;
  teamMemberName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  totalHours: number;
  description?: string;
  status: LeaveStatus;
  createdBy: string;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  hoursPerDay?: number;
  description?: string;
}

export interface UpdateLeaveRequest {
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  hoursPerDay?: number;
  description?: string;
  status?: LeaveStatus;
}

// Holiday Calendar Management types
export interface HolidayCalendar {
  id: string;
  name: string;
  region: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  holidayCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayCalendarRequest {
  name: string;
  region: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateHolidayCalendarRequest {
  name?: string;
  region?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface Holiday {
  id: string;
  calendarId: string;
  name: string;
  holidayDate: string;
  isRecurring: boolean;
  recurringMonth?: number;
  recurringDay?: number;
  description?: string;
  createdAt: string;
}

export interface CreateHolidayRequest {
  name: string;
  holidayDate: string;
  isRecurring?: boolean;
  recurringMonth?: number;
  recurringDay?: number;
  description?: string;
}

export interface AssignHolidayCalendarsRequest {
  calendarIds: string[];
}

// Capacity Planning types
export type AdjustmentType = 'TRAINING' | 'INTERVIEW' | 'ADMIN' | 'MEETING' | 'MENTORING' | 'CODE_REVIEW' | 'CUSTOM';

export interface CapacityAdjustment {
  id: string;
  teamMemberId: string;
  sprintId?: string;
  adjustmentType: AdjustmentType;
  adjustmentHours: number;
  description: string;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateCapacityAdjustmentRequest {
  adjustmentType: AdjustmentType;
  adjustmentHours: number;
  description: string;
  startDate?: string;
  endDate?: string;
  sprintId?: string;
}

export interface CapacityBreakdown {
  teamMemberId: string;
  teamMemberName: string;
  sprintId?: string;
  sprintName?: string;
  baseHours: number;
  leaveHours: number;
  holidayHours: number;
  meetingHours: number;
  customAdjustmentHours: number;
  availableHours: number;
  utilizationPercentage: number;
  leaves: Array<{
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    hours: number;
    description?: string;
  }>;
  holidays: Array<{
    holidayName: string;
    holidayDate: string;
    hours: number;
  }>;
  adjustments: Array<{
    adjustmentType: AdjustmentType;
    hours: number;
    description: string;
  }>;
  calculationDate: string;
}

// Extended Teammate interface with capacity information
export interface TeammateWithCapacity extends Teammate {
  baseCapacity: number;
  availableHours: number;
  allocatedHours: number;
  capacityStatus: CapacityStatus;
  upcomingLeaves: Array<{
    startDate: string;
    endDate: string;
    leaveType: LeaveType;
    totalHours: number;
  }>;
}

// Team Allocation types (from updated uiPrompts.md)
export interface TeamAllocation {
  teammateId: string;
  teammateName: string;
  teammateEmail: string;
  teammateRole: TeammateRole;
  allocationPercentage: number;
  baseCapacity: number;
  allocatedHours: number;
  availableHours: number;
  currentUtilization: number;
  upcomingLeaves: Array<{
    startDate: string;
    endDate: string;
    leaveType: LeaveType;
    totalHours: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AddTeammateToTeamRequest {
  teammateId: string;
  allocationPercentage: number;
}

export interface UpdateTeamAllocationRequest {
  allocationPercentage: number;
}

export interface AvailableTeammate {
  id: string;
  name: string;
  email: string;
  role: TeammateRole;
  baseCapacity: number;
  availableHours: number;
  currentAllocations: Array<{
    teamId: string;
    teamName: string;
    allocationPercentage: number;
  }>;
  totalAllocationPercentage: number;
  remainingAllocationPercentage: number;
  capacityStatus: CapacityStatus;
  upcomingLeaves: Array<{
    startDate: string;
    endDate: string;
    leaveType: LeaveType;
    totalHours: number;
  }>;
}

export interface TeamCapacityMetrics {
  teamId: string;
  teamName: string;
  totalTeammates: number;
  totalBaseCapacity: number;
  totalAllocatedCapacity: number;
  totalAvailableCapacity: number;
  averageUtilization: number;
  capacityStatus: CapacityStatus;
  upcomingLeaveDays: number;
  upcomingHolidayDays: number;
  capacityTrends: Array<{
    period: string;
    plannedCapacity: number;
    actualCapacity: number;
    utilizationPercentage: number;
  }>;
  riskFactors: Array<{
    type: 'OVER_ALLOCATED' | 'UPCOMING_LEAVES' | 'SKILL_GAP' | 'SINGLE_POINT_OF_FAILURE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    impactedTeammates: string[];
  }>;
}

// Calendar types
export type CalendarEventType =
  | 'LEAVE'
  | 'HOLIDAY'
  | 'PROJECT_START'
  | 'PROJECT_DEADLINE'
  | 'PROJECT_MILESTONE'
  | 'SPRINT_START'
  | 'SPRINT_END'
  | 'TEAM_EVENT'
  | 'OTHER';

export interface CalendarEventResponse {
  id: string;
  eventType: CalendarEventType;
  eventDate: string; // YYYY-MM-DD
  endDate?: string | null;
  title: string;
  description?: string;
  teamMemberName?: string;
  teamName?: string;
  projectName?: string;
  sprintName?: string;
  durationDays: number;
  isMultiDay?: boolean;
}


// Extended Team interface with capacity information
export interface TeamWithCapacity extends Team {
  totalCapacity: number;
  availableCapacity: number;
  utilizationPercentage: number;
  capacityStatus: CapacityStatus;
  upcomingLeaveDays: number;
  assignedHolidayCalendars: string[];
  allocations: TeamAllocation[];
  capacityMetrics: TeamCapacityMetrics;
}

// Multi-Source Refresh System types (from uiPrompts.md)
export type RefreshTarget = 
  | 'TEAMMATES'
  | 'TEAM'
  | 'PROJECTS'
  | 'EPICS'
  | 'STORIES'
  | 'SPRINT'
  | 'CALENDAR'
  | 'TEAM_CAPACITY';

export type ConnectionType = 'JIRA' | 'GOOGLE_CALENDAR' | 'SLACK' | 'GITHUB';

export type RefreshStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type SyncMode = 'INCREMENTAL' | 'FULL';

export type RefreshPriority = 'LOW' | 'NORMAL' | 'HIGH';

export type StalenessLevel = 'FRESH' | 'STALE' | 'VERY_STALE';

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'UNHEALTHY';

export type ExecutionSource = 'MANUAL' | 'SCHEDULED' | 'AUTO';

// Refresh Target Option (for UI selection)
export interface RefreshTargetOption {
  value: RefreshTarget;
  label: string;
  category: string;
  estimatedDurationSeconds: number;
  supportedConnectionTypes: ConnectionType[];
  recommended: boolean;
}

// Connection Type Option
export interface RefreshConnectionTypeOption {
  value: ConnectionType;
  label: string;
  description: string;
  activeConnections: number;
  supportedTargets: RefreshTarget[];
}

// Smart Refresh Suggestions
export interface RefreshSuggestions {
  recommendedTargets: RefreshTarget[];
  quickActions: string[];
  warnings: string[];
}

// Available Connection
export interface RefreshConnection {
  id: string;
  name: string;
  type: ConnectionType;
  status: 'ACTIVE' | 'DISABLED' | 'ERROR';
  supportedTargets: RefreshTarget[];
  healthStatus: HealthStatus;
  lastSuccessfulSync: string;
}

// Start Refresh Request
export interface StartRefreshRequest {
  targets: RefreshTarget[];
  connectionTypes?: ConnectionType[];
  connectionIds?: string[];
  syncMode?: SyncMode;
  requestedByUserId?: string;
  priority?: RefreshPriority;
  description?: string;
}

// Start Refresh Response
export interface StartRefreshResponse {
  orchestrationId: string;
  requestedTargets: RefreshTarget[];
  connectionTypes: ConnectionType[];
  status: RefreshStatus;
  estimatedDurationSeconds: number;
  startedAt: string;
  message: string;
  totalJobsCreated: number;
  warnings: string[];
}

// Refresh Status Response
export interface RefreshStatusResponse {
  orchestrationId: string;
  status: RefreshStatus;
  overallProgress: number;
  estimatedCompletionSeconds: number;
  startedAt: string;
  completedAt?: string;
  targets: RefreshTargetStatus[];
  errors: RefreshError[];
  warnings: string[];
}

// Target Status within Refresh
export interface RefreshTargetStatus {
  target: RefreshTarget;
  status: RefreshStatus;
  progress: number;
  recordsProcessed: number;
  recordsTotal: number;
  completedAt?: string;
  connectionType: ConnectionType;
  connectionName: string;
  errors?: RefreshError[];
}

// Refresh Error
export interface RefreshError {
  code: string;
  message: string;
  target?: RefreshTarget;
  connectionId?: string;
  connectionName?: string;
  details?: any;
}

// Connection Target Status
export interface ConnectionTargetStatus {
  target: RefreshTarget;
  displayName: string;
  supported: boolean;
  estimatedDurationSeconds: number;
  lastRefreshAt?: string;
  stalenessLevel: StalenessLevel;
  recordsLastSync?: number;
}

// Refresh Dependencies
export interface RefreshDependency {
  target: RefreshTarget;
  dependentTargets: RefreshTarget[];
  description: string;
}

// Refresh Estimate Request
export interface RefreshEstimateRequest {
  targets: RefreshTarget[];
  connectionTypes?: ConnectionType[];
  connectionIds?: string[];
}

// Refresh Estimate Response
export interface RefreshEstimateResponse {
  targets: RefreshTarget[];
  connectionTypes: ConnectionType[];
  estimatedDurationSeconds: number;
  estimatedRecords: number;
  warnings: string[];
  dependentTargets: RefreshTarget[];
}

// Connection Health Status
export interface RefreshConnectionHealth {
  connectionId: string;
  connectionName: string;
  connectionType: ConnectionType;
  status: 'ACTIVE' | 'DISABLED' | 'ERROR';
  healthStatus: HealthStatus;
  lastSuccessfulSync: string;
}

// Active Refresh Operation
export interface ActiveRefreshOperation {
  orchestrationId: string;
  targets: RefreshTarget[];
  status: RefreshStatus;
  startedAt: string;
  totalJobs: number;
  completedJobs: number;
  overallProgress: number;
}

// Refresh History Entry
export interface RefreshHistoryEntry {
  orchestrationId: string;
  targets: RefreshTarget[];
  status: RefreshStatus;
  requestedBy: string;
  startedAt: string;
  completedAt?: string;
  totalRecordsProcessed: number;
  executionSource: ExecutionSource;
  durationSeconds?: number;
  errors?: RefreshError[];
}

// Scheduled Refresh Job
export interface ScheduledRefreshJob {
  jobId: string;
  jobName: string;
  jobType: RefreshTarget;
  connectionId: string;
  connectionName: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  lastSuccessfulSync?: string;
  syncFrequencyMinutes: number;
  nextScheduledRun?: string;
}

// Refresh Progress Event (for real-time updates)
export interface RefreshProgressEvent {
  type: 'STATUS_CHANGE' | 'JOB_PROGRESS' | 'JOB_COMPLETED' | 'JOB_ERROR';
  orchestrationId: string;
  status?: RefreshStatus;
  overallProgress?: number;
  jobTarget?: RefreshTarget;
  progressPercentage?: number;
  error?: RefreshError;
  completedAt?: string;
}

// Refresh Validation Request
export interface RefreshValidationRequest {
  targets: RefreshTarget[];
  connectionTypes?: ConnectionType[];
  connectionIds?: string[];
}

// Refresh Validation Response
export interface RefreshValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations?: string[];
}