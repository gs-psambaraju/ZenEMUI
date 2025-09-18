import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { CreateTeamForm } from '../components/teams/CreateTeamForm';
import { EditTeamForm } from '../components/teams/EditTeamForm';
import { ContextualRefreshButton } from '../components/refresh/ContextualRefreshButton';
import apiService from '../services/api';
import type { Team, CreateTeamRequest, UpdateTeamRequest } from '../types';
import type { PageResponse } from '../services/api';

// Using shared PageResponse from api service

export const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useToast();
  
  // Data state
  const [data, setData] = useState<PageResponse<Team> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced team data with capacity metrics - disabled until backend ready
  // const [teamsWithCapacity, setTeamsWithCapacity] = useState<Record<string, {
  //   memberCount: number;
  //   totalCapacity: number;
  //   utilizationStatus: 'AVAILABLE' | 'AT_CAPACITY' | 'OVER_ALLOCATED';
  //   upcomingRisks: number;
  // }>>({});
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'memberCount' | 'activeProjectCount'>('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  
  // Toasts handled via ToastProvider

  const fetchTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: 0,
        size: 20,
        sortBy,
        sortDirection,
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const resp = await apiService.getTeams(params);
      setData(resp);
      
      // TODO: Load capacity metrics when backend is ready
      // const capacityData: Record<string, any> = {};
      // setTeamsWithCapacity(capacityData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [searchTerm, sortBy, sortDirection]);

  const handleCreateTeam = async (teamData: CreateTeamRequest) => {
    setIsCreating(true);
    try {
      await apiService.createTeam(teamData);
      show({ title: 'Team created successfully!', type: 'success' });
      setShowCreateModal(false);
      fetchTeams(); // Refresh the list
    } catch (error) {
      console.error('Failed to create team:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to create team', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setShowEditModal(true);
  };

  const handleUpdateTeam = async (updateData: UpdateTeamRequest) => {
    if (!editingTeam) return;
    
    setIsUpdating(true);
    try {
      await apiService.updateTeam(editingTeam.id, updateData);
      show({ title: 'Team updated successfully!', type: 'success' });
      setShowEditModal(false);
      setEditingTeam(null);
      fetchTeams(); // Refresh the list
    } catch (error) {
      console.error('Failed to update team:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to update team', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`Are you sure you want to delete the team "${team.name}"? This will unassign all team members. This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteTeam(team.id);
      show({ title: 'Team deleted successfully!', type: 'success' });
      fetchTeams(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete team:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to delete team', type: 'error' });
    }
  };

  const handleViewTeamDetails = (team: Team) => {
    navigate(`/teams/${team.id}`);
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

  return (
    <SidebarLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
            <p className="mt-2 text-gray-600">Manage your teams and their members.</p>
          </div>
          <div className="flex items-center space-x-2">
            <ContextualRefreshButton
              context="teams"
              suggestedTargets={['TEAM', 'TEAMMATES']}
              label="Refresh Data"
            />
            <Button onClick={() => setShowCreateModal(true)}>
              Create Team
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <Input
            placeholder="Search teams by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      <Card>
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
                      <span>Team Name</span>
                      <span>{getSortIcon('name')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('memberCount')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Members</span>
                      <span>{getSortIcon('memberCount')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('activeProjectCount')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Active Projects</span>
                      <span>{getSortIcon('activeProjectCount')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.content.map((team: Team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewTeamDetails(team)}
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        {team.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                      {team.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {team.memberCount} members
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        {team.activeProjectCount} active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(team.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <DropdownMenu
                        items={[
                          {
                            label: 'Edit',
                            icon: 'edit',
                            onClick: () => handleEditTeam(team),
                          },
                          {
                            label: 'Delete',
                            icon: 'trash',
                            onClick: () => handleDeleteTeam(team),
                            disabled: team.activeProjectCount > 0,
                            className: team.activeProjectCount === 0 ? 'text-red-600 hover:bg-red-50' : '',
                          },
                          {
                            label: 'View Details',
                            icon: 'eye',
                            onClick: () => handleViewTeamDetails(team),
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
                <p className="text-lg mb-2">No teams found</p>
                <p className="text-sm">Create your first team to get started</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !isCreating && setShowCreateModal(false)}
        title="Create New Team"
        size="md"
      >
        <CreateTeamForm
          onSubmit={handleCreateTeam}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isCreating}
        />
      </Modal>

      {/* Edit Team Modal */}
      {editingTeam && (
        <Modal
          isOpen={showEditModal}
          onClose={() => !isUpdating && setShowEditModal(false)}
          title="Edit Team"
          size="md"
        >
          <EditTeamForm
            team={editingTeam}
            onSubmit={handleUpdateTeam}
            onCancel={() => {
              setShowEditModal(false);
              setEditingTeam(null);
            }}
            isLoading={isUpdating}
          />
        </Modal>
      )}

      {/* Toasts handled globally by ToastProvider */}
    </SidebarLayout>
  );
};

export default Teams;
