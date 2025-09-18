import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { SingleSelect } from '../ui/SingleSelect';
import { useToast } from '../ui/Toast';
import apiService, { type PageResponse } from '../../services/api';

interface LogEntry {
  id?: string;
  ts: string;
  level: string;
  code?: string;
  message: string;
  context?: any;
  jobType?: string;
  jobId?: string;
  duration?: number;
}

interface ActivitySummaryMetrics {
  totalSyncsToday: number;
  failedSyncs: number;
  configurationIssues: number;
  averageExecutionTime: number;
  lastSyncAt?: string;
  trend: number; // percentage change
}

interface ActivityMonitoringInterfaceProps {
  connectorId: string;
  connectorName?: string;
}

const LOG_LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'ERROR', label: 'Errors' },
  { value: 'WARN', label: 'Warnings' },
  { value: 'INFO', label: 'Info' },
  { value: 'DEBUG', label: 'Debug' },
];

const JOB_TYPES = [
  { value: 'all', label: 'All Job Types' },
  { value: 'PROJECT_HEALTH', label: 'Project Health' },
  { value: 'SPRINT_ANALYTICS', label: 'Sprint Analytics' },
  { value: 'RELEASE_READINESS', label: 'Release Readiness' },
  { value: 'TEAM_CAPACITY', label: 'Team Capacity' },
  { value: 'QUALITY_MANAGEMENT', label: 'Quality Management' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'RUNNING', label: 'Running' },
];

export const ActivityMonitoringInterface: React.FC<ActivityMonitoringInterfaceProps> = ({
  connectorId,
  connectorName,
}) => {
  const { show } = useToast();

  // State
  const [logs, setLogs] = useState<PageResponse<LogEntry> | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryMetrics, setSummaryMetrics] = useState<ActivitySummaryMetrics | null>(null);
  
  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  // Filtered logs for search
  const filteredLogs = useMemo(() => {
    if (!logs?.content || !searchTerm) return logs?.content || [];
    
    return logs.content.filter(log =>
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.jobType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  // Load logs
  const loadLogs = async (page = 0) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        size: pageSize,
        dateFrom,
        dateTo,
      };

      if (levelFilter !== 'all') {
        params.level = levelFilter;
      }
      if (jobTypeFilter !== 'all') {
        params.jobType = jobTypeFilter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const logsData = await apiService.getLogs(connectorId, params);
      setLogs(logsData);
      setCurrentPage(page);
    } catch (error) {
      show({
        title: 'Failed to load logs',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load summary metrics
  const loadSummaryMetrics = async () => {
    try {
      // In a real implementation, this would be a dedicated API endpoint
      // For now, we'll simulate with mock data
      const today = new Date().toISOString().split('T')[0];
      const mockMetrics: ActivitySummaryMetrics = {
        totalSyncsToday: Math.floor(Math.random() * 30) + 10,
        failedSyncs: Math.floor(Math.random() * 5),
        configurationIssues: Math.floor(Math.random() * 3),
        averageExecutionTime: Math.random() * 5 + 1,
        lastSyncAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        trend: (Math.random() - 0.5) * 50, // -25% to +25%
      };
      setSummaryMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load summary metrics:', error);
    }
  };

  // Export logs
  const exportLogs = () => {
    if (!logs?.content) return;

    const csvContent = [
      ['Timestamp', 'Level', 'Job Type', 'Message', 'Code', 'Duration'].join(','),
      ...logs.content.map(log => [
        log.ts,
        log.level,
        log.jobType || '',
        `"${log.message.replace(/"/g, '""')}"`,
        log.code || '',
        log.duration || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `connector-logs-${connectorId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    show({
      title: 'Logs exported',
      description: 'Logs have been downloaded as CSV file',
      type: 'success',
    });
  };

  // Format duration
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  // Load data on mount and when filters change
  useEffect(() => {
    if (connectorId) {
      loadLogs(0);
      loadSummaryMetrics();
    }
  }, [connectorId, levelFilter, jobTypeFilter, statusFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      {/* Activity Summary Cards */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Syncs Today</p>
                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalSyncsToday}</p>
              </div>
              <div className="flex items-center space-x-1">
                <Icon 
                  name={summaryMetrics.trend >= 0 ? "arrow-trending-up" : "arrow-trending-down"} 
                  className={`h-4 w-4 ${summaryMetrics.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
                <span className={`text-sm ${summaryMetrics.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(summaryMetrics.trend).toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:bg-red-50 border-red-200"
            onClick={() => {
              setStatusFilter('FAILED');
              loadLogs(0);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Syncs</p>
                <p className="text-2xl font-bold text-red-600">{summaryMetrics.failedSyncs}</p>
              </div>
              <Icon name="x-circle" className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:bg-yellow-50 border-yellow-200"
            onClick={() => {
              setLevelFilter('WARN');
              loadLogs(0);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Configuration Issues</p>
                <p className="text-2xl font-bold text-yellow-600">{summaryMetrics.configurationIssues}</p>
              </div>
              <Icon name="exclamation-triangle" className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Execution Time</p>
                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.averageExecutionTime.toFixed(1)}s</p>
              </div>
              <Icon name="clock" className="h-8 w-8 text-blue-600" />
            </div>
            {summaryMetrics.lastSyncAt && (
              <p className="text-xs text-gray-500 mt-1">
                Last sync: {formatDate(summaryMetrics.lastSyncAt)}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Logs Dashboard */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
            {connectorName && (
              <p className="text-sm text-gray-600">Connection: {connectorName}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={() => loadLogs(currentPage)}>
              <Icon name="arrow-path" className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="secondary" onClick={exportLogs} disabled={!logs?.content?.length}>
              <Icon name="arrow-down-tray" className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
            <SingleSelect
              options={LOG_LEVELS}
              value={levelFilter}
              onChange={(value) => setLevelFilter(value || 'all')}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Job Type</label>
            <SingleSelect
              options={JOB_TYPES}
              value={jobTypeFilter}
              onChange={(value) => setJobTypeFilter(value || 'all')}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <SingleSelect
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || 'all')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Icon name="arrow-path" className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <span className="text-gray-500">Loading logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Icon name="document-text" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <span className="text-gray-500">No logs found for the selected filters</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.ts)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          log.level === 'ERROR'
                            ? 'bg-red-100 text-red-700'
                            : log.level === 'WARN'
                            ? 'bg-yellow-100 text-yellow-700'
                            : log.level === 'INFO'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.jobType || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={log.message}>
                        {log.code && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded mr-2">
                            {log.code}
                          </span>
                        )}
                        {log.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(log.duration)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs && logs.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t">
            <div className="text-sm text-gray-700">
              Showing page {logs.page + 1} of {logs.totalPages} ({logs.totalElements} total entries)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                onClick={() => loadLogs(logs.page - 1)}
                disabled={logs.page === 0}
              >
                <Icon name="chevron-left" className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => loadLogs(logs.page + 1)}
                disabled={logs.page >= logs.totalPages - 1}
              >
                Next
                <Icon name="chevron-right" className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
