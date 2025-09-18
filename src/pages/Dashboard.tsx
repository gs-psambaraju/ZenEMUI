import React from 'react';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { useAuth } from '../hooks/useAuth';
import { useStatus } from '../hooks/useStatus';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { statusData, isLoading, error } = useStatus(!!user);

  if (!user) {
    return null; // This should be handled by the ProtectedRoute
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <Card className="text-center">
          <div className="py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
          </div>
        </Card>
      </SidebarLayout>
    );
  }

  if (!statusData) {
    return null;
  }

  return (
    <SidebarLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Home</h1>
        <p className="mt-2 text-gray-600">Key delivery KPIs and current sprint snapshot.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <KpiCard label="Active Projects" value={statusData.activeProjectsCount} accent="blue" />
        <KpiCard label="At-Risk Projects" value={statusData.atRiskProjectsCount} accent="amber" />
        <KpiCard label="Upcoming Releases (30d)" value={statusData.upcomingReleasesCount} accent="green" />
        <KpiCard label="Current Sprint" value={statusData.currentSprint ? statusData.currentSprint.name : 'None'} accent="gray" />
      </div>

      {/* Current Sprint Snapshot and Profile */}
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="2xl:col-span-2">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Sprint</h2>
            {statusData.currentSprint ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-900">{statusData.currentSprint.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Team</p>
                  <p className="text-gray-900">{statusData.currentSprint.teamId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date Range</p>
                  <p className="text-gray-900">{statusData.currentSprint.startDate} → {statusData.currentSprint.endDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Story Points</p>
                  <p className="text-gray-900">{statusData.currentSprint.completedStoryPoints} / {statusData.currentSprint.plannedStoryPoints}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No current sprint. Set one from Sprints.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <p className="text-gray-900">{user.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tenant ID</p>
                <p className="text-gray-900 font-mono text-sm">{user.tenantId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Administrator</p>
                <p className="text-gray-900">{user.fullName}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
};