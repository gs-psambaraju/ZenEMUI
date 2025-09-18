import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation, useSearchParams } from 'react-router-dom';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import apiService from '../services/api';
import { MultiSelect } from '../components/ui/MultiSelect';
import { SingleSelect } from '../components/ui/SingleSelect';
import type { JobSummaryRow, JobType } from '../services/api';
import { FieldMappingInterface } from '../components/connectors/FieldMappingInterface';
import { SyncTriggerInterface } from '../components/connectors/SyncTriggerInterface';
import { ActivityMonitoringInterface } from '../components/connectors/ActivityMonitoringInterface';
import { ConnectorRefreshTab } from '../components/refresh/ConnectorRefreshTab';

type TabKey = 'overview' | 'jobs' | 'field-mapping' | 'sync' | 'refresh' | 'logs';

export const AdminConnectorDetail: React.FC = () => {
  const { id } = useParams();
  const location = useLocation() as any;
  const [searchParams, setSearchParams] = useSearchParams();
  const { show } = useToast();
  
  // Initialize activeTab from URL params
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const syncAction = searchParams.get('action');
  const [connector, setConnector] = useState<{ id: string; name?: string; type?: string; status?: string; baseUrl?: string; lastHealthCheckAt?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<any | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  // Settings moved to job level (removed)
  // deprecated legacy status (not used)
  const [logs, setLogs] = useState<any | null>(null);
  // Run modal state
  const [runOpen, setRunOpen] = useState(false);
  const [runType, setRunType] = useState<'reconcile' | 'backfill'>('reconcile');
  const [runEntities, setRunEntities] = useState<{ epic: boolean; issue: boolean; version: boolean }>({ epic: true, issue: true, version: false });
  const [runMode, setRunMode] = useState<'days' | 'date'>('days');
  const [runDays, setRunDays] = useState<number>(7);
  const [runSinceDate, setRunSinceDate] = useState<string>('');
  const [runJql, setRunJql] = useState<string>('');
  const [runExecType] = useState<'FULL' | 'INCREMENTAL' | 'DRY_RUN'>('INCREMENTAL');

  // Jobs list state
  const [jobs, setJobs] = useState<JobSummaryRow[] | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [editingJob, setEditingJob] = useState<JobSummaryRow | null>(null);
  const loadJobs = async () => {
    if (!id) return;
    setJobsLoading(true);
    try {
      const page = await apiService.listJobs(id, { page: 0, size: 20, sortBy: 'updatedAt', sortDirection: 'DESC' });
      setJobs(page.content || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load jobs';
      show({ title: 'Load Jobs Failed', description: msg, type: 'error' });
    } finally {
      setJobsLoading(false);
    }
  };

  // Job wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0); // 0 create, 1 filters, 2 discovery, 3 suggestions, 4 test, 5 activate
  const [jobName, setJobName] = useState('');
  const [jobType, setJobType] = useState<JobType>('PROJECT_HEALTH');
  // Schedule fields removed - will be set during job activation
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  // Filters
  const [filtersProjects, setFiltersProjects] = useState('');
  const [filtersIssueTypes, setFiltersIssueTypes] = useState('');
  const [dateType, setDateType] = useState<'ALL'|'RELATIVE'|'CUSTOM'>('RELATIVE');
  const [relativeDays, setRelativeDays] = useState(30);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filtersJql, setFiltersJql] = useState('');
  const [filterOptions, setFilterOptions] = useState<{ projects: Array<{ key: string; name: string }>; issueTypes: Array<{ name: string }>; supportedRanges: Array<'ALL'|'RELATIVE'|'CUSTOM'> } | null>(null);
  const [, setFiltersLoading] = useState(false);
  // Progress & summaries
  const [discoveryStatus, setDiscoveryStatus] = useState<any | null>(null);
  const [suggestionsSummary, setSuggestionsSummary] = useState<any | null>(null);
  const [currentMappings, setCurrentMappings] = useState<Array<{ jiraFieldId: string; zenemFieldPath: string; mappingLogic?: string; isRequired?: boolean }>>([]);
  const [discovered, setDiscovered] = useState<Array<{ id: string; name: string; usagePercentage?: number }>>([]);
  const [requiredFields, setRequiredFields] = useState<Array<{ zenemField: string; label: string; mandatory: boolean }>>([]);
  const [testSummary, setTestSummary] = useState<any | null>(null);
  const [activationSummary, setActivationSummary] = useState<any | null>(null);
  const [discoveryBtnDisabled, setDiscoveryBtnDisabled] = useState(false);
  const [discoveryBtnLabel, setDiscoveryBtnLabel] = useState('Start Discovery');
  const discoveryIntervalRef = React.useRef<number | null>(null);

  const tabs: Array<{ key: TabKey; label: string }> = useMemo(
    () => [
      { key: 'overview', label: 'Overview' },
      { key: 'jobs', label: 'Jobs' },
      { key: 'field-mapping', label: 'Field Mapping' },
      { key: 'sync', label: 'Sync' },
      { key: 'refresh', label: 'Refresh' },
      { key: 'logs', label: 'Activity' },
    ],
    []
  );

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    // Remove action param when changing tabs (unless going to sync tab)
    if (tab !== 'sync') {
      newParams.delete('action');
    }
    setSearchParams(newParams);
  };

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      try {
        // Prefer preloaded state when navigating from list to avoid flash of ID
        const preload = location?.state?.connector as any | undefined;
        const c = await (preload ? Promise.resolve(preload) : apiService.getConnectorById(id));
        setConnector(c);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        show({ title: 'Load Failed', description: msg, type: 'error' });
      }
    };
    init();
  }, [id, location?.state]);

  const checkHealth = async (): Promise<void> => {
    if (!id) return;
    setHealthLoading(true);
    try {
      const h = await apiService.getConnectorHealth(id);
      setHealth(h);
      setConnector((prev) => prev ? { ...prev, lastHealthCheckAt: h.lastHealthCheckAt ?? prev.lastHealthCheckAt } : prev);
      const statusTitle = h.reachable ? 'Health OK' : 'Health Check Failed';
      const type = h.reachable ? 'success' : 'error';
      show({ title: statusTitle, description: h.message, type });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Health check failed';
      show({ title: 'Health Check Error', description: msg, type: 'error' });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [id]);

  // Handle sync action from URL params
  useEffect(() => {
    if (syncAction === 'sync' && activeTab !== 'sync') {
      setActiveTab('sync');
    }
  }, [syncAction, activeTab]);

  // Webhooks actions moved (not used in this view)

  // Settings save removed

  // Legacy run helpers removed; using jobs API instead

  const submitRun = async () => {
    if (!id) return;
    const entities = Object.entries(runEntities)
      .filter(([, v]) => v)
      .map(([k]) => k as 'epic' | 'issue' | 'version');
    if (entities.length === 0) {
      const msg = 'Select at least one entity';
      show({ title: 'Run Job Failed', description: msg, type: 'error' });
      return;
    }
    setLoading(true);
    try {
      // Create and run one-time jobs per selected entity
      const makeJobType = (e: 'epic' | 'issue' | 'version'): JobType => (
        e === 'issue' ? 'PROJECT_HEALTH' : e === 'version' ? 'RELEASE_READINESS' : 'PROJECT_HEALTH'
      );
      const results: any[] = [];
      for (const e of entities) {
        const jobType = makeJobType(e);
        const jobName = `Adhoc ${jobType} ${new Date().toISOString()}`;
        const created = await apiService.createJob(id, { name: jobName, jobType, schedule: 'ONE_TIME' });
        const dateRange = runMode === 'days'
          ? { type: 'RELATIVE' as const, value: runType === 'reconcile' ? runDays : runDays, unit: 'DAYS' as const }
          : { type: 'CUSTOM' as const, from: runSinceDate, to: new Date().toISOString().slice(0,10) };
        await apiService.updateJobFilters(id, created.id, {
          dateRange,
          jqlOverride: runType === 'reconcile' && runJql ? runJql : undefined,
        });
        const run = await apiService.runJobNow(id, created.id, { runType: runExecType });
        results.push(run);
      }
      const msg = `${results.length} job(s) started`;
      show({ title: 'Jobs Started', description: msg, type: 'success' });
      setRunOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start job';
      show({ title: 'Start Job Failed', description: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openRunExisting = async (jobId: string) => {
    if (!id) return;
    try {
      setLoading(true);
      await apiService.runJobNow(id, jobId, { runType: 'MANUAL' as any });
      const msg = 'Run requested';
      (msg);
      show({ title: 'Job Run Requested', type: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to run job';
      show({ title: 'Run Job Failed', description: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Wizard actions
  const wizardReset = () => {
    setWizardStep(0);
    setJobName('');
    setJobType('PROJECT_HEALTH');
    setCreatedJobId(null);
    setEditingJob(null);
    setFiltersProjects('');
    setFiltersIssueTypes('');
    setDateType('RELATIVE');
    setRelativeDays(30);
    setCustomStart('');
    setCustomEnd('');
    setFiltersJql('');
    setDiscoveryStatus(null);
    setSuggestionsSummary(null);
    setTestSummary(null);
    setActivationSummary(null);
  };

  const wizardCreateJob = async () => {
    if (!id) return;
    if (!jobName.trim()) { 
      const msg = 'Job name required';
      show({ title: 'Create Job Failed', description: msg, type: 'error' });
      return; 
    }
    setLoading(true);
    try {
      const res = await apiService.createJob(id, { name: jobName.trim(), jobType });
      setCreatedJobId(res.id);
      // Load filter options as we enter Filters step
      setWizardStep(1);
      setFiltersLoading(true);
      const opts = await apiService.getFilterOptions(id);
      const uniqueIssueTypes = Array.from(new Map((opts.availableIssueTypes || []).map(i => [i.name, i])).values());
      setFilterOptions({
        projects: (opts.availableProjects || []).map(p => ({ key: p.key, name: p.name })),
        issueTypes: uniqueIssueTypes.map(i => ({ name: i.name })),
        supportedRanges: (opts.supportedDateRangeTypes || []) as Array<'ALL'|'RELATIVE'|'CUSTOM'>
      });
      setFiltersLoading(false);
      const msg = 'Job created';
      show({ title: 'Job Created', description: msg, type: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create job';
      show({ title: 'Create Job Failed', description: msg, type: 'error' });
    } finally { setLoading(false); }
  };

  const wizardSaveFilters = async () => {
    if (!id || !createdJobId) return;
    setLoading(true);
    try {
      const payload: any = {};
      if (filtersProjects.trim()) payload.projects = filtersProjects.split(',').map(s=>s.trim()).filter(Boolean);
      if (filtersIssueTypes.trim()) payload.issueTypes = filtersIssueTypes.split(',').map(s=>s.trim()).filter(Boolean);
      if (filtersJql.trim()) payload.jqlOverride = filtersJql.trim();
      payload.dateRange = dateType === 'ALL' ? { type: 'ALL' } : (dateType === 'RELATIVE' ? { type: 'RELATIVE', value: relativeDays, unit: 'DAYS' } : { type: 'CUSTOM', start: customStart, end: customEnd });
      await apiService.updateJobFilters(id, createdJobId, payload);
      setWizardStep(2);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save filters';
      show({ title: 'Save Filters Failed', description: msg, type: 'error' });
    } finally { setLoading(false); }
  };

  const wizardStartDiscovery = async () => {
    if (!id || !createdJobId) return;
    setLoading(true);
    try {
      await apiService.triggerJobDiscovery(id, createdJobId);
      setWizardStep(2);
      // poll
      const int = window.setInterval(async () => {
        const st = await apiService.getDiscoveryStatus(id, createdJobId!);
        setDiscoveryStatus(st);
        if (st.status === 'COMPLETED' || st.status === 'FAILED') {
          window.clearInterval(int);
          if (st.status === 'COMPLETED') {
            const results = await apiService.getDiscoveryResults(id, createdJobId!);
            setSuggestionsSummary(results?.summary || results);
            setWizardStep(3);
          }
          setLoading(false);
        }
      }, 2000);
    } catch (e) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : 'Failed to start discovery';
      show({ title: 'Start Discovery Failed', description: msg, type: 'error' });
    }
  };

  // Load suggestions + existing mappings when entering step 3
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!id || !createdJobId || wizardStep !== 3) return;
      setLoading(true);
      try {
        const [sug, mappings, results, required] = await Promise.all([
          apiService.getMappingSuggestions(id, createdJobId),
          apiService.getCurrentMappings(id, createdJobId).catch(() => ({ mappings: [] })),
          apiService.getDiscoveryResults(id, createdJobId).catch(() => ({ discoveredFields: [] })),
          apiService.getRequiredFields(id, createdJobId).catch(() => ({ requiredFields: [] }))
        ]);
        setSuggestionsSummary(sug);
        setCurrentMappings(Array.isArray(mappings?.mappings) ? mappings.mappings : []);
        const opts = Array.isArray(results?.discoveredFields) ? results.discoveredFields : [];
        setDiscovered(opts.map((f: any) => ({ id: f.id || f.key || f.name, name: f.name || f.key || f.id, usagePercentage: f.usagePercentage })));
        setRequiredFields(Array.isArray(required?.requiredFields) ? required.requiredFields : []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load suggestions';
        show({ title: 'Suggestions Load Failed', description: msg, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadSuggestions();
  }, [wizardStep, id, createdJobId]);

  const isMapped = (zenPath: string): boolean => currentMappings.some(m => m.zenemFieldPath === zenPath);
  
  const hasAllRequiredFieldsMapped = (): boolean => {
    const mandatoryFields = requiredFields.filter(rf => rf.mandatory);
    return mandatoryFields.every(rf => isMapped(rf.zenemField));
  };
  
  const toggleMapping = async (zenPath: string, jiraFieldId: string, required?: boolean) => {
    // Build new full set (full replacement per BE)
    const exists = currentMappings.some(m => m.zenemFieldPath === zenPath);
    const next = exists
      ? currentMappings.filter(m => m.zenemFieldPath !== zenPath)
      : [...currentMappings, { jiraFieldId, zenemFieldPath: zenPath, isRequired: !!required }];
    setCurrentMappings(next);
    if (!id || !createdJobId) return;
    try {
      await apiService.saveJobMappings(id, createdJobId, { mappings: next });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save mappings';
      show({ title: 'Save Mappings Failed', description: msg, type: 'error' });
    }
  };

  const wizardTest = async () => {
    if (!id || !createdJobId) return;
    setLoading(true);
    try {
      const res = await apiService.testJob(id, createdJobId, { sampleSize: 5 });
      setTestSummary(res?.summary || res);
      setWizardStep(4);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to test job';
      show({ title: 'Test Job Failed', description: msg, type: 'error' });
    } finally { setLoading(false); }
  };

  const wizardActivate = async () => {
    if (!id || !createdJobId) return;
    setLoading(true);
    try {
      const res = await apiService.activateJob(id, createdJobId);
      setActivationSummary(res);
      setWizardStep(5);
      await loadJobs();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to activate job';
      show({ title: 'Activate Job Failed', description: msg, type: 'error' });
    } finally { setLoading(false); }
  };

  const wizardPrev = () => setWizardStep(s => Math.max(0, s-1));
  const wizardPrimary = () => {
    if (wizardStep === 0) {
      if (editingJob) {
        setWizardStep(1);
        return;
      }
      return wizardCreateJob();
    }
    if (wizardStep === 1) return wizardSaveFilters();
    if (wizardStep === 2) return wizardStartDiscovery();
    if (wizardStep === 3) return wizardTest();
    if (wizardStep === 4) return wizardActivate();
    setWizardOpen(false);
    wizardReset();
  };
  // Consistent CTA: Step 1 explicitly "Create Job" even in edit mode per UX guidance
  const wizardPrimaryLabel = wizardStep === 0 ? 'Create Job' : wizardStep === 1 ? 'Save & Discover' : wizardStep === 2 ? 'Start Discovery' : wizardStep === 3 ? 'Test' : wizardStep === 4 ? 'Activate' : 'Close';
  const wizardCanBack = wizardStep > 0 && wizardStep < 5; // Always allow Back, even during discovery
  const wizardStepLabel = wizardStep === 0 ? 'Create' : wizardStep === 1 ? 'Filters' : wizardStep === 2 ? 'Discovery' : wizardStep === 3 ? 'Suggestions' : wizardStep === 4 ? 'Test' : 'Activate';
  const wizardShowPrimary = wizardStep !== 2; // Avoid duplicate primary on Discovery step (button rendered in-body)
  const wizardPrimaryDisabled = (!loading && wizardStep === 0 && !editingJob && !jobName.trim());

  const openEditJob = (j: JobSummaryRow) => {
    wizardReset();
    setEditingJob(j);
    setCreatedJobId(j.id);
    setJobType(j.jobType);
    setJobName(j.name);
    setWizardStep(0);
    setWizardOpen(true);
    // Preload existing filters for edit
    if (id) {
      setFiltersLoading(true);
      Promise.all([
        apiService.getFilterOptions(id),
        apiService.getJobFilters(id, j.id)
      ]).then(([opts, current]) => {
        if (opts) {
          const uniqueIssueTypes = Array.from(new Map((opts.availableIssueTypes || []).map(i => [i.name, i])).values());
          setFilterOptions({
            projects: (opts.availableProjects || []).map(p => ({ key: p.key, name: p.name })),
            issueTypes: uniqueIssueTypes.map(i => ({ name: i.name })),
            supportedRanges: (opts.supportedDateRangeTypes || []) as Array<'ALL'|'RELATIVE'|'CUSTOM'>
          });
        }
        const f = (current?.filters || {}) as any;
        if (Array.isArray(f.projects)) setFiltersProjects(f.projects.join(','));
        if (Array.isArray(f.issueTypes)) setFiltersIssueTypes(f.issueTypes.join(','));
        if (f.dateRange?.type === 'ALL') setDateType('ALL');
        else if (f.dateRange?.type === 'CUSTOM') { setDateType('CUSTOM'); setCustomStart(f.dateRange.start || ''); setCustomEnd(f.dateRange.end || ''); }
        else if (f.dateRange?.type === 'RELATIVE') { setDateType('RELATIVE'); setRelativeDays(f.dateRange.value || 30); }
        if (typeof f.jqlOverride === 'string') setFiltersJql(f.jqlOverride);
      }).finally(() => setFiltersLoading(false));
    }
  };

  const loadLogs = async () => {
    if (!id) return;
    setLoading(true);
    (null);
    (null);
    try {
      const l = await apiService.getLogs(id, { level: 'ERROR', page: 0, size: 20 });
      setLogs(l);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load logs';
      show({ title: 'Load Logs Failed', description: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Clean up polling if step/modal changes
  useEffect(() => {
    if (!wizardOpen || wizardStep !== 2) {
      if (discoveryIntervalRef.current) {
        window.clearInterval(discoveryIntervalRef.current);
        discoveryIntervalRef.current = null;
      }
    }
  }, [wizardOpen, wizardStep]);

  // Check existing discovery when entering Discovery step
  useEffect(() => {
    const checkExisting = async () => {
      if (!id || !createdJobId || wizardStep !== 2) return;
      try {
        const st = await apiService.getDiscoveryStatus(id, createdJobId);
        setDiscoveryStatus(st);
        if ((st as any)?.status === 'NONE') {
          setDiscoveryBtnDisabled(false);
          setDiscoveryBtnLabel('Discover Fields');
          return;
        }
        if ((st as any)?.status === 'RUNNING') {
          setDiscoveryBtnDisabled(true);
          setDiscoveryBtnLabel(`Discovering...${typeof (st as any)?.progress?.percentage === 'number' ? ` (${Math.round((st as any).progress.percentage)}%)` : ''}`);
          // resume polling
          if (!discoveryIntervalRef.current) {
            discoveryIntervalRef.current = window.setInterval(async () => {
              const cur = await apiService.getDiscoveryStatus(id, createdJobId);
              setDiscoveryStatus(cur);
              if ((cur as any)?.status === 'RUNNING') {
                setDiscoveryBtnLabel(`Discovering...${typeof (cur as any)?.progress?.percentage === 'number' ? ` (${Math.round((cur as any).progress.percentage)}%)` : ''}`);
              }
              if ((cur as any)?.status === 'COMPLETED' || (cur as any)?.status === 'FAILED') {
                if (discoveryIntervalRef.current) {
                  window.clearInterval(discoveryIntervalRef.current);
                  discoveryIntervalRef.current = null;
                }
                if ((cur as any)?.status === 'COMPLETED') {
                  const results = await apiService.getDiscoveryResults(id, createdJobId);
                  setSuggestionsSummary(results?.summary || results);
                  setDiscoveryBtnDisabled(false);
                  setDiscoveryBtnLabel('Discover Again');
                } else {
                  setDiscoveryBtnDisabled(false);
                  setDiscoveryBtnLabel('Try Again');
                }
              }
            }, 2000);
          }
        } else if ((st as any)?.status === 'COMPLETED') {
          const results = await apiService.getDiscoveryResults(id, createdJobId);
          setSuggestionsSummary(results?.summary || results);
          setDiscoveryBtnDisabled(false);
          setDiscoveryBtnLabel('Discover Again');
        } else if ((st as any)?.status === 'FAILED') {
          setDiscoveryBtnDisabled(false);
          setDiscoveryBtnLabel('Try Again');
        } else {
          setDiscoveryBtnDisabled(false);
          setDiscoveryBtnLabel('Discover Fields');
        }
      } catch (e) {
        // Treat errors/404 as no existing discovery
        setDiscoveryStatus(null);
        setDiscoveryBtnDisabled(false);
        setDiscoveryBtnLabel('Discover Fields');
      }
    };
    checkExisting();
  }, [wizardStep, id, createdJobId]);

  // Field mapping moved to jobs wizard; state and handlers removed

  return (
    <SidebarLayout>
      <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
        <div>
          <Link to="/admin/connectors" className="hover:underline">Connectors</Link> / <span className="text-gray-700">{connector?.name || id}</span>
        </div>
        <div />
      </div>

      <div className="mb-6 flex items-center space-x-2 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error and success messages now handled via toast notifications */}

      {activeTab === 'overview' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <div className="text-gray-500">Name</div>
              <div className="text-gray-900">{connector?.name || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Type</div>
              <div>
                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                  {connector?.type || 'JIRA'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-gray-500">Base URL</div>
              <div className="text-gray-900 break-all">{connector?.baseUrl || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <div>
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${connector?.status==='ACTIVE' || connector?.status==='VERIFIED' ? 'bg-green-50 text-green-700' : connector?.status==='DISABLED' ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-700'}`}>
                  {connector?.status || '-'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Health Information (on-demand) */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-md font-medium text-gray-900">Health</h3>
                <div className="text-xs text-gray-600 mt-1">Last health check: {connector?.lastHealthCheckAt ? new Date(connector.lastHealthCheckAt).toLocaleString() : '-'}
                </div>
              </div>
              <button
                onClick={checkHealth}
                disabled={healthLoading}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm ${!healthLoading ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
              >
                {healthLoading ? 'Checking…' : 'Check Health'}
              </button>
            </div>
            {health && (
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${health.reachable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {health.reachable ? '✅ Healthy' : '❌ Unhealthy'}
                  </span>
                  {typeof health.httpStatus === 'number' && (
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">HTTP {health.httpStatus}</span>
                  )}
                </div>
                {!health.reachable && (
                  <div className="text-xs rounded border border-red-200 bg-red-50 text-red-800 p-3 space-y-1">
                    <div><span className="font-medium">Message:</span> {health.message || '-'}</div>
                    {health.errorCode && <div><span className="font-medium">Code:</span> {health.errorCode}</div>}
                    {typeof health.rateLimitRemaining === 'number' && (
                      <div><span className="font-medium">Rate Limit Remaining:</span> {health.rateLimitRemaining}</div>
                    )}
                    {health.lastSuccessAt && (
                      <div><span className="font-medium">Last Success:</span> {new Date(health.lastSuccessAt).toLocaleString()}</div>
                    )}
                    {health.lastErrorAt && (
                      <div><span className="font-medium">Last Error:</span> {new Date(health.lastErrorAt).toLocaleString()}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Removed run buttons and health refresh per UX */}
        </Card>
      )}

      {/* Health tab removed - content integrated into Overview */}

      {/* Settings tab removed (job-level now) */}

      {activeTab === 'jobs' && (
        <div className="space-y-4">
        <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
              <div className="space-x-2">
                <Button variant="secondary" onClick={loadJobs} disabled={jobsLoading}>Refresh</Button>
                <Button onClick={() => { wizardReset(); setWizardOpen(true); }}>New Job</Button>
              </div>
            </div>
            {jobsLoading && <p className="text-sm text-gray-600 mt-2">Loading jobs…</p>}
            {!jobsLoading && (!jobs || jobs.length === 0) && (
              <p className="text-sm text-gray-600 mt-3">No jobs yet. Click “New Job” to set up your first job.</p>
            )}
            {!jobsLoading && jobs && jobs.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last / Next</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map(j => (
                      <tr key={j.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{j.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700"><span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{j.jobType}</span></td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${j.status==='ACTIVE' ? 'bg-green-50 text-green-700' : j.status==='PAUSED' || j.status==='ARCHIVED' ? 'bg-gray-100 text-gray-700' : j.status==='FAILED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{j.status}</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{j.schedule}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{j.lastRunAt || '-'} / {j.nextRunAt || '-'}</td>
                        <td className="px-4 py-2 text-sm text-right whitespace-nowrap">
                          <Button variant="secondary" onClick={() => openEditJob(j)} className="px-2 py-1 mr-2">Edit</Button>
                          <Button variant="secondary" onClick={() => openRunExisting(j.id)} className="px-2 py-1" disabled={j.status === 'DRAFT'}>Run Now</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Run Modal */}
      <Modal
        open={runOpen}
        onClose={() => setRunOpen(false)}
        title="Start job"
        size="md"
        footer={
          <div className="flex items-center justify-between">
            {/* Tertiary action on the left per common modal patterns */}
            <button
              onClick={() => setRunOpen(false)}
              className="px-3 py-2 rounded border text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            {/* Primary group on the right: secondary then primary */}
            <div className="space-x-2">
              <button
                onClick={submitRun}
                disabled={loading}
                className={`px-3 py-2 rounded ${!loading ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
              >
                {loading ? 'Starting…' : 'Start'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Run Type</label>
            <div className="flex items-center gap-2 text-sm">
              <label className="inline-flex items-center gap-1"><input type="radio" checked={runType==='reconcile'} onChange={() => setRunType('reconcile')} /> Reconcile</label>
              <label className="inline-flex items-center gap-1"><input type="radio" checked={runType==='backfill'} onChange={() => setRunType('backfill')} /> Backfill</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entities</label>
            <div className="flex items-center gap-3 text-sm">
              <label className="inline-flex items-center gap-1"><input type="checkbox" checked={runEntities.epic} onChange={(e) => setRunEntities({ ...runEntities, epic: e.target.checked })} /> Epics</label>
              <label className="inline-flex items-center gap-1"><input type="checkbox" checked={runEntities.issue} onChange={(e) => setRunEntities({ ...runEntities, issue: e.target.checked })} /> Issues</label>
              <label className="inline-flex items-center gap-1"><input type="checkbox" checked={runEntities.version} onChange={(e) => setRunEntities({ ...runEntities, version: e.target.checked })} /> Versions</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
            <div className="flex items-center gap-3 text-sm">
              <label className="inline-flex items-center gap-1"><input type="radio" checked={runMode==='days'} onChange={() => setRunMode('days')} /> Last
                <input type="number" min={1} max={3650} className="ml-2 w-20 border rounded px-2 py-1" value={runDays} onChange={(e) => setRunDays(parseInt(e.target.value || '1', 10))} /> days
              </label>
              <label className="inline-flex items-center gap-1"><input type="radio" checked={runMode==='date'} onChange={() => setRunMode('date')} /> Since
                <input type="date" className="ml-2 border rounded px-2 py-1" value={runSinceDate} onChange={(e) => setRunSinceDate(e.target.value)} />
              </label>
            </div>
          </div>
          {runType==='reconcile' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">JQL (optional)</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Override JQL scope" value={runJql} onChange={(e) => setRunJql(e.target.value)} />
            </div>
          )}
        </div>
      </Modal>

      {/* Job Wizard */}
      <Modal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={`${editingJob ? 'Edit Job' : 'New Job'}${createdJobId ? ' • ' + (wizardStepLabel || '') : ''}`}
        headerExtras={
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className={`${wizardStep===0?'text-blue-700 font-medium':'text-gray-600'}`}>Create</span>
            <span>›</span>
            <span className={`${wizardStep===1?'text-blue-700 font-medium':'text-gray-600'}`}>Filters</span>
            <span>›</span>
            <span className={`${wizardStep===2?'text-blue-700 font-medium':'text-gray-600'}`}>Discovery</span>
            <span>›</span>
            <span className={`${wizardStep===3?'text-blue-700 font-medium':'text-gray-600'}`}>Suggestions</span>
            <span>›</span>
            <span className={`${wizardStep===4?'text-blue-700 font-medium':'text-gray-600'}`}>Preview</span>
            <span>›</span>
            <span className={`${wizardStep===5?'text-blue-700 font-medium':'text-gray-600'}`}>Activate</span>
          </div>
        }
        size="xl"
        footer={
          <div className="flex items-center justify-between">
            {/* Left: Close/cancel */}
            <button
              onClick={() => setWizardOpen(false)}
              className="px-3 py-2 rounded border text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Close
            </button>
            {/* Right: Back then Primary; hide primary for the Discovery step to avoid duplication */}
            <div className="space-x-2">
              {wizardCanBack && (
                <button
                  onClick={wizardPrev}
                  className="px-3 py-2 rounded border text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Back
                </button>
              )}
              {wizardShowPrimary && (
                <button
                  onClick={wizardPrimary}
                  disabled={loading || wizardPrimaryDisabled}
                  className={`px-3 py-2 rounded ${!(loading || wizardPrimaryDisabled) ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                >
                  {loading ? 'Working…' : wizardPrimaryLabel}
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {wizardStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Job Name</label>
                  <input className="w-full border rounded px-3 py-2 text-sm" value={jobName} onChange={(e)=>setJobName(e.target.value)} placeholder="Sync Epic Data" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Use Case</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={jobType} onChange={(e)=>setJobType(e.target.value as JobType)}>
                    <option value="PROJECT_HEALTH">Project Health Monitoring</option>
                    <option value="SPRINT_ANALYTICS">Sprint Performance Analytics</option>
                    <option value="RELEASE_READINESS">Release Readiness Tracking</option>
                    <option value="TEAM_CAPACITY">Team Workload & Capacity Planning</option>
                    <option value="QUALITY_MANAGEMENT">Quality & Technical Debt Management</option>
                  </select>
                </div>
              </div>
              <div className="text-xs text-gray-500">Create the job to continue to filters. Schedule will be configured after mapping definition.</div>
            </div>
          )}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Projects</label>
                  <MultiSelect
                    options={(filterOptions?.projects || []).map(p => ({ value: p.key, label: `${p.name} (${p.key})` }))}
                    value={filtersProjects.split(',').filter(Boolean)}
                    onChange={(vals) => setFiltersProjects(vals.join(','))}
                    placeholder="Search projects..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Issue Types</label>
                  <MultiSelect
                    options={(filterOptions?.issueTypes || []).map(it => ({ value: it.name, label: it.name }))}
                    value={filtersIssueTypes.split(',').filter(Boolean)}
                    onChange={(vals) => setFiltersIssueTypes(vals.join(','))}
                    placeholder="Search issue types..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Date Range</label>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="inline-flex items-center gap-1"><input type="radio" checked={dateType==='ALL'} onChange={()=>setDateType('ALL')} /> All time</label>
                  <label className="inline-flex items-center gap-1"><input type="radio" checked={dateType==='RELATIVE'} onChange={()=>setDateType('RELATIVE')} /> Last <input type="number" min={1} className="ml-1 w-20 border rounded px-2 py-1" value={relativeDays} onChange={(e)=>setRelativeDays(parseInt(e.target.value || '1',10))} /> days</label>
                  <label className="inline-flex items-center gap-1"><input type="radio" checked={dateType==='CUSTOM'} onChange={()=>setDateType('CUSTOM')} /> From <input type="date" className="ml-1 border rounded px-2 py-1" value={customStart} onChange={(e)=>setCustomStart(e.target.value)} /> to <input type="date" className="ml-1 border rounded px-2 py-1" value={customEnd} onChange={(e)=>setCustomEnd(e.target.value)} /></label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">JQL Override (optional)</label>
                <input className="w-full border rounded px-3 py-2 text-sm" value={filtersJql} onChange={(e)=>setFiltersJql(e.target.value)} placeholder="project = GT AND type = Story AND updated >= -30d" />
                <p className="text-xs text-gray-500 mt-1">When provided, JQL takes precedence over other filters.</p>
              </div>
            </div>
          )}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">Start field discovery for this job and watch progress.</p>
                <button onClick={wizardStartDiscovery} className={`px-3 py-2 rounded ${!loading && !discoveryBtnDisabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`} disabled={loading || discoveryBtnDisabled}>{discoveryBtnLabel}</button>
              </div>

              {/* Status panel */}
              {!discoveryStatus && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  Discovery has not started yet. Click “Start Discovery” to begin.
                </div>
              )}

              {discoveryStatus && discoveryStatus.status === 'RUNNING' && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-600" />
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-4 w-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
                      Running discovery{typeof discoveryStatus?.progress?.percentage === 'number' ? ` • ${Math.round(discoveryStatus.progress.percentage)}%` : ''}
                    </span>
                  </div>
                  {/* Animated progress bar */}
                  {typeof discoveryStatus?.progress?.percentage === 'number' && (
                    <div className="mt-2">
                      <div className="h-2 w-full bg-blue-100 rounded">
                        <div
                          className="h-2 bg-blue-600 rounded transition-all duration-500 ease-in-out"
                          style={{ width: `${Math.max(0, Math.min(100, Math.round(discoveryStatus.progress.percentage)))}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {typeof discoveryStatus?.progress?.recordsProcessed === 'number' && typeof discoveryStatus?.progress?.totalRecords === 'number' && (
                    <div className="mt-1 text-xs">
                      {discoveryStatus.progress.recordsProcessed} / {discoveryStatus.progress.totalRecords} records processed
                    </div>
                  )}
                </div>
              )}

              {discoveryStatus && discoveryStatus.status === 'COMPLETED' && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <div className="font-medium">Discovery completed</div>
                  {typeof discoveryStatus?.progress?.fieldsFound === 'number' && (
                    <div className="mt-1 text-xs text-green-900">Fields discovered: {discoveryStatus.progress.fieldsFound}</div>
                  )}
                  <div className="mt-2 text-xs text-green-900">Proceed to suggestions.</div>
                </div>
              )}

              {discoveryStatus && discoveryStatus.status === 'FAILED' && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <div className="font-medium">Discovery failed</div>
                  {discoveryStatus?.message && <div className="mt-1 text-xs">{discoveryStatus.message}</div>}
                </div>
              )}
            </div>
          )}
          {wizardStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-800 font-medium">Smart Mapping Suggestions</div>
                <div className="space-x-2 flex items-center">
                  <button onClick={async () => { if (!id || !createdJobId) return; const sug = await apiService.getMappingSuggestions(id, createdJobId); setSuggestionsSummary(sug); }} className="text-sm text-blue-700 hover:underline">Refresh</button>
                  {!hasAllRequiredFieldsMapped() && (
                    <span className="text-xs text-amber-600">⚠️ Map all required fields to continue</span>
                  )}
                  <button 
                    onClick={() => setWizardStep(4)} 
                    disabled={!hasAllRequiredFieldsMapped()}
                    className={`px-3 py-2 rounded ${hasAllRequiredFieldsMapped() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    Continue
                  </button>
                </div>
              </div>
              {/* Debug data */}
              {import.meta.env.DEV && (
                <div className="bg-yellow-50 p-2 text-xs">
                  <div>Required Fields: {requiredFields.length}</div>
                  <div>Entities: {(suggestionsSummary?.entities || []).length}</div>
                  <div>Discovered: {discovered.length}</div>
                  {requiredFields.slice(0, 3).map(rf => <div key={rf.zenemField}>{rf.zenemField} - {rf.label}</div>)}
                </div>
              )}
              
              {/* Show entities if we have suggestions, else fallback message */}
              {(suggestionsSummary?.entities || []).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">No mapping suggestions loaded.</div>
                  <button 
                    onClick={async () => { 
                      if (!id || !createdJobId) return; 
                      try {
                        const [sug, required] = await Promise.all([
                          apiService.getMappingSuggestions(id, createdJobId), 
                          apiService.getRequiredFields(id, createdJobId).catch(() => ({ requiredFields: [] }))
                        ]);
                        setSuggestionsSummary(sug); 
                        setRequiredFields(Array.isArray(required?.requiredFields) ? required.requiredFields : []);
                      } catch (e) {
                        console.error('Reload failed:', e);
                      }
                    }} 
                    className="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    Reload Suggestions
                  </button>
                </div>
              )}

              {/* Entity-grouped suggestions */}
              <div className="space-y-4">
                {(suggestionsSummary?.entities || []).map((ent: any) => (
                  <div key={ent.entityType} className="border rounded-md">
                    <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium text-gray-800 flex items-center justify-between">
                      <span>{ent.entityLabel || ent.entityType}</span>
                      <span className="text-xs text-gray-600">Required fields auto-validated</span>
                    </div>
                    <div className="p-3 space-y-3">
                      {/* Grid: Source (Jira dropdown) → Target (ZenEM fixed) */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-3 py-2 text-left">Source (Jira)</th>
                              <th className="px-3 py-2 text-left">Target (ZenEM)</th>
                              <th className="px-3 py-2 text-left">Required</th>
                              <th className="px-3 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {requiredFields.map((field, idx) => {
                              const mapped = currentMappings.find(m => m.zenemFieldPath === field.zenemField);
                              const options = discovered.map((f) => ({ value: f.id, label: f.name, hint: typeof f.usagePercentage === 'number' ? `${Math.round(f.usagePercentage)}%` : undefined }));
                              
                              // Get suggested value from auto-mapped or unmapped suggestions
                              let suggestedValue = null;
                              const autoMapped = (ent.autoMappedFields || []).find((m: any) => m.zenemField === field.zenemField);
                              if (autoMapped) {
                                suggestedValue = autoMapped?.jiraField?.id || autoMapped?.jiraField?.key || autoMapped?.jiraField?.name;
                              } else {
                                const unmapped = (ent.unmappedFields || []).find((u: any) => u.zenemField === field.zenemField);
                                if (unmapped && Array.isArray(unmapped.availableJiraFields) && unmapped.availableJiraFields.length > 0) {
                                  const first = unmapped.availableJiraFields[0];
                                  suggestedValue = typeof first === 'string' ? first : (first?.id || first?.key || first?.name);
                                }
                              }
                              
                              const value = mapped?.jiraFieldId || suggestedValue || null;
                              
                              return (
                                <tr key={field.zenemField + idx}>
                                  <td className="px-3 py-2">
                                    <SingleSelect
                                      options={options}
                                      value={value}
                                      onChange={(v) => toggleMapping(field.zenemField, v || '', field.mandatory)}
                                      placeholder="Select Jira field…"
                                    />
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-gray-800">{field.label}</div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {field.mandatory && <div className="text-amber-700">⚠️ Mandatory</div>}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2 py-1 rounded ${isMapped(field.zenemField) ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                      {isMapped(field.zenemField) ? 'Mapped' : 'Unmapped'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {requiredFields.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-gray-500 text-sm">
                                  No required fields loaded. Check API responses.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-800 font-medium">Preview & Test</div>
                <div className="space-x-2">
                  <button onClick={async () => { if (!id || !createdJobId) return; setLoading(true); try { const res = await apiService.previewJob(id, createdJobId, { previewDays: 7, maxRecords: 100 }); setTestSummary(res); } finally { setLoading(false);} }} className={`px-3 py-2 rounded ${!loading ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`} disabled={loading}>Test First</button>
                  <button onClick={wizardActivate} className={`px-3 py-2 rounded ${!loading ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`} disabled={loading}>Activate</button>
                </div>
              </div>
              <div className="text-xs bg-gray-50 p-3 rounded"><pre>{JSON.stringify(testSummary, null, 2)}</pre></div>
            </div>
          )}
          {wizardStep === 5 && (
            <div className="space-y-3">
              <div className="text-sm">Activate the job and optionally Run Now.</div>
              <button onClick={wizardActivate} className="px-3 py-2 rounded bg-blue-600 text-white" disabled={loading}>Activate</button>
              <div className="text-xs bg-gray-50 p-3 rounded"><pre>{JSON.stringify(activationSummary, null, 2)}</pre></div>
            </div>
          )}
        </div>
      </Modal>

      {activeTab === 'field-mapping' && id && (
        <FieldMappingInterface
          connectorId={id}
          jobId={editingJob?.id || createdJobId || ''}
          onMappingsSaved={() => {
            show({ title: 'Mappings saved successfully', type: 'success' });
            loadJobs();
          }}
          onValidationChange={(isValid) => {
            // Could be used to enable/disable other actions
            console.log('Field mapping validation:', isValid);
          }}
        />
      )}

      {activeTab === 'sync' && id && (
        <SyncTriggerInterface
          connectorId={id}
          connectorName={connector?.name}
          onSyncComplete={(result) => {
            show({ 
              title: 'Sync completed', 
              description: `Successfully imported ${result?.metrics?.epicsImported || 0} epics`,
              type: 'success' 
            });
            loadJobs(); // Refresh jobs data
          }}
        />
      )}

      {activeTab === 'refresh' && id && (
        <ConnectorRefreshTab
          connectorId={id}
          onRefreshStarted={(orchestrationId) => {
            show({
              title: 'Refresh Started',
              description: `Refresh operation started. You can monitor progress in the dedicated dashboard.`,
              type: 'success'
            });
          }}
        />
      )}

      {activeTab === 'logs' && id && (
        <ActivityMonitoringInterface
          connectorId={id}
          connectorName={connector?.name}
        />
      )}

      {/* Field mapping now part of jobs wizard; tab removed */}
    </SidebarLayout>
  );
};

export default AdminConnectorDetail;


