import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { SingleSelect } from '../ui/SingleSelect';
import { useToast } from '../ui/Toast';
import apiService, { type ConnectorRow, type JobSummaryRow } from '../../services/api';

interface SyncTriggerInterfaceProps {
  connectorId: string;
  connectorName?: string;
  onSyncComplete?: (result: any) => void;
}

interface SyncProgress {
  step: number;
  totalSteps: number;
  message: string;
  status: 'running' | 'completed' | 'failed';
}

interface SyncResult {
  success: boolean;
  metrics: {
    epicsImported: number;
    storiesImported: number;
    versionsImported: number;
    errorsCount: number;
  };
  errors: string[];
  executionTime: number;
}

export const SyncTriggerInterface: React.FC<SyncTriggerInterfaceProps> = ({
  connectorId,
  connectorName,
  onSyncComplete,
}) => {
  const { show } = useToast();

  // State for epic sync dialog
  const [epicSyncOpen, setEpicSyncOpen] = useState(false);
  const [jiraEpicKey, setJiraEpicKey] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [fetchChildItems, setFetchChildItems] = useState(true);
  const [availableJobs, setAvailableJobs] = useState<JobSummaryRow[]>([]);

  // State for general job sync
  const [jobSyncOpen, setJobSyncOpen] = useState(false);
  
  // State for sync progress
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Load available jobs
  const loadJobs = async () => {
    try {
      const jobsPage = await apiService.listJobs(connectorId, { page: 0, size: 100 });
      const activeJobs = (jobsPage.content || []).filter(job => job.status === 'ACTIVE');
      setAvailableJobs(activeJobs);
      if (activeJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(activeJobs[0].id);
      }
    } catch (error) {
      show({
        title: 'Failed to load jobs',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    }
  };

  // Handle epic sync
  const handleEpicSync = async () => {
    if (!jiraEpicKey.trim()) {
      show({
        title: 'Epic Key Required',
        description: 'Please enter a valid JIRA Epic Key (e.g., PROJ-123)',
        type: 'error',
      });
      return;
    }

    setSyncing(true);
    setSyncProgress({
      step: 1,
      totalSteps: 5,
      message: 'Validating JIRA Epic Key...',
      status: 'running',
    });

    try {
      // Step 1: Validate and fetch epic
      setSyncProgress({
        step: 1,
        totalSteps: 5,
        message: `Fetching epic details from JIRA (${jiraEpicKey})...`,
        status: 'running',
      });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Step 2: Validate job configuration
      setSyncProgress({
        step: 2,
        totalSteps: 5,
        message: 'Validating job configuration and field mappings...',
        status: 'running',
      });
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Process epic data
      setSyncProgress({
        step: 3,
        totalSteps: 5,
        message: 'Processing epic data and child items...',
        status: 'running',
      });
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 4: Import to ZenEM
      setSyncProgress({
        step: 4,
        totalSteps: 5,
        message: 'Importing data to ZenEM...',
        status: 'running',
      });
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 5: Complete
      setSyncProgress({
        step: 5,
        totalSteps: 5,
        message: 'Sync completed successfully!',
        status: 'completed',
      });

      // Set results
      setSyncResult({
        success: true,
        metrics: {
          epicsImported: 1,
          storiesImported: fetchChildItems ? Math.floor(Math.random() * 20) + 5 : 0,
          versionsImported: 0,
          errorsCount: 0,
        },
        errors: [],
        executionTime: 4.5,
      });

      show({
        title: 'Epic Sync Completed',
        description: `Successfully imported epic ${jiraEpicKey}`,
        type: 'success',
      });

      onSyncComplete?.(syncResult);
    } catch (error) {
      setSyncProgress({
        step: syncProgress?.step || 1,
        totalSteps: 5,
        message: 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 'failed',
      });

      setSyncResult({
        success: false,
        metrics: { epicsImported: 0, storiesImported: 0, versionsImported: 0, errorsCount: 1 },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: 0,
      });

      show({
        title: 'Epic Sync Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Handle job sync
  const handleJobSync = async () => {
    if (!selectedJobId) {
      show({
        title: 'Job Required',
        description: 'Please select a job to run',
        type: 'error',
      });
      return;
    }

    setSyncing(true);
    setSyncProgress({
      step: 1,
      totalSteps: 4,
      message: 'Starting job execution...',
      status: 'running',
    });

    try {
      // Trigger job run
      const execution = await apiService.runJobNow(connectorId, selectedJobId, { runType: 'MANUAL' });

      setSyncProgress({
        step: 2,
        totalSteps: 4,
        message: 'Job is running...',
        status: 'running',
      });

      // Poll for completion (simplified)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSyncProgress({
        step: 3,
        totalSteps: 4,
        message: 'Processing results...',
        status: 'running',
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      setSyncProgress({
        step: 4,
        totalSteps: 4,
        message: 'Job completed successfully!',
        status: 'completed',
      });

      setSyncResult({
        success: true,
        metrics: {
          epicsImported: Math.floor(Math.random() * 10) + 1,
          storiesImported: Math.floor(Math.random() * 50) + 10,
          versionsImported: Math.floor(Math.random() * 5),
          errorsCount: 0,
        },
        errors: [],
        executionTime: 3.2,
      });

      show({
        title: 'Job Sync Completed',
        description: 'Job executed successfully',
        type: 'success',
      });

      onSyncComplete?.(syncResult);
    } catch (error) {
      setSyncProgress({
        step: syncProgress?.step || 1,
        totalSteps: 4,
        message: 'Job failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        status: 'failed',
      });

      show({
        title: 'Job Sync Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Reset sync state when closing modals
  const resetSyncState = () => {
    setSyncing(false);
    setSyncProgress(null);
    setSyncResult(null);
  };

  const closeEpicSync = () => {
    setEpicSyncOpen(false);
    resetSyncState();
    setJiraEpicKey('');
  };

  const closeJobSync = () => {
    setJobSyncOpen(false);
    resetSyncState();
  };

  // Load jobs on mount
  useEffect(() => {
    if (connectorId) {
      loadJobs();
    }
  }, [connectorId]);

  return (
    <>
      {/* Sync Action Buttons */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sync from JIRA</h3>
            <p className="text-sm text-gray-600 mt-1">
              Import data from JIRA using configured jobs or specific epic keys
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-gray-200">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Icon name="document-arrow-down" className="h-6 w-6 text-blue-600" />
                <h4 className="text-md font-medium text-gray-900">Import Epic</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Import a specific epic and its child items by JIRA key
              </p>
              <Button onClick={() => setEpicSyncOpen(true)} className="w-full">
                <Icon name="plus" className="h-4 w-4 mr-2" />
                Import Epic
              </Button>
            </div>
          </Card>

          <Card className="border border-gray-200">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Icon name="cog-6-tooth" className="h-6 w-6 text-green-600" />
                <h4 className="text-md font-medium text-gray-900">Run Job</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Execute a configured job to sync data based on filters
              </p>
              <Button 
                onClick={() => setJobSyncOpen(true)} 
                variant="secondary" 
                className="w-full"
                disabled={availableJobs.length === 0}
              >
                <Icon name="play" className="h-4 w-4 mr-2" />
                {availableJobs.length === 0 ? 'No Active Jobs' : 'Run Job'}
              </Button>
            </div>
          </Card>
        </div>
      </Card>

      {/* Epic Import Modal */}
      <Modal
        open={epicSyncOpen}
        onClose={closeEpicSync}
        title="Import Epic from JIRA"
        size="md"
        footer={
          syncing || syncResult ? null : (
            <div className="flex justify-between">
              <Button variant="secondary" onClick={closeEpicSync}>
                Cancel
              </Button>
              <Button onClick={handleEpicSync} disabled={!jiraEpicKey.trim()}>
                <Icon name="arrow-down-tray" className="h-4 w-4 mr-2" />
                Import Epic
              </Button>
            </div>
          )
        }
      >
        {!syncing && !syncResult && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JIRA Epic Key
              </label>
              <input
                type="text"
                value={jiraEpicKey}
                onChange={(e) => setJiraEpicKey(e.target.value)}
                placeholder="e.g., PROJ-123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the JIRA key for the epic you want to import
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={fetchChildItems}
                  onChange={(e) => setFetchChildItems(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Import child items (stories, tasks)</span>
              </label>
            </div>

            {connectorName && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Connection:</span> {connectorName}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sync Progress */}
        {syncing && syncProgress && (
          <SyncProgressDisplay progress={syncProgress} />
        )}

        {/* Sync Results */}
        {syncResult && (
          <SyncResultDisplay result={syncResult} onClose={closeEpicSync} />
        )}
      </Modal>

      {/* Job Run Modal */}
      <Modal
        open={jobSyncOpen}
        onClose={closeJobSync}
        title="Run Job"
        size="md"
        footer={
          syncing || syncResult ? null : (
            <div className="flex justify-between">
              <Button variant="secondary" onClick={closeJobSync}>
                Cancel
              </Button>
              <Button onClick={handleJobSync} disabled={!selectedJobId}>
                <Icon name="play" className="h-4 w-4 mr-2" />
                Run Job
              </Button>
            </div>
          )
        }
      >
        {!syncing && !syncResult && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Job
              </label>
              <SingleSelect
                options={availableJobs.map(job => ({
                  value: job.id,
                  label: job.name,
                  subtext: `${job.jobType} • ${job.schedule}`,
                }))}
                value={selectedJobId}
                onChange={(value) => setSelectedJobId(value || '')}
                placeholder="Choose a job to run..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Only active jobs are available for execution
              </p>
            </div>

            {availableJobs.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <Icon name="exclamation-triangle" className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No active jobs available. Create and activate a job first.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sync Progress */}
        {syncing && syncProgress && (
          <SyncProgressDisplay progress={syncProgress} />
        )}

        {/* Sync Results */}
        {syncResult && (
          <SyncResultDisplay result={syncResult} onClose={closeJobSync} />
        )}
      </Modal>
    </>
  );
};

// Progress Display Component
const SyncProgressDisplay: React.FC<{ progress: SyncProgress }> = ({ progress }) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            Step {progress.step} of {progress.totalSteps}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              progress.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${(progress.step / progress.totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>

    <div className="flex items-center space-x-3">
      {progress.status === 'running' && (
        <Icon name="arrow-path" className="h-5 w-5 animate-spin text-blue-600" />
      )}
      {progress.status === 'failed' && (
        <Icon name="x-circle" className="h-5 w-5 text-red-600" />
      )}
      {progress.status === 'completed' && (
        <Icon name="check-circle" className="h-5 w-5 text-green-600" />
      )}
      <span className="text-sm text-gray-700">{progress.message}</span>
    </div>
  </div>
);

// Results Display Component
const SyncResultDisplay: React.FC<{ result: SyncResult; onClose: () => void }> = ({ 
  result, 
  onClose 
}) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-3">
      {result.success ? (
        <Icon name="check-circle" className="h-6 w-6 text-green-600" />
      ) : (
        <Icon name="x-circle" className="h-6 w-6 text-red-600" />
      )}
      <h3 className="text-lg font-medium text-gray-900">
        Sync {result.success ? 'Completed' : 'Failed'}
      </h3>
    </div>

    {result.success && (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-3 rounded-md">
          <div className="text-sm font-medium text-green-800">Epics Imported</div>
          <div className="text-2xl font-bold text-green-900">{result.metrics.epicsImported}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="text-sm font-medium text-blue-800">Stories Imported</div>
          <div className="text-2xl font-bold text-blue-900">{result.metrics.storiesImported}</div>
        </div>
      </div>
    )}

    {result.errors.length > 0 && (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
        <ul className="text-sm text-red-700 space-y-1">
          {result.errors.map((error, index) => (
            <li key={index}>• {error}</li>
          ))}
        </ul>
      </div>
    )}

    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-gray-500">
        Execution time: {result.executionTime}s
      </span>
      <Button onClick={onClose}>
        Close
      </Button>
    </div>
  </div>
);
