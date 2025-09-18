import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EditTeamForm } from '../components/teams/EditTeamForm';
import { AssignCalendars } from '../components/teams/AssignCalendars';
import { TeamCapacityMetrics } from '../components/teams/TeamCapacityMetrics';
import apiService from '../services/api';
import type { Team, UpdateTeamRequest, TeamCapacityMetrics as TeamCapacityMetricsType, TeammateRole } from '../types';
// PageResponse not used here
import { getRoleLabel } from '../utils/roles';

// Temporary interface until backend implements exact API contract
interface TeamMemberAllocation {
  id: string;
  teamMemberId: string;
  teamMemberName: string;
  teamMemberEmail: string;
  role: TeammateRole;
  teamId: string;
  teamName: string;
  allocationPercentage: number;
  roleInTeam?: string;
  startDate: string;
  endDate?: string | null;
  notes?: string;
  remainingCapacity: number;
  otherTeamAllocations: Array<{
    teamName: string;
    allocationPercentage: number;
    roleInTeam?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface LocalAvailableTeammate {
  id: string;
  name: string;
  email: string;
  role: TeammateRole;
  capacity: number;
  totalAllocation: number;
  remainingCapacity: number;
  primaryTeamId?: string;
  primaryTeamName?: string;
  isFullyAllocated: boolean;
  currentAllocations: Array<{
    teamId: string;
    teamName: string;
    allocationPercentage: number;
    roleInTeam?: string;
  }>;
}

interface TeammateAssignmentFormData {
  teammateId: string;
  allocationPercentage: number;
  roleInTeam?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [teamAllocations, setTeamAllocations] = useState<TeamMemberAllocation[]>([]);
  const [capacityMetrics, setCapacityMetrics] = useState<TeamCapacityMetricsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'capacity'>('members');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAssignCalendars, setShowAssignCalendars] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Assignment state
  const [availableTeammates, setAvailableTeammates] = useState<LocalAvailableTeammate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [selectedTeammates, setSelectedTeammates] = useState<Set<string>>(new Set());
  const [assignmentForms, setAssignmentForms] = useState<Record<string, TeammateAssignmentFormData>>({});
  
  // Toasts handled via ToastProvider

  const fetchTeamDetails = async () => {
    if (!id) {
      setError('Team ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch team details and allocations in parallel
      const [teamData, allocationsData] = await Promise.all([
        apiService.getTeamDetails(id),
        // Temporary: Use existing API until backend implements new contract
        apiService.getTeamAllocations ? apiService.getTeamAllocations(id, { includeCapacityMetrics: true }) : [],
      ]);
      
      setTeam(teamData);
      
      // Map existing allocation data to expected format with safety checks
      if (Array.isArray(allocationsData)) {
        // Normalize allocations data shape
        const mappedAllocations = allocationsData.map((allocation, index) => {
          try {
            return mapToTeamMemberAllocation(allocation);
          } catch (mappingError) {
            console.error(`Error mapping allocation at index ${index}:`, allocation, mappingError);
            // Return a safe fallback allocation
            return {
              id: `error-alloc-${index}`,
              teamMemberId: allocation?.teammateId || `unknown-${index}`,
              teamMemberName: 'Error Loading Teammate',
              teamMemberEmail: `error-${index}@company.com`,
              role: 'DEVELOPER' as TeammateRole,
              teamId: id!,
              teamName: team?.name || 'Current Team',
              allocationPercentage: 0,
              roleInTeam: 'DEVELOPER',
              startDate: new Date().toISOString().split('T')[0],
              endDate: null,
              notes: 'Error loading allocation data',
              remainingCapacity: 100,
              otherTeamAllocations: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
        });
        setTeamAllocations(mappedAllocations);
      } else {
        // No allocations data or not an array; default to empty list
        setTeamAllocations([]);
      }
      
      // Load capacity metrics if available
      try {
        if (apiService.getTeamCapacityMetrics) {
          const metrics = await apiService.getTeamCapacityMetrics(id, { 
            includeTrends: true, 
            includeRiskFactors: true 
          });
          setCapacityMetrics(metrics);
        }
      } catch (metricsError) {
        console.warn('Could not load capacity metrics:', metricsError);
      }
    } catch (e) {
      console.error('Failed to fetch team details:', e);
      setError(e instanceof Error ? e.message : 'Failed to load team details');
    } finally {
      setIsLoading(false);
    }
  };

  // Map existing allocation format to new format (temporary)
  const mapToTeamMemberAllocation = (allocation: any): TeamMemberAllocation => {
    return {
      id: allocation.id || `alloc-${allocation.teammateId}`,
      teamMemberId: allocation.teammateId || allocation.id,
      teamMemberName: allocation.teammateName || allocation.name || '',
      teamMemberEmail: allocation.teammateEmail || allocation.email || '',
      role: allocation.teammateRole || allocation.role || 'DEVELOPER',
      teamId: id!,
      teamName: team?.name || 'Current Team',
      allocationPercentage: allocation.allocationPercentage || allocation.allocation || 0,
      roleInTeam: allocation.teammateRole || allocation.role || 'DEVELOPER',
      startDate: allocation.createdAt || allocation.startDate || new Date().toISOString().split('T')[0],
      endDate: allocation.endDate || null,
      notes: allocation.notes || '',
      remainingCapacity: Math.max(0, 100 - (allocation.allocationPercentage || allocation.allocation || 0)),
      otherTeamAllocations: allocation.otherTeamAllocations || [],
      createdAt: allocation.createdAt || new Date().toISOString(),
      updatedAt: allocation.updatedAt || new Date().toISOString(),
    };
  };

  // Helpers for UX fallbacks and visuals
  const getDisplayName = (a: TeamMemberAllocation): string => {
    if (a.teamMemberName && a.teamMemberName.trim()) return a.teamMemberName;
    if (a.teamMemberEmail && a.teamMemberEmail.includes('@')) return a.teamMemberEmail.split('@')[0];
    return 'Unidentified teammate';
  };

  const getDisplayEmail = (a: TeamMemberAllocation): string => {
    return a.teamMemberEmail && a.teamMemberEmail.trim() ? a.teamMemberEmail : 'Email not available';
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const getAllocationBarColor = (percent: number): string => {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const searchAvailableTeammates = async () => {
    if (!id) return;
    
    try {
      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(onlyAvailable && { onlyAvailable: true }),
      };
      
      // Use new API if available, fallback to existing
      let teammates: LocalAvailableTeammate[] = [];
      if (apiService.getAvailableTeammates) {
        const apiTeammates = await apiService.getAvailableTeammates(id, params);
        // Map API response to local interface
        teammates = apiTeammates.map(t => mapToAvailableTeammate(t));
      } else {
        // Fallback: use existing teammate search
        const response = await apiService.getTeammates({ 
          search: searchTerm,
          role: roleFilter,
          page: 0,
          size: 50
        });
        teammates = response.content.map(mapToAvailableTeammate);
      }
      
      setAvailableTeammates(teammates);
    } catch (error) {
      console.error('Failed to search available teammates:', error);
      setAvailableTeammates([]);
    }
  };

  // Map existing teammate format to available teammate format (temporary)
  const mapToAvailableTeammate = (teammate: any): LocalAvailableTeammate => ({
    id: teammate.id,
    name: teammate.name,
    email: teammate.email,
    role: teammate.role,
    capacity: teammate.capacity || 40,
    totalAllocation: teammate.currentAllocation || 0,
    remainingCapacity: Math.max(0, 100 - (teammate.currentAllocation || 0)),
    primaryTeamId: teammate.teamId,
    primaryTeamName: teammate.teamName,
    isFullyAllocated: (teammate.currentAllocation || 0) >= 100,
    currentAllocations: teammate.teamName ? [{
      teamId: teammate.teamId,
      teamName: teammate.teamName,
      allocationPercentage: teammate.currentAllocation || 0,
      roleInTeam: teammate.role,
    }] : [],
  });

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  useEffect(() => {
    if (showAssignmentModal) {
      searchAvailableTeammates();
    }
  }, [showAssignmentModal, searchTerm, roleFilter, onlyAvailable]);

  const handleUpdateTeam = async (updateData: UpdateTeamRequest) => {
    if (!id || !team) return;
    
    setIsUpdating(true);
    try {
      const updatedTeam = await apiService.updateTeam(id, updateData);
      setTeam(updatedTeam);
      show({ title: 'Team updated successfully!', type: 'success' });
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update team:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to update team', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTeammateSelection = (teammateId: string) => {
    const newSelected = new Set(selectedTeammates);
    if (newSelected.has(teammateId)) {
      newSelected.delete(teammateId);
      const newForms = { ...assignmentForms };
      delete newForms[teammateId];
      setAssignmentForms(newForms);
    } else {
      newSelected.add(teammateId);
      // Initialize form data
      const teammate = availableTeammates.find(t => t.id === teammateId);
      if (teammate) {
        setAssignmentForms(prev => ({
          ...prev,
          [teammateId]: {
            teammateId,
            allocationPercentage: Math.min(teammate.remainingCapacity, 100),
            roleInTeam: teammate.role,
            startDate: new Date().toISOString().split('T')[0],
            notes: '',
          }
        }));
      }
    }
    setSelectedTeammates(newSelected);
  };

  const updateAssignmentForm = (teammateId: string, field: keyof TeammateAssignmentFormData, value: any) => {
    setAssignmentForms(prev => ({
      ...prev,
      [teammateId]: {
        ...prev[teammateId],
        [field]: value,
      }
    }));
  };

  const handleBulkAssignment = async () => {
    if (!id || selectedTeammates.size === 0) return;

    setIsUpdating(true);
    try {
        const assignments = Array.from(selectedTeammates).map(teammateId => {
        const form = assignmentForms[teammateId];
        return {
          teammateId: teammateId,
          allocationPercentage: form.allocationPercentage,
          roleInTeam: form.roleInTeam,
          startDate: form.startDate,
          endDate: form.endDate || null,
          notes: form.notes || '',
        };
      });

      // Execute assignments (use new API if available)
      if (apiService.addTeammateToTeam) {
        for (const assignment of assignments) {
          await apiService.addTeammateToTeam(id, assignment);
        }
      } else {
        // Fallback: use existing API
        for (const assignment of assignments) {
          await apiService.assignTeammateToTeam(assignment.teammateId, { teamId: id });
        }
      }

      show({ title: `Successfully assigned ${assignments.length} teammate(s)!`, type: 'success' });
      setShowAssignmentModal(false);
      setSelectedTeammates(new Set());
      setAssignmentForms({});
      fetchTeamDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to assign teammates:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to assign teammates', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveTeammate = async (allocation: TeamMemberAllocation) => {
    if (!id) return;
    
    if (!confirm(`Remove ${allocation.teamMemberName} from this team?`)) return;

    try {
      // Use new API if available
      if (apiService.removeTeammateFromTeam) {
        await apiService.removeTeammateFromTeam(id, allocation.teamMemberId);
      } else {
        // Fallback: use existing API
        await apiService.assignTeammateToTeam(allocation.teamMemberId, { teamId: null });
      }
      
      show({ title: `${allocation.teamMemberName} removed from team`, type: 'success' });
      fetchTeamDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to remove teammate:', error);
      show({ title: 'Failed to remove teammate', type: 'error' });
    }
  };

  const getCapacityStatusColor = (remainingCapacity: number) => {
    if (remainingCapacity > 20) return 'text-green-600';
    if (remainingCapacity > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCapacityStatusEmoji = (remainingCapacity: number) => {
    if (remainingCapacity > 20) return '🟢';
    if (remainingCapacity > 0) return '🟡';
    return '🔴';
  };

  // Edit allocation modal state
  const [editingAllocation, setEditingAllocation] = useState<TeamMemberAllocation | null>(null);
  const [editAllocationValue, setEditAllocationValue] = useState<number>(0);

  const openEditAllocation = (allocation: TeamMemberAllocation) => {
    setEditingAllocation(allocation);
    setEditAllocationValue(allocation.allocationPercentage);
  };

  const submitEditAllocation = async () => {
    if (!id || !editingAllocation) return;
    try {
      if (apiService.updateTeamAllocation) {
        await apiService.updateTeamAllocation(id, editingAllocation.teamMemberId, {
          allocationPercentage: editAllocationValue,
        });
      }
      show({ title: 'Allocation updated', type: 'success' });
      setEditingAllocation(null);
      fetchTeamDetails();
    } catch (e) {
      show({ title: 'Failed to update allocation', type: 'error' });
    }
  };

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'DEVELOPER', label: 'Developer' },
    { value: 'QA', label: 'QA Engineer' },
    { value: 'DESIGNER', label: 'Designer' },
    { value: 'PM', label: 'Product Manager' },
    { value: 'EM', label: 'Engineering Manager' },
  ];

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <Card>
          <div className="p-8 text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <Button onClick={() => navigate('/teams')}>
              Back to Teams
            </Button>
          </div>
        </Card>
      </SidebarLayout>
    );
  }

  if (!team) {
    return (
      <SidebarLayout>
        <Card>
          <div className="p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">Team not found</p>
            <Button onClick={() => navigate('/teams')}>
              Back to Teams
            </Button>
          </div>
        </Card>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center mb-2">
            <button
              onClick={() => navigate('/teams')}
              className="mr-4 inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              aria-label="Back"
              title="Back"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          </div>
          {team.description && (
            <p className="text-gray-600 mt-2">{team.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowAssignCalendars(true)}>Calendars</Button>
          <Button onClick={() => setShowEditModal(true)}>Edit Team</Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team Members ({teamAllocations.length})
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('capacity')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'capacity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Capacity Planning
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Team Members Section - Inline Assignment Pattern */}
          <div className="team-members-section">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Team Members ({teamAllocations.length})</h2>
              <Button 
                onClick={() => setShowAssignmentModal(true)}
                className="btn-primary"
              >
                + Add Teammates
              </Button>
            </div>

            {/* Current Members with Allocation Percentages */}
            {teamAllocations.length === 0 ? (
              <Card>
                <div className="p-8 text-center text-gray-500">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.12l-.785 1.09M17 20h-10a3 3 0 01-3-3v-2a7.945 7.945 0 011.464-4.598l1.21 1.212M17 20v-2a3 3 0 00-3-3v-5a5 5 0 00-5-5v2m5 3h-5a5 5 0 00-5 5v5a3 3 0 003 3h10a3 3 0 003-3v-2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">No team members yet</p>
                  <p className="text-sm text-gray-500 mb-4">Add teammates to this team to get started</p>
                  <Button onClick={() => setShowAssignmentModal(true)}>
                    Add First Teammate
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="members-grid space-y-4">
                {teamAllocations.map((allocation) => (
                  <Card key={allocation.id}>
                    <div className="member-card p-6">
                      <div className="flex justify-between items-start">
                        <div className="member-info flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-semibold">
                              {getInitials(getDisplayName(allocation))}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{getDisplayName(allocation)}</h3>
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {getRoleLabel(allocation.roleInTeam || allocation.role)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            {getDisplayEmail(allocation)}
                            {(!allocation.teamMemberName || !allocation.teamMemberEmail) && (
                              <span className="ml-2 text-xs text-amber-600" title="Some details are not available from the backend">
                                ⚠︎ incomplete profile
                              </span>
                            )}
                          </div>
                          
                          <div className="allocation-info">
                            <div className="flex items-center space-x-4">
                              <div className="w-48">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Allocation</span>
                                  <span className="font-medium text-gray-900">{allocation.allocationPercentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 rounded">
                                  <div
                                    className={`h-2 rounded ${getAllocationBarColor(allocation.allocationPercentage)}`}
                                    style={{ width: `${Math.min(100, Math.max(0, allocation.allocationPercentage))}%` }}
                                    title={`${allocation.allocationPercentage}% allocated`}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="mr-1">{getCapacityStatusEmoji(allocation.remainingCapacity)}</span>
                                <span className={`text-sm font-medium ${getCapacityStatusColor(allocation.remainingCapacity)}`}>
                                  {allocation.remainingCapacity}% remaining capacity
                                </span>
                              </div>
                            </div>
                            
                            {allocation.otherTeamAllocations.length > 0 && (
                              <div className="mt-2">
                                <span className="multi-team-indicator text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  +{allocation.otherTeamAllocations.length} other team(s)
                                </span>
                              </div>
                            )}

                            {allocation.notes && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">Notes:</span>
                                <p className="text-sm text-gray-700">{allocation.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            onClick={() => openEditAllocation(allocation)}
                            className="text-xs px-3 py-1"
                          >
                            Edit Allocation
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRemoveTeammate(allocation)}
                            className="text-xs px-3 py-1 text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Team Name</label>
                  <p className="text-gray-900 mt-1">{team.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Members</label>
                  <p className="text-gray-900 mt-1">{teamAllocations.length} teammates</p>
                </div>
                {team.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-900 mt-1">{team.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-900 mt-1">{new Date(team.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-gray-900 mt-1">{new Date(team.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'capacity' && (
        <div className="space-y-6">
          {capacityMetrics ? (
            <TeamCapacityMetrics metrics={capacityMetrics} />
          ) : (
            <Card>
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">Capacity metrics not available</p>
                <p className="text-sm">Capacity planning features may not be enabled or data is still being calculated.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Teammate Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => !isUpdating && setShowAssignmentModal(false)}
        title="Add Teammates to Team"
        size="large"
      >
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Only Available</span>
              </label>
            </div>
          </div>

          {/* Available Teammates */}
          <div className="max-h-96 overflow-y-auto">
            {availableTeammates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No available teammates found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableTeammates.map((teammate) => (
                  <div key={teammate.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedTeammates.has(teammate.id)}
                        onChange={() => handleTeammateSelection(teammate.id)}
                        className="mt-1 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{teammate.name}</h4>
                            <p className="text-sm text-gray-600">{teammate.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                {teammate.role}
                              </span>
                              <span className={`text-sm font-medium ${getCapacityStatusColor(teammate.remainingCapacity)}`}>
                                {getCapacityStatusEmoji(teammate.remainingCapacity)} {teammate.remainingCapacity}% available
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assignment Form for Selected Teammates */}
                        {selectedTeammates.has(teammate.id) && assignmentForms[teammate.id] && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Allocation %
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max={teammate.remainingCapacity}
                                  value={assignmentForms[teammate.id].allocationPercentage}
                                  onChange={(e) => updateAssignmentForm(teammate.id, 'allocationPercentage', parseInt(e.target.value))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Role in Team
                                </label>
                                <input
                                  type="text"
                                  value={assignmentForms[teammate.id].roleInTeam || ''}
                                  onChange={(e) => updateAssignmentForm(teammate.id, 'roleInTeam', e.target.value.toUpperCase())}
                                  placeholder={getRoleLabel(teammate.role)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Summary */}
          {selectedTeammates.size > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Assignment Summary</h4>
              <p className="text-sm text-green-800">
                Ready to assign {selectedTeammates.size} teammate(s) to {team.name}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setShowAssignmentModal(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssignment}
              disabled={isUpdating || selectedTeammates.size === 0}
            >
              {isUpdating ? 'Assigning...' : `Assign ${selectedTeammates.size} Teammate(s)`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isUpdating && setShowEditModal(false)}
        title="Edit Team"
        size="large"
      >
        <EditTeamForm
          team={team}
          onSubmit={handleUpdateTeam}
          onCancel={() => setShowEditModal(false)}
          isLoading={isUpdating}
        />
      </Modal>

      {/* Assign Calendars Modal */}
      <Modal
        isOpen={showAssignCalendars}
        onClose={() => setShowAssignCalendars(false)}
        title="Assign Holiday Calendars"
        size="large"
      >
        {id && (
          <AssignCalendars teamId={id} onClose={() => setShowAssignCalendars(false)} />
        )}
      </Modal>

      {/* Edit Allocation Modal */}
      <Modal
        isOpen={!!editingAllocation}
        onClose={() => setEditingAllocation(null)}
        title="Edit Allocation"
        size="md"
      >
        {editingAllocation && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">Teammate</div>
              <div className="font-medium">{getDisplayName(editingAllocation)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allocation %</label>
              <input
                type="number"
                min={1}
                max={100}
                value={editAllocationValue}
                onChange={(e) => setEditAllocationValue(Math.max(1, Math.min(100, Number(e.target.value))))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Must be between 1 and 100.</p>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setEditingAllocation(null)}>Cancel</Button>
              <Button onClick={submitEditAllocation}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toasts handled globally by ToastProvider */}
    </SidebarLayout>
  );
};

export default TeamDetail;