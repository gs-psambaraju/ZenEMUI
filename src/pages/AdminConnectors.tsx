import React, { useEffect, useMemo, useState } from 'react';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { PageResponse, ConnectorRow, ConnectorHealth, ConnectorCatalog } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const AdminConnectors: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useToast();
  const [data, setData] = useState<PageResponse<ConnectorRow> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ConnectorCatalog | null>(null);

  const [createForm, setCreateForm] = useState({ name: '', baseUrl: '', email: '', apiToken: '', defaultJql: '' });
  // Using catalog-based flow by default
  // const [useCatalogForm] = useState(true);
  const [booting, setBooting] = useState(true);
  const [selectedConnectorType, setSelectedConnectorType] = useState<string>('');
  const [selectedAuthMethodId, setSelectedAuthMethodId] = useState<string>('');
  const [health] = useState<Record<string, ConnectorHealth | null>>({});
  const [jobsOverview, setJobsOverview] = useState<Record<string, { totalJobs: number; activeJobs: number; lastSync?: string }>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [revealToken, setRevealToken] = useState(false);
  // Re-authorize modal state
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthForId, setReauthForId] = useState<string | null>(null);
  const [reauthEmail, setReauthEmail] = useState('');
  const [reauthToken, setReauthToken] = useState('');
  const [reauthReveal, setReauthReveal] = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);

  const loadJobsOverview = async (connectors: any[]) => {
    const overviewPromises = connectors.map(async (connector) => {
      try {
        const jobsPage = await apiService.listJobs(connector.id, { page: 0, size: 100 });
        const jobs = jobsPage.content || [];
        const activeJobs = jobs.filter((job: any) => job.status === 'ACTIVE').length;
        const lastSync = jobs
          .filter((job: any) => job.lastRunAt)
          .sort((a: any, b: any) => new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime())[0]?.lastRunAt;
        
        return {
          connectorId: connector.id,
          data: {
            totalJobs: jobs.length,
            activeJobs,
            lastSync,
          }
        };
      } catch (e) {
        // Silently fail for individual connector jobs - don't break the main flow
        return {
          connectorId: connector.id,
          data: { totalJobs: 0, activeJobs: 0 }
        };
      }
    });

    const overviewResults = await Promise.all(overviewPromises);
    const overviewMap = overviewResults.reduce((acc, { connectorId, data }) => {
      acc[connectorId] = data;
      return acc;
    }, {} as Record<string, { totalJobs: number; activeJobs: number; lastSync?: string }>);
    
    setJobsOverview(overviewMap);
  };

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resp, cat] = await Promise.all([
        apiService.listConnectors({ page: 0, size: 20 }),
        apiService.getConnectorCatalog(),
      ]);
      setData(resp);
      setCatalog(cat);
      
      // Load jobs overview for all connectors
      if (resp.content && resp.content.length > 0) {
        await loadJobsOverview(resp.content);
      }
      
      if (cat?.items?.length && !selectedConnectorType) {
        setSelectedConnectorType(cat.items[0].type);
        setSelectedAuthMethodId(cat.items[0].authMethods[0]?.id || '');
      }
    } catch (e) {
      const error = e as Error;
      let errorTitle = 'Loading Failed';
      let errorDescription = 'Failed to load connectors';
      
      // Provide more specific error messages
      if (error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('fetch')) {
        errorTitle = 'Connection Error';
        errorDescription = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.message?.toLowerCase().includes('unauthorized') || error.message?.toLowerCase().includes('401')) {
        errorTitle = 'Authentication Required';
        errorDescription = 'Your session has expired. Please refresh the page to log in again.';
      } else if (error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('404')) {
        errorTitle = 'Service Unavailable';
        errorDescription = 'The connector service is not available. The backend may not be running.';
      } else if (error.message?.toLowerCase().includes('server') || error.message?.toLowerCase().includes('500')) {
        errorTitle = 'Server Error';
        errorDescription = 'Server is experiencing issues. Please try again in a few minutes.';
      } else if (error.message) {
        errorDescription = error.message;
      }
      
      setError(errorDescription);
      show({ title: errorTitle, description: errorDescription, type: 'error' });
    } finally {
      setIsLoading(false);
      setBooting(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // no-op

  const filteredContent = useMemo(() => {
    const rows = data?.content || [];
    return rows.filter(r => {
      const matchesSearch = search
        ? r.name.toLowerCase().includes(search.toLowerCase()) || r.baseUrl?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesType = typeFilter === 'all' ? true : r.type === typeFilter;
      const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, search, typeFilter, statusFilter]);

  const catalogItems = useMemo(() => {
    const items = catalog?.items || [];
    if (!catalogSearch) return items;
    return items.filter(i =>
      i.displayName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (i.description || '').toLowerCase().includes(catalogSearch.toLowerCase())
    );
  }, [catalog, catalogSearch]);

  const selectedMethod = useMemo(() => {
    const item = catalog?.items.find(i => i.type === selectedConnectorType);
    return item?.authMethods.find(m => m.id === selectedAuthMethodId) || item?.authMethods[0];
  }, [catalog, selectedConnectorType, selectedAuthMethodId]);

  const isFormValid = useMemo(() => {
    const fields = selectedMethod?.fields || [];
    return fields.every(f => {
      if (!f.required) return true;
      const v = (f.name === 'connectionName') ? createForm.name : (f.name === 'jiraBaseUrl' ? createForm.baseUrl : (f.name === 'username' ? createForm.email : (f.name === 'apiToken' ? createForm.apiToken : '')));
      return !!v && v.trim().length > 0;
    });
  }, [selectedMethod, createForm]);
  

  const continueCreate = async () => {
    setError(null);
    setLoading(true);
    
    try {
      if (catalog && selectedConnectorType) {
        if (selectedConnectorType === 'JIRA') {
          const created = await apiService.createJiraConnectorCatalog({
            connectionName: createForm.name,
            jiraBaseUrl: createForm.baseUrl,
            authenticationType: 'API_TOKEN',
            username: createForm.email,
            apiToken: createForm.apiToken,
            syncEnabled: true,
            syncFrequencyMinutes: 60,
            syncJqlFilter: createForm.defaultJql || undefined,
          });
          if (created?.id) {
            try {
              await apiService.verifyConnector(created.id);
              navigate(`/admin/connectors/${created.id}`);
              show({ title: 'Connection created', description: 'Verification started', type: 'success' });
            } catch (verifyError) {
              // Connection created but verification failed - still navigate but show warning
              navigate(`/admin/connectors/${created.id}`);
              show({ 
                title: 'Connection created', 
                description: 'Connection saved but verification failed. You can verify it later.', 
                type: 'warning' 
              });
            }
          }
        } else {
          const item = catalog.items.find(i => i.type === selectedConnectorType);
          const method = selectedMethod || item?.authMethods[0];
          if (!item || !method) throw new Error('No auth method for selected connector');
          const endpoint = method.createEndpoint;
          const body: Record<string, any> = { connectionName: createForm.name };
          // Best-effort generic mapping from common fields
          body.baseUrl = createForm.baseUrl;
          body.username = createForm.email;
          body.apiToken = createForm.apiToken;
          if (createForm.defaultJql) body.syncJqlFilter = createForm.defaultJql;
          const created = await apiService.postJson<{ id?: string }>(endpoint, body);
          if (created?.id) {
            navigate(`/admin/connectors/${created.id}`);
            show({ title: 'Connection created', type: 'success' });
          } else {
            show({ title: 'Connection created', description: 'Verify the connection in details page', type: 'info' });
          }
        }
      }
      setIsCreateOpen(false);
      setCreateForm({ name: '', baseUrl: '', email: '', apiToken: '', defaultJql: '' });
      await load();
    } catch (e) {
      const error = e as Error;
      let errorTitle = 'Connection Failed';
      let errorDescription = 'Unable to create connection';
      
      // Provide more specific error messages based on error type
      if (error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('fetch')) {
        errorTitle = 'Network Error';
        errorDescription = 'Cannot reach the server. Please check your internet connection and try again.';
      } else if (error.message?.toLowerCase().includes('unauthorized') || error.message?.toLowerCase().includes('401')) {
        errorTitle = 'Authentication Failed';
        errorDescription = 'Invalid credentials. Please check your API token and email address.';
      } else if (error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('404')) {
        errorTitle = 'Service Not Available';
        errorDescription = 'The connector service is not available. Please try again later or contact support.';
      } else if (error.message?.toLowerCase().includes('timeout')) {
        errorTitle = 'Request Timeout';
        errorDescription = 'The request took too long. Please try again.';
      } else if (error.message?.toLowerCase().includes('server') || error.message?.toLowerCase().includes('500')) {
        errorTitle = 'Server Error';
        errorDescription = 'Server is experiencing issues. Please try again in a few minutes.';
      } else if (error.message) {
        errorDescription = error.message;
      }
      
      setError(errorDescription);
      show({ 
        title: errorTitle, 
        description: errorDescription, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Legacy create handler (kept for potential fallback flows)
  // Deprecated (kept for reference; not used)
  // const handleCreate = async (_e: React.FormEvent) => {};

  const handleVerify = async (id: string) => {
    try {
      await apiService.verifyConnector(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verify failed');
    }
  };

  const handleDisable = async (id: string) => {
    try {
      await apiService.updateConnector(id, { status: 'DISABLED' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Disable failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this connection? This cannot be undone.')) return;
    try {
      await apiService.deleteConnector(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const handleReauthorize = (id: string) => {
    setReauthForId(id);
    setReauthEmail('');
    setReauthToken('');
    setReauthReveal(false);
    setReauthOpen(true);
  };

  const submitReauthorize = async (): Promise<void> => {
    if (!reauthForId) return;
    setReauthLoading(true);
    setError(null);
    try {
      await apiService.reauthorizeConnector(reauthForId, { email: reauthEmail, apiToken: reauthToken });
      show({ title: 'Re-authorized', type: 'success' });
      setReauthOpen(false);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Reauthorize failed';
      setError(msg);
      show({ title: 'Re-authorize failed', description: String(msg), type: 'error' });
    } finally {
      setReauthLoading(false);
    }
  };

  // Reserved for future health action (not used)
  // const handleHealth = async (_id: string) => {};

  return (
    <SidebarLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin • Connectors</h1>
        <p className="mt-2 text-gray-600">Manage connectors and view health.</p>
      </div>

      {/* List / Empty State */}

      {/* List */}
      <div className="mt-6">
        <Card className="min-h-[60vh]">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connectors</h2>
          {(booting || isLoading) && (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">Loading connectors...</span>
            </div>
          )}
          
          {/* Error State - Backend Not Available */}
          {!booting && !isLoading && !data && (
            <div className="text-center py-16">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Unavailable</h3>
              <p className="text-gray-600 mb-4">
                Unable to connect to the connector service. This might be because:
              </p>
              <ul className="text-sm text-gray-500 mb-6 text-left max-w-md mx-auto space-y-1">
                <li>• The backend server is not running</li>
                <li>• Network connectivity issues</li>
                <li>• The service is temporarily down</li>
              </ul>
              <div className="space-x-3">
                <button 
                  onClick={load} 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-flex items-center"
                >
                  {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isLoading ? 'Retrying...' : 'Retry'}
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}

          {/* Empty State - No Connectors */}
          {!booting && !isLoading && data && data.totalElements === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">🔌</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No connections yet</h3>
              <p className="text-gray-600 mb-4">Connect your tools to sync epics, sprints, releases, and more.</p>
              <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Create connection</button>
            </div>
          )}

          {/* Data Table */}
          {!booting && !isLoading && data && data.totalElements > 0 && (
            <div className="overflow-x-auto">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or URL" className="border rounded px-3 py-2 w-64" />
                  <select className="border rounded px-2 py-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="all">All types</option>
                    {Array.from(new Set((catalog?.items || []).map(i => i.type))).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select className="border rounded px-2 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All status</option>
                    {['VERIFIED','ACTIVE','DISABLED','ERROR'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">Create connection</button>
              </div>
              <table className="min-w-full divide-y divide-gray-200" style={{ overflow: 'visible' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sync</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContent.map((c) => {
                    const jobInfo = jobsOverview[c.id];
                    return (
                    <tr key={c.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{c.name || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{c.type || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        <span className={`px-2 py-1 text-xs rounded-full ${c.status==='ACTIVE' || c.status==='VERIFIED' ? 'bg-green-50 text-green-700' : c.status==='DISABLED' ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-700'}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {jobInfo ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 font-medium">{jobInfo.totalJobs}</span>
                            <span className="text-gray-500">total</span>
                            {jobInfo.activeJobs > 0 && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-50 text-green-700">
                                  {jobInfo.activeJobs} active
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{jobInfo?.lastSync ? new Date(jobInfo.lastSync).toLocaleDateString() : (c.lastSyncAt || '-')}</td>
                      <td className="px-2 py-2 text-center relative">
                        <DropdownMenu
                          items={[
                            {
                              label: 'Edit',
                              icon: 'edit',
                              onClick: () => navigate(`/admin/connectors/${c.id}`, { state: { connector: c } }),
                            },
                            {
                              label: 'Sync from JIRA',
                              icon: 'arrow-down-tray',
                              onClick: () => navigate(`/admin/connectors/${c.id}?tab=jobs&action=sync`),
                              className: 'text-blue-600 hover:bg-blue-50',
                            },
                            {
                              label: 'View Jobs',
                              icon: 'cog-6-tooth',
                              onClick: () => navigate(`/admin/connectors/${c.id}?tab=jobs`),
                            },
                            {
                              label: 'Verify Health',
                              icon: 'heart',
                              onClick: () => handleVerify(c.id),
                              className: 'text-green-600 hover:bg-green-50',
                            },
                            {
                              label: 'Disable',
                              icon: 'no-symbol',
                              onClick: () => handleDisable(c.id),
                              className: 'text-amber-600 hover:bg-amber-50',
                            },
                            {
                              label: 'Re-authorize',
                              icon: 'arrow-path',
                              onClick: () => handleReauthorize(c.id),
                            },
                            {
                              label: 'Delete',
                              icon: 'trash',
                              onClick: () => handleDelete(c.id),
                              className: 'text-red-600 hover:bg-red-50',
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
              {!filteredContent.length && <p className="text-gray-500">No connectors match current filters.</p>}
            </div>
          ))}
        </Card>
      </div>

      {/* Health drawer (simple) */}
      {data?.content.map((c) => (
        health[c.id] ? (
          <div key={`health-${c.id}`} className="mt-4">
            <Card>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Health: {c.name}</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(health[c.id], null, 2)}</pre>
            </Card>
          </div>
        ) : null
      ))}

      {/* Create Connection Modal */}
      {/* Re-authorize Modal */}
      <Modal
        open={reauthOpen}
        onClose={() => setReauthOpen(false)}
        title="Re-authorize connection"
        size="md"
        footer={
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <button onClick={() => setReauthOpen(false)} className="px-3 py-2 rounded border" disabled={reauthLoading}>Cancel</button>
              <button onClick={submitReauthorize} disabled={reauthLoading || !reauthEmail || !reauthToken} className={`px-3 py-2 rounded ${(!reauthLoading && reauthEmail && reauthToken) ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>{reauthLoading ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <input type="email" autoComplete="off" className="w-full border rounded px-3 py-2" value={reauthEmail} onChange={(e) => setReauthEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
            <div className="relative">
              <input type={reauthReveal ? 'text' : 'password'} autoComplete="new-password" className="w-full border rounded px-3 py-2 pr-16" value={reauthToken} onChange={(e) => setReauthToken(e.target.value)} placeholder="Paste new API token" />
              <button type="button" onClick={() => setReauthReveal(v => !v)} className="absolute inset-y-0 right-2 text-xs text-gray-600">{reauthReveal ? 'Hide' : 'Show'}</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create Connection Modal */}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create connection" size="xl"
        footer={
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <button onClick={() => setIsCreateOpen(false)} className="px-3 py-2 rounded border" disabled={loading}>Cancel</button>
              <button 
                onClick={continueCreate} 
                disabled={!isFormValid || !selectedConnectorType || loading} 
                className={`px-3 py-2 rounded flex items-center ${
                  isFormValid && selectedConnectorType && !loading 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Creating...' : 'Connect'}
              </button>
            </div>
          </div>
        }>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: catalog grid */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <input value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} className="w-full border rounded px-3 py-2 mr-3" placeholder="Search connectors" />
              {/* count removed per UX feedback */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catalogItems.map((i) => (
                <button type="button" key={i.type}
                  onClick={() => { setSelectedConnectorType(i.type); setSelectedAuthMethodId(i.authMethods[0]?.id || ''); }}
                  className={`text-left border rounded-lg p-3 hover:shadow ${selectedConnectorType === i.type ? 'ring-2 ring-blue-300' : ''}`}>
                  <div className="font-medium text-gray-900">{i.displayName}</div>
                  <div className="text-xs text-gray-600 line-clamp-2">{i.description}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {i.authMethods.map(m => (
                      <span key={m.id} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{m.displayName}</span>
                    ))}
                  </div>
                  {i.docsUrl && (
                    <div className="mt-2 text-[11px]"><a href={i.docsUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">Docs</a></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: method + dynamic fields */}
          <div className="lg:col-span-1">
            {!selectedConnectorType ? (
              <div className="text-sm text-gray-600">Select a connector on the left to continue.</div>
            ) : (
              <>
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-700 mb-1">Auth Method</div>
                  <div className="flex flex-wrap gap-2">
                    {catalog?.items.find(i => i.type === selectedConnectorType)?.authMethods.map(m => (
                      <button type="button" key={m.id} onClick={() => setSelectedAuthMethodId(m.id)} className={`px-2 py-1 text-xs rounded-full border ${selectedMethod?.id === m.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}>
                        {m.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="mt-4 space-y-3">
              {(selectedMethod?.fields || []).map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}{f.required && <span className="text-red-600 ml-0.5" aria-hidden>*</span>}
                    <span className="sr-only">{f.required ? ' (required)' : ''}</span>
                  </label>
                  {f.type === 'password' ? (
                    <div className="relative">
                      <input type={revealToken ? 'text' : 'password'}
                        required={!!f.required}
                        placeholder={f.placeholder}
                        className="w-full border rounded px-3 py-2 pr-16" autoComplete="new-password"
                        value={createForm.apiToken}
                        onChange={(e) => setCreateForm(s => ({ ...s, apiToken: e.target.value }))} />
                      <button type="button" onClick={() => setRevealToken(v => !v)} className="absolute inset-y-0 right-2 text-xs text-gray-600">{revealToken ? 'Hide' : 'Show'}</button>
                    </div>
                  ) : (
                    <input type={f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : 'text'} autoComplete="off"
                    required={!!f.required}
                    placeholder={f.placeholder}
                    className="w-full border rounded px-3 py-2"
                    value={(f.name === 'connectionName') ? createForm.name : (f.name === 'jiraBaseUrl' ? createForm.baseUrl : (f.name === 'username' ? createForm.email : (f.name === 'apiToken' ? createForm.apiToken : '')))}
                    onChange={(e) => {
                      if (f.name === 'connectionName') setCreateForm(s => ({ ...s, name: e.target.value }));
                      else if (f.name === 'jiraBaseUrl') setCreateForm(s => ({ ...s, baseUrl: e.target.value }));
                      else if (f.name === 'username') setCreateForm(s => ({ ...s, email: e.target.value }));
                      else if (f.name === 'apiToken') setCreateForm(s => ({ ...s, apiToken: e.target.value }));
                    }} />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sync JQL/Filter</label>
                <input className="w-full border rounded px-3 py-2" placeholder="Sync JQL/Filter" value={createForm.defaultJql} onChange={(e) => setCreateForm(s => ({ ...s, defaultJql: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
};

export default AdminConnectors;


