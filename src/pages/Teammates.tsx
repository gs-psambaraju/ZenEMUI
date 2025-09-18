import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SingleSelect } from '../components/ui/SingleSelect';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { CreateTeammateForm } from '../components/teammates/CreateTeammateForm';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { EditTeammateForm } from '../components/teammates/EditTeammateForm';
import { ContextualRefreshButton } from '../components/refresh/ContextualRefreshButton';
import apiService from '../services/api';
import type { Teammate, Team, CreateTeammateRequest, UpdateTeammateRequest, RoleOption } from '../types';
import type { PageResponse } from '../services/api';
// import { getRoleLabel } from '../utils/roles';

// Using shared PageResponse from api service

// Role options now loaded dynamically from API

const CAPACITY_STATUS_OPTIONS = [
  { value: '', label: 'All Capacity Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'at_capacity', label: 'At Capacity' },
  { value: 'over_allocated', label: 'Over-allocated' },
];

const LEAVE_FILTER_OPTIONS = [
  { value: '', label: 'All Teammates' },
  { value: 'true', label: 'Has Upcoming Leaves' },
  { value: 'false', label: 'No Upcoming Leaves' },
];

// Column-click sorting only; dropdown removed

export const Teammates: React.FC = () => {
  const { show } = useToast();
  // Data state
  const [data, setData] = useState<PageResponse<Teammate> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeammate, setEditingTeammate] = useState<Teammate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Filters and search  
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [primaryRoleFilter, setPrimaryRoleFilter] = useState<string>('');
  const [secondaryRoleFilter, setSecondaryRoleFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  // Metadata for roles
  const [primaryRoles, setPrimaryRoles] = useState<RoleOption[]>([]);
  const [secondaryRoles, setSecondaryRoles] = useState<RoleOption[]>([]);

  const [capacityStatusFilter, setCapacityStatusFilter] = useState<string>('');
  const [upcomingLeavesFilter, setUpcomingLeavesFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'teamName' | 'capacity' | 'availableHours' | 'utilization'>('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [showFilters, setShowFilters] = useState(false);
  
  // Toasts handled via ToastProvider

  // Load teams and role metadata for filter dropdowns
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await apiService.getTeams({ page: 0, size: 100 });
        setTeams(response.content);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    };
    const loadRoles = async () => {
      try {
        const [p, s] = await Promise.all([
          apiService.getPrimaryRoles(),
          apiService.getSecondaryRoles(),
        ]);
        setPrimaryRoles(p);
        setSecondaryRoles(s);
      } catch (error) {
        console.error('Failed to load roles:', error);
      }
    };
    loadTeams();
    loadRoles();
  }, []);

  const fetchTeammates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: 0,
        size: 50,
        sortBy,
        sortDirection,
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      if (primaryRoleFilter) params.primaryRoleCode = primaryRoleFilter;
      if (secondaryRoleFilter) params.secondaryRoleCode = secondaryRoleFilter;
      
      if (teamFilter) {
        params.teamId = teamFilter;
      }
      
      if (capacityStatusFilter) {
        params.capacityStatus = capacityStatusFilter;
      }
      
      if (upcomingLeavesFilter) {
        params.hasUpcomingLeaves = upcomingLeavesFilter === 'true';
      }
      
      const resp = await apiService.getTeammates(params);
      setData(resp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load teammates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeammates();
  }, [searchTerm, primaryRoleFilter, secondaryRoleFilter, teamFilter, capacityStatusFilter, upcomingLeavesFilter, sortBy, sortDirection]);

  const handleCreateTeammate = async (teammateData: CreateTeammateRequest) => {
    setIsCreating(true);
    try {
      await apiService.createTeammate(teammateData);
      show({ title: 'Teammate created successfully!', type: 'success' });
      setShowCreateModal(false);
      fetchTeammates(); // Refresh the list
    } catch (error) {
      console.error('Failed to create teammate:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to create teammate', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTeammate = (teammate: Teammate) => {
    setEditingTeammate(teammate);
    setShowEditModal(true);
  };

  const handleUpdateTeammate = async (updateData: UpdateTeammateRequest) => {
    if (!editingTeammate) return;
    
    setIsUpdating(true);
    try {
      await apiService.updateTeammate(editingTeammate.id, updateData);
      show({ title: 'Teammate updated successfully!', type: 'success' });
      setShowEditModal(false);
      setEditingTeammate(null);
      fetchTeammates(); // Refresh the list
    } catch (error) {
      console.error('Failed to update teammate:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to update teammate', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeammate = async (teammate: Teammate) => {
    if (!confirm(`Are you sure you want to delete "${teammate.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteTeammate(teammate.id);
      show({ title: 'Teammate deleted successfully!', type: 'success' });
      fetchTeammates(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete teammate:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to delete teammate', type: 'error' });
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDirection('ASC');
    }
  };

  const getSortIcon = (field: string) => {
    if (field !== sortBy) return '↕️';
    return sortDirection === 'ASC' ? '↑' : '↓';
  };

  const getRoleLabelByCode = (code?: string | null) => {
    if (!code) return '';
    // First try to find by code
    const foundByCode = primaryRoles.find(r => r.code === code) || secondaryRoles.find(r => r.code === code);
    if (foundByCode) return foundByCode.displayName;
    
    // If not found by code, try to find by display name (backend might return display names)
    const foundByDisplayName = primaryRoles.find(r => r.displayName === code) || secondaryRoles.find(r => r.displayName === code);
    if (foundByDisplayName) return foundByDisplayName.displayName;
    
    // Fallback to the original value
    return code;
  };

  const teamFilterOptions = [
    { value: '', label: 'All Teams' },
    { value: 'unassigned', label: 'Unassigned' },
    // Sort teams alphabetically by name
    ...teams
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map(team => ({ value: team.id, label: team.name }))
  ];

  return (
    <SidebarLayout>
      <div className="w-full">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Teammates</h1>
            <p className="mt-2 text-gray-600">Manage your team members and their assignments.</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <ContextualRefreshButton
              context="teammates"
              suggestedTargets={['TEAMMATES', 'STORIES']}
              label="Refresh Data"
            />
            <Button variant="outline" onClick={() => setShowFilters(true)}>Filters</Button>
            <Button onClick={() => setShowCreateModal(true)}>Add Teammate</Button>
          </div>
        </div>
        {/* Compact toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-md"
          />
        </div>
        
        {/* Filter summary and clear button */}
        {(searchTerm || primaryRoleFilter || secondaryRoleFilter || teamFilter || capacityStatusFilter || upcomingLeavesFilter) && (
          <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Active filters:</span>
              {searchTerm && <span className="ml-2 px-2 py-1 bg-blue-100 rounded">Search: "{searchTerm}"</span>}
              {primaryRoleFilter && <span className="ml-2 px-2 py-1 bg-blue-100 rounded">Primary: {getRoleLabelByCode(primaryRoleFilter)}</span>}
              {secondaryRoleFilter && <span className="ml-2 px-2 py-1 bg-blue-100 rounded">Secondary: {getRoleLabelByCode(secondaryRoleFilter)}</span>}
              {teamFilter && <span className="ml-2 px-2 py-1 bg-blue-100 rounded">Team: {teamFilterOptions.find(o => o.value === teamFilter)?.label}</span>}
              {capacityStatusFilter && <span className="ml-2 px-2 py-1 bg-blue-100 rounded">Capacity: {CAPACITY_STATUS_OPTIONS.find(o => o.value === capacityStatusFilter)?.label}</span>}
              {upcomingLeavesFilter && <span className="ml-2 px-2 py-1 bg-blue-100 rounded">Leaves: {LEAVE_FILTER_OPTIONS.find(o => o.value === upcomingLeavesFilter)?.label}</span>}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setPrimaryRoleFilter('');
                setSecondaryRoleFilter('');
                setTeamFilter('');
                setCapacityStatusFilter('');
                setUpcomingLeavesFilter('');
              }}
              className="text-blue-600"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Filters Drawer */}
      <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filters" size="large">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SingleSelect
            placeholder="Filter by primary role"
            value={primaryRoleFilter}
            onChange={(value) => setPrimaryRoleFilter(value || '')}
            options={[{ value: '', label: 'All Primary Roles' }, ...primaryRoles.map(r => ({ value: r.code, label: r.displayName }))]}
          />
          <SingleSelect
            placeholder="Filter by secondary role"
            value={secondaryRoleFilter}
            onChange={(value) => setSecondaryRoleFilter(value || '')}
            options={[{ value: '', label: 'All Secondary Roles' }, ...secondaryRoles.map(r => ({ value: r.code, label: r.displayName }))]}
          />
          <SingleSelect
            placeholder="Filter by team"
            value={teamFilter}
            onChange={(value) => setTeamFilter(value || '')}
            options={teamFilterOptions}
          />
          <SingleSelect
            placeholder="Filter by capacity status"
            value={capacityStatusFilter}
            onChange={(value) => setCapacityStatusFilter(value || '')}
            options={CAPACITY_STATUS_OPTIONS}
          />
          <SingleSelect
            placeholder="Filter by leaves"
            value={upcomingLeavesFilter}
            onChange={(value) => setUpcomingLeavesFilter(value || '')}
            options={LEAVE_FILTER_OPTIONS}
          />
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setPrimaryRoleFilter('');
              setSecondaryRoleFilter('');
              setTeamFilter('');
              setCapacityStatusFilter('');
              setUpcomingLeavesFilter('');
            }}
          >
            Clear All
          </Button>
          <Button onClick={() => setShowFilters(false)}>Apply</Button>
        </div>
      </Modal>

      <Card className="w-full">
        {isLoading && <p className="p-4 text-gray-600">Loading...</p>}
        {error && <p className="p-4 text-red-600">{error}</p>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Name</span>
                      <span>{getSortIcon('name')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Email</span>
                      <span>{getSortIcon('email')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role(s)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('teamName')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Team</span>
                      <span>{getSortIcon('teamName')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('capacity')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Capacity</span>
                      <span>{getSortIcon('capacity')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Allocation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.content.map((teammate: Teammate) => (
                  <tr key={teammate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/teammates/${teammate.id}`)}
                        className="text-left font-medium text-blue-600 hover:text-blue-800"
                      >
                        {teammate.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {teammate.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {(() => {
                        const primary = getRoleLabelByCode((teammate as any).primaryRoleCode) || getRoleLabelByCode((teammate as any).role);
                        
                        // Handle new multiple secondary roles array
                        const secondaryRoles = (teammate as any).secondaryRoles || (teammate as any).secondaryRoleDisplayNames;
                        if (secondaryRoles && Array.isArray(secondaryRoles) && secondaryRoles.length > 0) {
                          const secondaryLabels = secondaryRoles.map((role: string) => getRoleLabelByCode(role)).filter(Boolean);
                          return secondaryLabels.length > 0 ? `${primary} + ${secondaryLabels.join(' + ')}` : primary || '-';
                        }
                        
                        // Legacy single secondary role support
                        const legacySecondary = getRoleLabelByCode((teammate as any).secondaryRoleCode);
                        return legacySecondary ? `${primary} + ${legacySecondary}` : primary || '-';
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {teammate.teamName ? (
                        <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {teammate.teamName}
                        </span>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {teammate.capacity}h
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col items-start">
                        <span className={`text-xs font-medium ${
                          teammate.currentAllocation > 100 ? 'text-red-600' :
                          teammate.currentAllocation > 80 ? 'text-yellow-600' :
                          'text-gray-700'
                        }`}>
                          {teammate.currentAllocation}%
                        </span>
                        <div className="w-12 bg-gray-200 rounded-full h-1.5 mt-0.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              teammate.currentAllocation > 100 ? 'bg-red-500' :
                              teammate.currentAllocation > 80 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(teammate.currentAllocation, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {teammate.assignedProjectCount > 0 ? (
                        <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {teammate.assignedProjectCount} active
                        </span>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <DropdownMenu
                        items={[
                          {
                            label: 'Edit',
                            icon: 'edit',
                            onClick: () => handleEditTeammate(teammate),
                          },
                          {
                            label: 'Delete',
                            icon: 'trash',
                            onClick: () => handleDeleteTeammate(teammate),
                            disabled: teammate.assignedProjectCount > 0,
                            className: teammate.assignedProjectCount === 0 ? 'text-red-600 hover:bg-red-50' : '',
                          },
                          {
                            label: 'View Details',
                            icon: 'eye',
                            onClick: () => navigate(`/teammates/${teammate.id}`),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.content?.length && (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">No teammates found</p>
                <p className="text-sm">Add your first teammate to get started</p>
              </div>
            )}
          </div>
        )}
        
        {/* Pagination info */}
        {data && data.content.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
            Showing {data.content.length} of {data.totalElements} teammates
          </div>
        )}
      </Card>

      {/* Create Teammate Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !isCreating && setShowCreateModal(false)}
        title="Add New Teammate"
        size="large"
      >
        <CreateTeammateForm
          onSubmit={handleCreateTeammate}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isCreating}
        />
      </Modal>

      {/* Edit Teammate Modal */}
      {editingTeammate && (
        <Modal
          isOpen={showEditModal}
          onClose={() => !isUpdating && setShowEditModal(false)}
          title="Edit Teammate"
          size="large"
        >
          <EditTeammateForm
            teammate={editingTeammate}
            onSubmit={handleUpdateTeammate}
            onCancel={() => {
              setShowEditModal(false);
              setEditingTeammate(null);
            }}
            isLoading={isUpdating}
          />
        </Modal>
      )}

      {/* Toasts handled globally by ToastProvider */}
    </SidebarLayout>
  );
};

export default Teammates;
