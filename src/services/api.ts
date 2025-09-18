// Types imported from central definitions to avoid duplication
import type { LoginRequest, LoginResponse } from '../types';

// User shape used across auth endpoints (kept for reference)
/* interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
} */

interface StatusResponse {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  tenantName: string | null;
  onboardingStatus: 'NOT_ONBOARDED' | 'PARTIALLY_ONBOARDED' | 'FULLY_ONBOARDED' | 'COMPLETED';
  nextRecommendedActions: Array<{
    id: string;
    title: string;
    description: string;
    estimatedTime: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

// Reserved generic response shape for future endpoints
// interface ApiResponse<T> { data: T; message?: string; success: boolean; }
import { ENV, devLog, devError } from '../utils/env';
import { AUTH_TOKEN_KEY, USER_DATA_KEY } from '../utils/constants';
import { toCamelCaseKeys, buildQueryString } from '../utils/case';
import { toBackendRole, toFrontendRole, BACKEND_TO_FRONTEND_ROLE } from '../utils/roles';
import type { PlanningPeriod, CreatePlanningPeriodRequest, FiscalConfig, ApplyTemplateRequest, OkrType, UpdateOkrTypeRequest, Project, CreateProjectRequest, UpdateProjectRequest, CreateEpicRequest, Team, CreateTeamRequest, UpdateTeamRequest, Teammate, CreateTeammateRequest, UpdateTeammateRequest, AssignTeamRequest, BulkAssignTeammatesRequest, BulkAssignResponse, TeammateLeave, CreateLeaveRequest, UpdateLeaveRequest, HolidayCalendar, CreateHolidayCalendarRequest, UpdateHolidayCalendarRequest, Holiday, CreateHolidayRequest, AssignHolidayCalendarsRequest, CapacityAdjustment, CreateCapacityAdjustmentRequest, CapacityBreakdown, TeamWithCapacity, TeamAllocation, AddTeammateToTeamRequest, UpdateTeamAllocationRequest, AvailableTeammate, TeamCapacityMetrics, CalendarEventResponse, RefreshTargetOption, RefreshConnectionTypeOption, RefreshSuggestions, RefreshConnection, StartRefreshRequest, StartRefreshResponse, RefreshStatusResponse, ConnectionTargetStatus, RefreshDependency, RefreshEstimateRequest, RefreshEstimateResponse, RefreshConnectionHealth, ActiveRefreshOperation, RefreshHistoryEntry, ScheduledRefreshJob, RefreshValidationRequest, RefreshValidationResponse } from '../types';

// UI integration types (uiPrompts.md)
export interface HomeDashboardResponse {
  activeProjectsCount: number;
  atRiskProjectsCount: number;
  upcomingReleasesCount: number;
  currentSprint: null | {
    id: string;
    name: string;
    teamId: string;
    startDate: string;
    endDate: string;
    plannedStoryPoints: number;
    completedStoryPoints: number;
  };
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface ProjectListItem {
  id: string;
  name: string;
  teamName: string;
  projectType: string;
  status: string;
  priority: string;
  healthStatus: string;
  jiraKey: string;
  plannedReleaseDate: string | null;
  actualReleaseDate: string | null;
  updatedAt: string;
}

// Epic type alias for UI terminology change (backend compatibility)
export type EpicListItem = ProjectListItem;

export interface ReleaseRow {
  id: string;
  name: string;
  plannedReleaseDate: string | null;
  actualReleaseDate: string | null;
  status: string;
  healthStatus: string;
  engineeringManagerId: string;
}

export interface SprintRow {
  id: string;
  name: string;
  teamId: string;
  startDate: string;
  endDate: string;
  status: string;
  plannedStoryPoints: number;
  completedStoryPoints: number;
  createdAt?: string;
  updatedAt?: string;
}

// Field discovery types (Phase 2a)
export interface FieldItem {
  id: string;
  key: string;
  name: string;
  schema: { type: string; custom?: string | null };
  contexts?: unknown;
  samples: string[];
  usageInSample: number;
  alias: string | null;
}

// Admin connectors (Jira) types
export interface ConnectorRow {
  id: string;
  type: 'JIRA';
  name: string;
  baseUrl: string;
  authType: 'PAT' | 'API_TOKEN' | 'BASIC' | 'OAUTH2' | string;
  status: 'VERIFIED' | 'ACTIVE' | 'DISABLED' | 'ERROR' | 'INACTIVE' | 'TESTING' | string;
  lastSyncAt?: string | null;
  lastHealthCheckAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorHealth {
  reachable: boolean;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  httpStatus: number | null;
  rateLimitRemaining: number | null;
  errorCode: string | null;
  message: string;
  lastHealthCheckAt?: string | null;
}

// Jobs-based sync types
export type JobType =
  | 'PROJECT_HEALTH'
  | 'SPRINT_ANALYTICS'
  | 'RELEASE_READINESS'
  | 'TEAM_CAPACITY'
  | 'QUALITY_MANAGEMENT';
export type JobStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FAILED' | 'ARCHIVED' | string;

export interface JobSummaryRow {
  id: string;
  name: string;
  jobType: JobType;
  status: JobStatus;
  schedule: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'REAL_TIME' | string;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  recordsProcessed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  name: string;
  description?: string;
  jobType: JobType;
  schedule?: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'REAL_TIME' | string;
  scheduleTime?: string; // HH:mm
}

export interface JobFiltersPayload {
  projects?: string[];
  issueTypes?: string[];
  dateRange?: { type: 'RELATIVE' | 'ALL' | 'CUSTOM'; value?: number; unit?: 'DAYS'; start?: string; end?: string };
  jqlOverride?: string;
}

export interface GetJobFiltersResponse {
  id: string;
  step?: string;
  filters?: JobFiltersPayload & { dateRange?: { type: 'RELATIVE' | 'ALL' | 'CUSTOM'; value?: number; unit?: 'DAYS'; start?: string | null; end?: string | null } };
  estimatedRecords?: number | null;
  jqlPreview?: string | null;
  updatedAt?: string;
}

export interface DiscoveryStatusResponse {
  discoveryId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress?: { recordsProcessed: number; totalRecords: number; percentage: number; fieldsFound?: number };
  message?: string;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface ConnectorCatalog {
  items: Array<{
    type: string;
    displayName: string;
    description?: string;
    tags?: string[];
    docsUrl?: string;
    authMethods: Array<{
      id: string;
      displayName: string;
      createEndpoint: string;
      verifyEndpoint: string;
      fields: Array<{
        name: string;
        label: string;
        type: 'text' | 'url' | 'email' | 'password';
        required?: boolean;
        placeholder?: string;
        secure?: boolean;
      }>;
    }>;
    jobSourceConfig?: {
      supportedJobTypes: Array<{
        jobType: JobType;
        displayName: string;
        description?: string;
        requiredSourceObjects?: string[];
        optionalSourceObjects?: string[];
        targetEntity?: string;
        enabled?: boolean;
      }>;
      availableSourceObjects?: Array<any>;
    };
  }>;
}

export interface FilterOptions {
  availableProjects: Array<{ key: string; name: string; projectType?: string; accessible?: boolean }>;
  availableIssueTypes: Array<{ id: string; name: string; iconUrl?: string; subtask?: boolean }>;
  supportedDateRangeTypes: Array<'ALL' | 'RELATIVE' | 'CUSTOM'>;
}

class ApiService {
  private baseURL: string;
  // In-memory metadata cache and in-flight request map (dev-friendly, clears on reload)
  private metadataCache: {
    primaryRoles?: { data: Array<any>; ts: number };
    secondaryRoles?: { data: Array<any>; ts: number };
    leaveTypes?: { data: Array<any>; ts: number };
  } = {};
  private inFlight: Map<string, Promise<any>> = new Map();
  private static readonly METADATA_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(baseURL: string = ENV.API_BASE_URL) {
    this.baseURL = baseURL;
    devLog('API Service initialized with base URL:', baseURL);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      devLog('Making API request to:', url);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Do not clear token here; let the caller/route guards decide.
          // Clearing here causes subsequent requests in-flight to lose the Authorization header.
          throw new Error('Authentication failed. Please log in again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        devError('API request failed:', errorMessage);
        throw new Error(errorMessage);
      }

      // Gracefully handle empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        devLog('API request successful (no content):', url);
        return undefined as unknown as T;
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        devLog('API request successful (non-JSON):', url);
        const text = await response.text();
        return (text as unknown) as T;
      }
      const data = await response.json();
      devLog('API request successful:', url);
      return data;
    } catch (error) {
      devError('API request error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getStatus(): Promise<StatusResponse> {
    return this.request<StatusResponse>('/auth/status');
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  // POC endpoints per UI guide
  async getHomeDashboard(): Promise<HomeDashboardResponse> {
    return this.request<HomeDashboardResponse>('/home/dashboard');
  }

  // Project Management CRUD APIs (from uiPrompts.md)
  async createProject(payload: CreateProjectRequest): Promise<Project> {
    const raw = await this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<Project>(raw);
  }

  async updateProject(projectId: string, payload: UpdateProjectRequest): Promise<Project> {
    const raw = await this.request<any>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<Project>(raw);
  }

  async getProjectDetails(projectId: string): Promise<Project> {
    const raw = await this.request<any>(`/projects/${projectId}/details`);
    return toCamelCaseKeys<Project>(raw);
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.request<void>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async getProjects(params: Partial<{
    page: number;
    size: number;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
    status: string;
    health: string;
    teamId: string;
    name: string;
    jiraKey: string;
    onlyMine: boolean;
  }>): Promise<PageResponse<ProjectListItem>> {
    const qs = buildQueryString(params as Record<string, unknown>);
    return this.request<PageResponse<ProjectListItem>>(`/projects${qs}`);
  }

  async getProjectById(projectId: string): Promise<Project> {
    const raw = await this.request<any>(`/projects/${projectId}`);
    return toCamelCaseKeys<Project>(raw);
  }

  // Epic API aliases for UI terminology change (backend compatibility)
  async getEpics(params: Partial<{
    page: number;
    size: number;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
    status: string;
    priority: string;
    healthStatus: string;
    teamId: string;
    jiraKey: string;
    onlyMine: boolean;
  }>): Promise<PageResponse<EpicListItem>> {
    return this.getProjects(params);
  }

  async createEpic(payload: CreateEpicRequest): Promise<Project> {
    return this.createProject(payload);
  }

  async deleteEpic(epicId: string): Promise<void> {
    return this.deleteProject(epicId);
  }

  async getEpicById(epicId: string): Promise<Project> {
    return this.getProjectById(epicId);
  }

  async getReleases(params: { from: string; to: string }): Promise<ReleaseRow[]> {
    const qs = buildQueryString(params as Record<string, unknown>);
    const raw = await this.request<any[]>(`/releases${qs}`);
    return toCamelCaseKeys<ReleaseRow[]>(raw);
  }

  async getSprints(params: Partial<{ status: string; teamId: string; page: number; size: number }>): Promise<PageResponse<SprintRow>> {
    const qs = buildQueryString(params as Record<string, unknown>);
    const raw = await this.request<any>(`/sprints${qs}`);
    return toCamelCaseKeys<PageResponse<SprintRow>>(raw);
  }

  async getSprintById(sprintId: string): Promise<SprintRow> {
    const raw = await this.request<any>(`/sprints/${sprintId}`);
    return toCamelCaseKeys<SprintRow>(raw);
  }

  async getTeamMembers(params: Partial<{ search: string; page: number; size: number }>): Promise<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    assignedProjectCount: number;
  }>> {
    const qs = buildQueryString(params as Record<string, unknown>);
    const raw = await this.request<any>(`/team-members${qs}`);
    return toCamelCaseKeys<Array<any>>(raw);
  }

  async getTeamMemberById(memberId: string): Promise<{ id: string; name: string; email: string; role: string; createdAt: string }>{
    const raw = await this.request<any>(`/team-members/${memberId}`);
    return toCamelCaseKeys(raw);
  }

  async getTeamMemberProjects(memberId: string): Promise<Array<{ id: string; name: string; status: string; plannedReleaseDate: string | null }>> {
    const raw = await this.request<any>(`/team-members/${memberId}/projects`);
    return toCamelCaseKeys(raw);
  }

  // Admin connectors (Jira)
  async listConnectors(params: Partial<{ page: number; size: number; sortBy: string; sortDirection: 'ASC' | 'DESC' }>): Promise<PageResponse<ConnectorRow>> {
    const qs = buildQueryString(params as Record<string, unknown>);
    const raw = await this.request<any>(`/admin/connectors${qs}`);
    const camel = toCamelCaseKeys<any>(raw);
    const normalizedContent = (camel?.content || []).map((r: any) => ({
      ...r,
      // Normalize commonly seen variants from BE
      name: r.name ?? r.connectionName ?? r.displayName ?? '',
      type: r.type ?? r.connectorType ?? r.sourceType ?? 'JIRA',
      baseUrl: r.baseUrl ?? r.jiraBaseUrl ?? r.url ?? '',
    }));
    return { ...camel, content: normalizedContent } as PageResponse<ConnectorRow>;
  }

  async getConnectorCatalog(): Promise<ConnectorCatalog> {
    const raw = await this.request<any>(`/admin/connectors/catalog`);
    return toCamelCaseKeys<ConnectorCatalog>(raw);
  }

  async getFilterOptions(connectorId: string): Promise<FilterOptions> {
    const raw = await this.request<any>(`/admin/connectors/${connectorId}/filter-options`);
    return toCamelCaseKeys<FilterOptions>(raw);
  }

  async getSupportedJobTypesForConnector(connectorType: string): Promise<Array<{ jobType: JobType; displayName: string }>> {
    const cat = await this.getConnectorCatalog();
    const item = cat.items.find(i => i.type === connectorType);
    const list = item?.jobSourceConfig?.supportedJobTypes || [];
    return list.map(j => ({ jobType: j.jobType, displayName: j.displayName }));
  }

  async getConnectorById(id: string): Promise<ConnectorRow> {
    // Prefer detail endpoint if available; fallback to list + find by id
    try {
      const raw = await this.request<any>(`/admin/connectors/${id}`);
      const camel = toCamelCaseKeys<any>(raw);
      return {
        ...camel,
        name: camel.name ?? camel.connectionName ?? camel.displayName ?? '',
        type: camel.type ?? camel.connectorType ?? camel.sourceType ?? 'JIRA',
        baseUrl: camel.baseUrl ?? camel.jiraBaseUrl ?? camel.url ?? '',
      } as ConnectorRow;
    } catch (primaryError) {
      // Fallback: simple list (no pagination) or paged list
      try {
        const rawList = await this.request<any>(`/admin/connectors`);
        const camelList = toCamelCaseKeys<any>(rawList);
        const arr: any[] = Array.isArray(camelList)
          ? camelList
          : Array.isArray(camelList?.content)
            ? camelList.content
            : [];
        const found = arr.find((r: any) => r.id === id);
        if (!found) throw primaryError;
        const c = found;
        return {
          ...c,
          name: c.name ?? c.connectionName ?? c.displayName ?? '',
          type: c.type ?? c.connectorType ?? c.sourceType ?? 'JIRA',
          baseUrl: c.baseUrl ?? c.jiraBaseUrl ?? c.url ?? '',
        } as ConnectorRow;
      } catch {
        // Re-throw original
        if (primaryError instanceof Error) throw primaryError;
        throw new Error('Failed to load connector');
      }
    }
  }

  async createJiraConnector(payload: { name: string; baseUrl: string; email: string; apiToken: string; defaultJql?: string }): Promise<ConnectorRow> {
    const raw = await this.request<any>(`/admin/connectors/jira`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<ConnectorRow>(raw);
  }

  // Catalog-shaped create payload (uiPrompts.md)
  async createJiraConnectorCatalog(payload: {
    connectionName: string;
    jiraBaseUrl: string;
    authenticationType: 'API_TOKEN';
    username: string;
    apiToken: string;
    syncEnabled?: boolean;
    syncFrequencyMinutes?: number;
    syncJqlFilter?: string;
  }): Promise<{ id: string; tenantId?: string; status?: string; createdAt?: string }>{
    return this.request<{ id: string; tenantId?: string; status?: string; createdAt?: string }>(`/admin/connectors/jira`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyConnector(id: string, email?: string): Promise<{ id: string; status: string; verifiedAt: string }>{
    const qs = email ? `?email=${encodeURIComponent(email)}` : '';
    return this.request<{ id: string; status: string; verifiedAt: string }>(`/admin/connectors/${id}/verify${qs}`, { method: 'POST' });
  }

  async updateConnector(id: string, payload: Partial<{ name: string; defaultJql: string; status: 'DISABLED' | 'ACTIVE' }>): Promise<ConnectorRow> {
    const raw = await this.request<any>(`/admin/connectors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<ConnectorRow>(raw);
  }

  async deleteConnector(id: string): Promise<void>{
    await this.request<void>(`/admin/connectors/${id}`, { method: 'DELETE' });
  }

  async reauthorizeConnector(id: string, payload: { email: string; apiToken: string }): Promise<ConnectorRow> {
    const raw = await this.request<any>(`/admin/connectors/${id}/reauthorize`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<ConnectorRow>(raw);
  }

  async getConnectorHealth(id: string): Promise<ConnectorHealth> {
    const raw = await this.request<any>(`/admin/connectors/${id}/health`);
    return toCamelCaseKeys<ConnectorHealth>(raw);
  }

  // Phase 2 — Webhooks & Schedules & Jobs
  async registerWebhooks(id: string): Promise<{ registered: boolean; secretSet: boolean }>{
    return this.request<{ registered: boolean; secretSet: boolean }>(`/admin/connectors/${id}/webhooks/register`, { method: 'POST' });
  }

  async rotateWebhookSecret(id: string): Promise<{ rotated: boolean; rotatedAt: string }>{
    return this.request<{ rotated: boolean; rotatedAt: string }>(`/admin/connectors/${id}/webhooks/rotate`, { method: 'POST' });
  }

  async getWebhookStatus(id: string): Promise<{ registered: boolean; lastEventAt: string | null; events24h: number }>{
    return this.request<{ registered: boolean; lastEventAt: string | null; events24h: number }>(`/admin/connectors/${id}/webhooks/status`);
  }

  async getConnectorSettings(id: string): Promise<{ reconcileWeekdayCron: string; reconcileWeekendCron: string; webhooksEnabled: boolean }>{
    return this.request<{ reconcileWeekdayCron: string; reconcileWeekendCron: string; webhooksEnabled: boolean }>(`/admin/connectors/${id}/settings`);
  }

  async updateConnectorSettings(id: string, payload: { reconcileWeekdayCron: string; reconcileWeekendCron: string; webhooksEnabled: boolean }): Promise<{ saved: boolean; updatedAt: string }>{
    return this.request<{ saved: boolean; updatedAt: string }>(`/admin/connectors/${id}/settings`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  // Jobs-based sync API
  async listJobs(connectorId: string, params: Partial<{ page: number; size: number; sortBy: string; sortDirection: 'ASC' | 'DESC' }>): Promise<PageResponse<JobSummaryRow>> {
    const qs = buildQueryString(params as Record<string, unknown>);
    const raw = await this.request<any>(`/admin/connectors/${connectorId}/jobs${qs}`);
    return toCamelCaseKeys<PageResponse<JobSummaryRow>>(raw);
  }

  async createJob(connectorId: string, payload: CreateJobRequest): Promise<{ id: string; status: JobStatus; step: string }>{
    return this.request<{ id: string; status: JobStatus; step: string }>(`/admin/connectors/${connectorId}/jobs`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateJobFilters(connectorId: string, jobId: string, payload: JobFiltersPayload): Promise<{ id: string; step: string }>{
    // Backend requires PUT for creating/updating filters
    return this.request<{ id: string; step: string }>(`/admin/connectors/${connectorId}/jobs/${jobId}/filters`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async triggerJobDiscovery(connectorId: string, jobId: string): Promise<{ jobId: string; discoveryId: string; status: string }>{
    return this.request<{ jobId: string; discoveryId: string; status: string }>(`/admin/connectors/${connectorId}/jobs/${jobId}/discover-fields`, { method: 'POST', body: JSON.stringify({ sampleSize: 10 }) });
  }

  async getDiscoveryStatus(connectorId: string, jobId: string): Promise<DiscoveryStatusResponse | { status: 'NONE' }>{
    const url = `${this.baseURL}/admin/connectors/${connectorId}/jobs/${jobId}/discover/status`;
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch(url, { headers });
    if (resp.status === 404) return { status: 'NONE' } as any;
    if (!resp.ok) {
      const data = await resp.text();
      throw new Error(data || `HTTP ${resp.status}`);
    }
    const raw = await resp.json();
    return toCamelCaseKeys<DiscoveryStatusResponse>(raw);
  }

  async getDiscoveryResults(connectorId: string, jobId: string): Promise<any>{
    return this.request<any>(`/admin/connectors/${connectorId}/jobs/${jobId}/discover/results`);
  }

  async getJobFilters(connectorId: string, jobId: string): Promise<GetJobFiltersResponse> {
    const raw = await this.request<any>(`/admin/connectors/${connectorId}/jobs/${jobId}/filters`);
    return toCamelCaseKeys<GetJobFiltersResponse>(raw);
  }

  async getMappingSuggestions(connectorId: string, jobId: string): Promise<any>{
    // Prefer entity-structured format for simpler UI
    return this.request<any>(`/admin/connectors/${connectorId}/jobs/${jobId}/suggestions?format=entities`);
  }

  async getCurrentMappings(connectorId: string, jobId: string): Promise<any>{
    return this.request<any>(`/admin/connectors/${connectorId}/jobs/${jobId}/mappings`);
  }

  async getRequiredFields(connectorId: string, jobId: string): Promise<any> {
    return this.request<any>(`/admin/connectors/${connectorId}/jobs/${jobId}/required-fields`);
  }

  async saveJobMappings(connectorId: string, jobId: string, payload: { mappings: Array<{ jiraFieldId: string; zenemFieldPath: string; mappingLogic?: string; isRequired?: boolean; customLogic?: string }> }): Promise<{ jobId: string; step: string }>{
    return this.request<{ jobId: string; step: string }>(`/admin/connectors/${connectorId}/jobs/${jobId}/mappings`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async testJob(connectorId: string, jobId: string, payload: { sampleSize: number }): Promise<any>{
    return this.request<any>(`/admin/connectors/${connectorId}/jobs/${jobId}/test`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async activateJob(connectorId: string, jobId: string): Promise<{ jobId: string; status: string; nextRunAt?: string }>{
    return this.request<{ jobId: string; status: string; nextRunAt?: string }>(`/admin/connectors/${connectorId}/jobs/${jobId}/activate`, { method: 'POST' });
  }

  async previewJob(connectorId: string, jobId: string, payload: { previewDays: number; maxRecords?: number }): Promise<any> {
    return this.request<any>(`/admin/connectors/${connectorId}/jobs/${jobId}/preview`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async runJobNow(connectorId: string, jobId: string, payload: { runType: 'FULL' | 'INCREMENTAL' | string }): Promise<{ executionId: string; status: string }>{
    return this.request<{ executionId: string; status: string }>(`/admin/connectors/${connectorId}/jobs/${jobId}/run`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async getJobExecutionStatus(connectorId: string, jobId: string, executionId: string): Promise<any>{
    return this.request<any>(`/admin/connectors/${connectorId}/jobs/${jobId}/executions/${executionId}`);
  }

  // Legacy sync endpoints removed in favor of jobs API

  async syncVersions(id: string, projects: string[]): Promise<{ accepted: boolean }>{
    return this.request<{ accepted: boolean }>(`/admin/connectors/${id}/sync/versions`, { method: 'POST', body: JSON.stringify({ projects }) });
  }

  async syncSprints(id: string, boards: number[], includeCompleted = false): Promise<{ accepted: boolean }>{
    return this.request<{ accepted: boolean }>(`/admin/connectors/${id}/sync/sprints`, { method: 'POST', body: JSON.stringify({ boards, includeCompleted }) });
  }

  async listActiveSprints(id: string, boardId: number): Promise<Array<{ id: string; name: string; state: string; startDate?: string; endDate?: string }>>{
    return this.request<Array<{ id: string; name: string; state: string; startDate?: string; endDate?: string }>>(`/admin/connectors/${id}/sprints?boardId=${boardId}&state=active`);
  }

  async getLogs(id: string, params: { level?: string; since?: string; page?: number; size?: number }): Promise<PageResponse<{ ts: string; level: string; code?: string; message: string; context?: any }>>{
    const qs = buildQueryString(params as Record<string, unknown>);
    const raw = await this.request<any>(`/admin/connectors/${id}/logs${qs}`);
    return toCamelCaseKeys<PageResponse<{ ts: string; level: string; code?: string; message: string; context?: any }>>(raw);
  }

  async replay(id: string, payload: { jobId: string; since: string; limit?: number }): Promise<{ accepted: boolean }>{
    return this.request<{ accepted: boolean }>(`/admin/connectors/${id}/replay`, { method: 'POST', body: JSON.stringify(payload) });
  }

  // Phase 2a — Field discovery and samples
  async discoverFields(id: string): Promise<{ accepted: boolean; discoveredAt: string }>{
    return this.request<{ accepted: boolean; discoveredAt: string }>(`/admin/connectors/${id}/discover-fields`, { method: 'POST' });
  }

  async listFields(
    id: string,
    params: { includeSamples: boolean; projects?: string; issueTypes?: string; sampleCount?: number }
  ): Promise<FieldItem[]> {
    const qs = buildQueryString(params as Record<string, unknown>);
    return this.request<FieldItem[]>(`/admin/connectors/${id}/fields${qs}`);
  }

  // Planning Periods API (Story 0.1)
  async getPlanningPeriods(): Promise<PlanningPeriod[]> {
    const raw = await this.request<any[]>('/admin/planning-periods');
    return toCamelCaseKeys<PlanningPeriod[]>(raw);
  }

  async createPlanningPeriod(payload: CreatePlanningPeriodRequest): Promise<PlanningPeriod> {
    const raw = await this.request<any>('/admin/planning-periods', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<PlanningPeriod>(raw);
  }

  async updatePlanningPeriod(id: string, payload: Partial<CreatePlanningPeriodRequest>): Promise<PlanningPeriod> {
    const raw = await this.request<any>(`/admin/planning-periods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<PlanningPeriod>(raw);
  }

  async getFiscalConfig(): Promise<FiscalConfig> {
    const raw = await this.request<any>('/admin/fiscal-config');
    return toCamelCaseKeys<FiscalConfig>(raw);
  }

  async updateFiscalConfig(payload: FiscalConfig): Promise<FiscalConfig> {
    const raw = await this.request<any>('/admin/fiscal-config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<FiscalConfig>(raw);
  }

  async applyPlanningTemplate(payload: ApplyTemplateRequest): Promise<PlanningPeriod[]> {
    const raw = await this.request<any[]>('/admin/planning-periods/templates/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<PlanningPeriod[]>(raw);
  }

  async deletePlanningPeriod(id: string): Promise<void> {
    await this.request<void>(`/admin/planning-periods/${id}`, {
      method: 'DELETE',
    });
  }

  // OKR Types API (Story 0.2)
  async getOkrTypes(): Promise<OkrType[]> {
    const raw = await this.request<any[]>('/admin/okr-types');
    return toCamelCaseKeys<OkrType[]>(raw);
  }

  async updateOkrType(id: string, payload: UpdateOkrTypeRequest): Promise<OkrType> {
    const raw = await this.request<any>(`/admin/okr-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<OkrType>(raw);
  }

  // Teams Management API (from uiPrompts.md)
  async getTeams(params: Partial<{
    search: string;
    page: number;
    size: number;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
  }>): Promise<PageResponse<Team>> {
    const qs = buildQueryString(params as Record<string, unknown>);
    const raw = await this.request<any>(`/teams${qs}`);
    return toCamelCaseKeys<PageResponse<Team>>(raw);
  }

  async createTeam(payload: CreateTeamRequest): Promise<Team> {
    const raw = await this.request<any>('/teams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<Team>(raw);
  }

  async getTeamDetails(teamId: string): Promise<Team> {
    const raw = await this.request<any>(`/teams/${teamId}`);
    return toCamelCaseKeys<Team>(raw);
  }

  async updateTeam(teamId: string, payload: UpdateTeamRequest): Promise<Team> {
    const raw = await this.request<any>(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<Team>(raw);
  }

  async deleteTeam(teamId: string): Promise<void> {
    await this.request<void>(`/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  async bulkAssignTeammates(teamId: string, payload: BulkAssignTeammatesRequest): Promise<BulkAssignResponse> {
    const raw = await this.request<any>(`/teams/${teamId}/assign-teammates`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<BulkAssignResponse>(raw);
  }

  // Teammates Management API (from uiPrompts.md)
  async createTeammate(payload: CreateTeammateRequest): Promise<Teammate> {
    // Map new domain-driven fields to backend contract
    const backendPayload: any = { ...payload } as any;
    
    if ((payload as any).primaryRoleCode) {
      // Convert role code to display name using metadata
      try {
        const primaryRoles = await this.getPrimaryRoles();
        const roleData = primaryRoles.find(r => r.code === (payload as any).primaryRoleCode);
        backendPayload.role = roleData ? roleData.displayName : (payload as any).primaryRoleCode;
      } catch (error) {
        console.warn('Failed to fetch primary roles for conversion, using code as-is:', error);
        backendPayload.role = (payload as any).primaryRoleCode;
      }
      delete backendPayload.primaryRoleCode;
    } else if (payload.role) {
      // Legacy mapping
      backendPayload.role = toBackendRole(payload.role);
    }
    
    // Handle new multiple secondary roles array
    if ((payload as any).secondaryRoles !== undefined) {
      if (Array.isArray((payload as any).secondaryRoles) && (payload as any).secondaryRoles.length > 0) {
        // Convert secondary role codes to display names using metadata
        try {
          const secondaryRoles = await this.getSecondaryRoles();
          backendPayload.secondaryRoles = (payload as any).secondaryRoles.map((code: string) => {
            const roleData = secondaryRoles.find(r => r.code === code);
            return roleData ? roleData.displayName : code;
          });
        } catch (error) {
          console.warn('Failed to fetch secondary roles for conversion, using codes as-is:', error);
          backendPayload.secondaryRoles = (payload as any).secondaryRoles;
        }
      } else {
        backendPayload.secondaryRoles = [];
      }
    }
    // Legacy single secondary role support (backward compatibility)
    else if ((payload as any).secondaryRoleCode !== undefined) {
      if ((payload as any).secondaryRoleCode) {
        // Convert single secondary role code to display name using metadata
        try {
          const secondaryRoles = await this.getSecondaryRoles();
          const roleData = secondaryRoles.find(r => r.code === (payload as any).secondaryRoleCode);
          backendPayload.secondaryRole = roleData ? roleData.displayName : (payload as any).secondaryRoleCode;
        } catch (error) {
          console.warn('Failed to fetch secondary roles for conversion, using code as-is:', error);
          backendPayload.secondaryRole = (payload as any).secondaryRoleCode;
        }
      } else {
        backendPayload.secondaryRole = null;
      }
      delete backendPayload.secondaryRoleCode;
    }
    
    const raw = await this.request<any>('/teammates', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });
    
    // Convert role back to frontend format and handle secondary roles
    const result = toCamelCaseKeys<any>(raw);
    if (result.role) {
      result.role = toFrontendRole(result.role);
    }
    
    // Handle secondary roles array response
    if (result.secondaryRoles && Array.isArray(result.secondaryRoles)) {
      result.secondaryRoles = result.secondaryRoles; // Keep as array
      result.secondaryRoleDisplayNames = result.secondaryRoles; // Backend sends display names
    }
    // Handle legacy single secondary role
    else if (result.secondaryRole) {
      result.secondaryRoleCode = result.secondaryRole;
      result.secondaryRoleDisplayName = result.secondaryRole;
    }
    
    return result as Teammate;
  }

  async getTeammates(params: Partial<{
    search: string;
    teamId: string;
    role: string;
    primaryRoleCode: string;
    secondaryRoleCode: string;
    page: number;
    size: number;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
  }>): Promise<PageResponse<Teammate>> {
    // Convert role filter to backend format if provided
    const backendParams: Record<string, unknown> = { ...params } as any;
    if ((params as any).primaryRoleCode) backendParams.role = (params as any).primaryRoleCode;
    if ((params as any).secondaryRoleCode) backendParams.secondaryRole = (params as any).secondaryRoleCode;
    if (params.role && !(params as any).primaryRoleCode) {
      backendParams.role = toBackendRole(params.role as any);
    }
    
    const qs = buildQueryString(backendParams as Record<string, unknown>);
    const raw = await this.request<any>(`/teammates${qs}`);
    const result = toCamelCaseKeys<any>(raw);
    
    // Convert roles back to frontend format and preserve new role fields
    if (result.content) {
      result.content = result.content.map((teammate: any) => ({
        ...teammate,
        // Keep legacy role field for backward compatibility, but only convert known roles
        role: teammate.role && BACKEND_TO_FRONTEND_ROLE[teammate.role] ? toFrontendRole(teammate.role) : 'DEVELOPER',
        // Handle new role fields - backend might return display names or codes
        primaryRoleCode: teammate.primaryRoleCode || teammate.role, // Prefer explicit code, fallback to role field
        primaryRoleDisplayName: teammate.primaryRoleDisplayName || teammate.role,
        secondaryRoleCode: teammate.secondaryRoleCode || teammate.secondaryRole || null,
        secondaryRoleDisplayName: teammate.secondaryRoleDisplayName || teammate.secondaryRole || null,
      }));
    }
    
    return result as PageResponse<Teammate>;
  }

  async updateTeammate(teammateId: string, payload: UpdateTeammateRequest): Promise<Teammate> {
    // Convert new role fields to backend format if provided
    const backendPayload: any = { ...payload } as any;
    
    if ((payload as any).primaryRoleCode) {
      // Convert role code to display name using metadata
      try {
        const primaryRoles = await this.getPrimaryRoles();
        const roleData = primaryRoles.find(r => r.code === (payload as any).primaryRoleCode);
        backendPayload.role = roleData ? roleData.displayName : (payload as any).primaryRoleCode;
      } catch (error) {
        console.warn('Failed to fetch primary roles for conversion, using code as-is:', error);
        backendPayload.role = (payload as any).primaryRoleCode;
      }
      delete backendPayload.primaryRoleCode;
    } else if (payload.role) {
      backendPayload.role = toBackendRole(payload.role);
    }
    
    // Handle new multiple secondary roles array
    if ((payload as any).secondaryRoles !== undefined) {
      if (Array.isArray((payload as any).secondaryRoles) && (payload as any).secondaryRoles.length > 0) {
        // Convert secondary role codes to display names using metadata
        try {
          const secondaryRoles = await this.getSecondaryRoles();
          backendPayload.secondaryRoles = (payload as any).secondaryRoles.map((code: string) => {
            const roleData = secondaryRoles.find(r => r.code === code);
            return roleData ? roleData.displayName : code;
          });
        } catch (error) {
          console.warn('Failed to fetch secondary roles for conversion, using codes as-is:', error);
          backendPayload.secondaryRoles = (payload as any).secondaryRoles;
        }
      } else {
        backendPayload.secondaryRoles = [];
      }
    }
    // Legacy single secondary role support (backward compatibility)
    else if ((payload as any).secondaryRoleCode !== undefined) {
      if ((payload as any).secondaryRoleCode) {
        // Convert single secondary role code to display name using metadata
        try {
          const secondaryRoles = await this.getSecondaryRoles();
          const roleData = secondaryRoles.find(r => r.code === (payload as any).secondaryRoleCode);
          backendPayload.secondaryRole = roleData ? roleData.displayName : (payload as any).secondaryRoleCode;
        } catch (error) {
          console.warn('Failed to fetch secondary roles for conversion, using code as-is:', error);
          backendPayload.secondaryRole = (payload as any).secondaryRoleCode;
        }
      } else {
        backendPayload.secondaryRole = null;
      }
      delete backendPayload.secondaryRoleCode;
    }
    
    const raw = await this.request<any>(`/teammates/${teammateId}`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload),
    });
    
    // Convert role back to frontend format and handle secondary roles
    const result = toCamelCaseKeys<any>(raw);
    if (result.role) {
      result.role = toFrontendRole(result.role);
    }
    
    // Handle secondary roles array response
    if (result.secondaryRoles && Array.isArray(result.secondaryRoles)) {
      result.secondaryRoles = result.secondaryRoles; // Keep as array
      result.secondaryRoleDisplayNames = result.secondaryRoles; // Backend sends display names
    }
    // Handle legacy single secondary role
    else if (result.secondaryRole) {
      result.secondaryRoleCode = result.secondaryRole;
      result.secondaryRoleDisplayName = result.secondaryRole;
    }
    
    return result as Teammate;
  }

  async deleteTeammate(teammateId: string): Promise<void> {
    await this.request<void>(`/teammates/${teammateId}`, {
      method: 'DELETE',
    });
  }

  async getUnassignedTeammates(role?: string): Promise<Teammate[]> {
    // Convert role filter to backend format if provided
    const backendRole = role ? toBackendRole(role as any) : undefined;
    const qs = backendRole ? `?role=${backendRole}` : '';
    const raw = await this.request<any[]>(`/teammates/unassigned${qs}`);
    const result = toCamelCaseKeys<any[]>(raw);
    
    // Convert roles back to frontend format
    return result.map((teammate: any) => ({
      ...teammate,
      role: teammate.role ? toFrontendRole(teammate.role) : teammate.role,
    }));
  }

  async assignTeammateToTeam(teammateId: string, payload: AssignTeamRequest): Promise<Teammate> {
    const raw = await this.request<any>(`/teammates/${teammateId}/assign-team`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    
    // Convert role back to frontend format
    const result = toCamelCaseKeys<any>(raw);
    if (result.role) {
      result.role = toFrontendRole(result.role);
    }
    return result as Teammate;
  }

  // Leave Management API (from uiPrompts.md)
  async createTeammateLeave(teammateId: string, payload: CreateLeaveRequest): Promise<TeammateLeave> {
    const raw = await this.request<any>(`/teammates/${teammateId}/leaves`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<TeammateLeave>(raw);
  }

  async getTeammateLeaves(teammateId: string, params?: Partial<{
    status: string;
    startDate: string;
    endDate: string;
    leaveType: string;
  }>): Promise<TeammateLeave[]> {
    const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
    const raw = await this.request<any[]>(`/teammates/${teammateId}/leaves${qs}`);
    return toCamelCaseKeys<TeammateLeave[]>(raw);
  }

  async updateTeammateLeave(teammateId: string, leaveId: string, payload: UpdateLeaveRequest): Promise<TeammateLeave> {
    const raw = await this.request<any>(`/teammates/${teammateId}/leaves/${leaveId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<TeammateLeave>(raw);
  }

  async deleteTeammateLeave(teammateId: string, leaveId: string): Promise<void> {
    await this.request<void>(`/teammates/${teammateId}/leaves/${leaveId}`, {
      method: 'DELETE',
    });
  }

  // Capacity Planning API (from uiPrompts.md)
  async getTeammateCapacityBreakdown(teammateId: string, params?: Partial<{
    sprintId: string;
    startDate: string;
    endDate: string;
  }>): Promise<CapacityBreakdown> {
    const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
    const raw = await this.request<any>(`/teammates/${teammateId}/capacity${qs}`);
    return toCamelCaseKeys<CapacityBreakdown>(raw);
  }

  async createCapacityAdjustment(teammateId: string, payload: CreateCapacityAdjustmentRequest): Promise<CapacityAdjustment> {
    const raw = await this.request<any>(`/teammates/${teammateId}/capacity-adjustments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<CapacityAdjustment>(raw);
  }

  async getCapacityAdjustments(teammateId: string, sprintId?: string): Promise<CapacityAdjustment[]> {
    const qs = sprintId ? `?sprintId=${sprintId}` : '';
    const raw = await this.request<any[]>(`/teammates/${teammateId}/capacity-adjustments${qs}`);
    return toCamelCaseKeys<CapacityAdjustment[]>(raw);
  }

  async deleteCapacityAdjustment(teammateId: string, adjustmentId: string): Promise<void> {
    await this.request<void>(`/teammates/${teammateId}/capacity-adjustments/${adjustmentId}`, {
      method: 'DELETE',
    });
  }

  // Holiday Calendar Management API (from uiPrompts.md)
  async getHolidayCalendars(params?: Partial<{
    region: string;
    isActive: boolean;
    page: number;
    size: number;
  }>): Promise<PageResponse<HolidayCalendar>> {
    const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
    const raw = await this.request<any>(`/admin/holiday-calendars${qs}`);
    return toCamelCaseKeys<PageResponse<HolidayCalendar>>(raw);
  }

  async createHolidayCalendar(payload: CreateHolidayCalendarRequest): Promise<HolidayCalendar> {
    const raw = await this.request<any>('/admin/holiday-calendars', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<HolidayCalendar>(raw);
  }

  async updateHolidayCalendar(calendarId: string, payload: UpdateHolidayCalendarRequest): Promise<HolidayCalendar> {
    const raw = await this.request<any>(`/admin/holiday-calendars/${calendarId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<HolidayCalendar>(raw);
  }

  async deleteHolidayCalendar(calendarId: string): Promise<void> {
    await this.request<void>(`/admin/holiday-calendars/${calendarId}`, {
      method: 'DELETE',
    });
  }

  async getHolidayCalendarDetails(calendarId: string): Promise<HolidayCalendar> {
    const raw = await this.request<any>(`/admin/holiday-calendars/${calendarId}`);
    return toCamelCaseKeys<HolidayCalendar>(raw);
  }

  async getHolidaysInCalendar(calendarId: string, params?: Partial<{
    year: number;
    upcoming: boolean;
  }>): Promise<Holiday[]> {
    const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
    const raw = await this.request<any[]>(`/admin/holiday-calendars/${calendarId}/holidays${qs}`);
    return toCamelCaseKeys<Holiday[]>(raw);
  }

  async addHolidayToCalendar(calendarId: string, payload: CreateHolidayRequest): Promise<Holiday> {
    const raw = await this.request<any>(`/admin/holiday-calendars/${calendarId}/holidays`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<Holiday>(raw);
  }

  async updateHoliday(calendarId: string, holidayId: string, payload: Partial<CreateHolidayRequest>): Promise<Holiday> {
    const raw = await this.request<any>(`/admin/holiday-calendars/${calendarId}/holidays/${holidayId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<Holiday>(raw);
  }

  async deleteHoliday(calendarId: string, holidayId: string): Promise<void> {
    await this.request<void>(`/admin/holiday-calendars/${calendarId}/holidays/${holidayId}`, {
      method: 'DELETE',
    });
  }

  async assignHolidayCalendarsToTeam(teamId: string, payload: AssignHolidayCalendarsRequest): Promise<{
    teamId: string;
    assignedCalendars: Array<{
      id: string;
      name: string;
      region: string;
      holidayCount: number;
    }>;
    totalUpcomingHolidays: number;
    capacityImpactHours: number;
  }> {
    const raw = await this.request<any>(`/teams/${teamId}/holiday-calendars`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys(raw);
  }

  async getTeamHolidayCalendars(teamId: string): Promise<{
    teamId: string;
    assignedCalendars: Array<{
      id: string;
      name: string;
      region: string;
      holidayCount: number;
    }>;
    totalUpcomingHolidays: number;
    capacityImpactHours: number;
  }> {
    const raw = await this.request<any>(`/teams/${teamId}/holiday-calendars`);
    return toCamelCaseKeys(raw);
  }

  // Team Allocation Management API (from updated uiPrompts.md)
  async getAvailableTeammates(teamId: string, params?: Partial<{
    search: string;
    role: string;
    minAvailableHours: number;
    maxAllocationPercentage: number;
    sortBy: string;
    sortDirection: 'ASC' | 'DESC';
  }>): Promise<AvailableTeammate[]> {
    // Convert role filter to backend format if provided
    const backendParams = { ...params };
    if (params?.role) {
      backendParams.role = toBackendRole(params.role as any);
    }
    
    const qs = backendParams ? buildQueryString(backendParams as Record<string, unknown>) : '';
    const raw = await this.request<any[]>(`/teams/${teamId}/available-teammates${qs}`);
    const result = toCamelCaseKeys<any[]>(raw);
    
    // Convert roles back to frontend format
    return result.map((teammate: any) => ({
      ...teammate,
      role: teammate.role ? toFrontendRole(teammate.role) : teammate.role,
    }));
  }

  async addTeammateToTeam(teamId: string, payload: AddTeammateToTeamRequest): Promise<TeamAllocation> {
    // Backend expects `teamMemberId`; our UI uses `teammateId`. Map safely.
    const { teammateId, ...rest } = (payload as unknown) as Record<string, any>;
    const serverPayload = {
      teamMemberId: teammateId,
      ...rest,
    };
    const raw = await this.request<any>(`/teams/${teamId}/add-teammate`, {
      method: 'POST',
      body: JSON.stringify(serverPayload),
    });
    return toCamelCaseKeys<TeamAllocation>(raw);
  }

  async getTeamAllocations(teamId: string, params?: Partial<{
    includeCapacityMetrics: boolean;
    includeUpcomingLeaves: boolean;
  }>): Promise<TeamAllocation[]> {
    const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
    const raw = await this.request<any[]>(`/teams/${teamId}/allocations${qs}`);
    const result = toCamelCaseKeys<any[]>(raw);
    
    // Convert roles back to frontend format
    return result.map((allocation: any) => ({
      ...allocation,
      teammateRole: allocation.teammateRole ? toFrontendRole(allocation.teammateRole) : allocation.teammateRole,
    }));
  }

  async updateTeamAllocation(teamId: string, teammateId: string, payload: UpdateTeamAllocationRequest): Promise<TeamAllocation> {
    const raw = await this.request<any>(`/teams/${teamId}/allocations/${teammateId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<TeamAllocation>(raw);
  }

  async removeTeammateFromTeam(teamId: string, teammateId: string): Promise<void> {
    await this.request<void>(`/teams/${teamId}/allocations/${teammateId}`, {
      method: 'DELETE',
    });
  }

  async getTeamCapacityMetrics(teamId: string, params?: Partial<{
    startDate: string;
    endDate: string;
    includeTrends: boolean;
    includeRiskFactors: boolean;
  }>): Promise<TeamCapacityMetrics> {
    const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
    const raw = await this.request<any>(`/teams/${teamId}/capacity-metrics${qs}`);
    return toCamelCaseKeys<TeamCapacityMetrics>(raw);
  }

  async getTeamWithCapacity(teamId: string): Promise<TeamWithCapacity> {
    const raw = await this.request<any>(`/teams/${teamId}/with-capacity`);
    return toCamelCaseKeys<TeamWithCapacity>(raw);
  }

  // Calendar APIs
  async getCalendarMonth(year: number, month: number, params?: Partial<{ teamId: string; teamMemberId: string; projectId: string }>): Promise<CalendarEventResponse[]> {
    const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
    const raw = await this.request<any[]>(`/calendar/${year}/${month}${qs}`);
    return toCamelCaseKeys<CalendarEventResponse[]>(raw);
  }

  async getCalendarCurrent(params?: Partial<{ teamId: string; teamMemberId: string; projectId: string }>): Promise<CalendarEventResponse[]> {
    const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
    const raw = await this.request<any[]>(`/calendar/current${qs}`);
    return toCamelCaseKeys<CalendarEventResponse[]>(raw);
  }

  // Roles (Domain-driven) APIs
  async getPrimaryRoles(): Promise<Array<{ code: string; displayName: string; category?: string; level?: string | null; specialization?: string | null; isLegacy?: boolean }>> {
    const key = 'primaryRoles';
    const cached = this.metadataCache.primaryRoles;
    const now = Date.now();
    if (cached && now - cached.ts < ApiService.METADATA_TTL_MS) return cached.data;
    if (this.inFlight.has(key)) return this.inFlight.get(key)!;
    const p = (async () => {
      const raw = await this.request<any>(`/teammates/primary-roles`);
      const data = toCamelCaseKeys<Array<any>>(raw) || [];
      // Sort roles alphabetically by display name
      const sortedData = data.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      this.metadataCache.primaryRoles = { data: sortedData, ts: Date.now() };
      this.inFlight.delete(key);
      return sortedData;
    })();
    this.inFlight.set(key, p);
    return p;
  }

  async getSecondaryRoles(): Promise<Array<{ code: string; displayName: string; category?: string; level?: string | null; specialization?: string | null; isLegacy?: boolean }>> {
    const key = 'secondaryRoles';
    const cached = this.metadataCache.secondaryRoles;
    const now = Date.now();
    if (cached && now - cached.ts < ApiService.METADATA_TTL_MS) return cached.data;
    if (this.inFlight.has(key)) return this.inFlight.get(key)!;
    const p = (async () => {
      const raw = await this.request<any>(`/teammates/secondary-roles`);
      const data = toCamelCaseKeys<Array<any>>(raw) || [];
      // Sort roles alphabetically by display name
      const sortedData = data.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      this.metadataCache.secondaryRoles = { data: sortedData, ts: Date.now() };
      this.inFlight.delete(key);
      return sortedData;
    })();
    this.inFlight.set(key, p);
    return p;
  }

  // Leave Types (new domain-driven endpoint)
  async getLeaveTypes(): Promise<Array<{ code: string; displayName: string; description?: string; isPrimary: boolean }>> {
    const key = 'leaveTypes';
    const cached = this.metadataCache.leaveTypes;
    const now = Date.now();
    if (cached && now - cached.ts < ApiService.METADATA_TTL_MS) return cached.data;
    if (this.inFlight.has(key)) return this.inFlight.get(key)!;
    const p = (async () => {
      const raw = await this.request<any>(`/leaves/types`);
      const types = toCamelCaseKeys<Array<any>>(raw) || [];
      const normalized = types.map(t => ({
        code: t.code || t.id || '',
        displayName: t.displayName || t.name || t.code || '',
        description: t.description || '',
        isPrimary: Boolean(t.isPrimary),
      }));
      // Sort leave types alphabetically by display name
      const sortedData = normalized.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      this.metadataCache.leaveTypes = { data: sortedData, ts: Date.now() };
      this.inFlight.delete(key);
      return sortedData;
    })();
    this.inFlight.set(key, p);
    return p;
  }

  // Multi-Source Refresh System APIs (from uiPrompts.md)

  // Selection & Discovery APIs
  async getRefreshTargetOptions(): Promise<RefreshTargetOption[]> {
    const raw = await this.request<any[]>('/refresh/targets/options');
    return toCamelCaseKeys<RefreshTargetOption[]>(raw);
  }

  async getRefreshConnectionTypes(): Promise<RefreshConnectionTypeOption[]> {
    const raw = await this.request<any[]>('/refresh/connection-types');
    return toCamelCaseKeys<RefreshConnectionTypeOption[]>(raw);
  }

  async getRefreshSuggestions(context?: string): Promise<RefreshSuggestions> {
    const qs = context ? `?context=${context}` : '';
    const raw = await this.request<any>(`/refresh/suggestions${qs}`);
    return toCamelCaseKeys<RefreshSuggestions>(raw);
  }

  async getRefreshConnections(): Promise<RefreshConnection[]> {
    const raw = await this.request<any[]>('/refresh/connections');
    return toCamelCaseKeys<RefreshConnection[]>(raw);
  }

  async getRefreshDependencies(): Promise<RefreshDependency[]> {
    const raw = await this.request<any[]>('/refresh/dependencies');
    return toCamelCaseKeys<RefreshDependency[]>(raw);
  }

  async getRefreshConnectionHealth(): Promise<RefreshConnectionHealth[]> {
    const raw = await this.request<any[]>('/refresh/connection-health');
    return toCamelCaseKeys<RefreshConnectionHealth[]>(raw);
  }

  // Operation APIs
  async estimateRefresh(payload: RefreshEstimateRequest): Promise<RefreshEstimateResponse> {
    const raw = await this.request<any>('/refresh/estimate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<RefreshEstimateResponse>(raw);
  }

  async validateRefresh(payload: RefreshValidationRequest): Promise<RefreshValidationResponse> {
    const raw = await this.request<any>('/refresh/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<RefreshValidationResponse>(raw);
  }

  async startRefresh(payload: StartRefreshRequest): Promise<StartRefreshResponse> {
    const raw = await this.request<any>('/refresh/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toCamelCaseKeys<StartRefreshResponse>(raw);
  }

  async getRefreshStatus(orchestrationId: string): Promise<RefreshStatusResponse> {
    const raw = await this.request<any>(`/refresh/status/${orchestrationId}`);
    return toCamelCaseKeys<RefreshStatusResponse>(raw);
  }

  async getActiveRefreshOperations(): Promise<ActiveRefreshOperation[]> {
    const raw = await this.request<any[]>('/refresh/active');
    return toCamelCaseKeys<ActiveRefreshOperation[]>(raw);
  }

  // Management APIs
  async getConnectionTargets(connectionId: string): Promise<ConnectionTargetStatus[]> {
    const raw = await this.request<any[]>(`/refresh/connections/${connectionId}/targets`);
    return toCamelCaseKeys<ConnectionTargetStatus[]>(raw);
  }

  async getScheduledRefreshJobs(connectionId?: string): Promise<ScheduledRefreshJob[]> {
    const qs = connectionId ? `?connectionId=${connectionId}` : '';
    const raw = await this.request<any[]>(`/refresh/schedules${qs}`);
    return toCamelCaseKeys<ScheduledRefreshJob[]>(raw);
  }

  async getRefreshHistory(params?: Partial<{
    page: number;
    size: number;
    target: string;
    connectionId: string;
    status: string;
    startDate: string;
    endDate: string;
  }>): Promise<PageResponse<RefreshHistoryEntry>> {
    const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
    const raw = await this.request<any>(`/refresh/history${qs}`);
    return toCamelCaseKeys<PageResponse<RefreshHistoryEntry>>(raw);
  }

  // Real-time Progress API
  // Note: This creates a Server-Sent Events connection for real-time updates
  createRefreshProgressStream(orchestrationId: string): EventSource {
    const url = `${this.baseURL}/refresh/progress/${orchestrationId}`;
    const token = this.getToken();
    
    // For Server-Sent Events, we need to handle auth differently
    // Some browsers don't support custom headers with EventSource
    const eventSource = new EventSource(url);
    
    // Log the connection attempt
    devLog('Creating refresh progress stream for orchestration:', orchestrationId);
    
    return eventSource;
  }

  // Fallback method for progress polling if SSE fails
  async pollRefreshProgress(orchestrationId: string): Promise<RefreshStatusResponse> {
    return this.getRefreshStatus(orchestrationId);
  }

  // Cancel refresh operation
  async cancelRefresh(orchestrationId: string): Promise<{ cancelled: boolean; orchestrationId: string }> {
    const raw = await this.request<any>(`/refresh/${orchestrationId}/cancel`, {
      method: 'POST',
    });
    return toCamelCaseKeys(raw);
  }

  // Utility methods
  async postJson<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  async getJson<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const apiService = new ApiService();
export default apiService;