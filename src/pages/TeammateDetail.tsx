import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EditTeammateForm } from '../components/teammates/EditTeammateForm';
import { CreateLeaveForm } from '../components/leaves/CreateLeaveForm';
import { EditLeaveForm } from '../components/leaves/EditLeaveForm';
import { LeavesList } from '../components/leaves/LeavesList';
import { CapacityBreakdown } from '../components/capacity/CapacityBreakdown';
import apiService from '../services/api';
import type { Teammate, TeammateLeave, UpdateTeammateRequest, CreateLeaveRequest, UpdateLeaveRequest, CapacityBreakdown as CapacityBreakdownType, TeammateRole } from '../types';

export const TeammateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  
  const [teammate, setTeammate] = useState<Teammate | null>(null);
  const [leaves, setLeaves] = useState<TeammateLeave[]>([]);
  const [capacityBreakdown, setCapacityBreakdown] = useState<CapacityBreakdownType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'leaves' | 'capacity'>('overview');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateLeaveModal, setShowCreateLeaveModal] = useState(false);
  const [showEditLeaveModal, setShowEditLeaveModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<TeammateLeave | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Toasts handled via ToastProvider

  const fetchTeammateDetails = async () => {
    if (!id) {
      setError('Teammate ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [teammateData, leavesData] = await Promise.all([
        apiService.updateTeammate(id, {}), // Use existing endpoint as a get
        apiService.getTeammateLeaves(id),
      ]);
      
      setTeammate(teammateData);
      setLeaves(leavesData);
      
      // Load capacity breakdown
      try {
        const capacityData = await apiService.getTeammateCapacityBreakdown(id);
        setCapacityBreakdown(capacityData);
      } catch (capacityError) {
        console.warn('Could not load capacity breakdown:', capacityError);
        // Capacity breakdown is optional - don't fail the entire page load
      }
    } catch (e) {
      console.error('Failed to fetch teammate details:', e);
      setError(e instanceof Error ? e.message : 'Failed to load teammate details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeammateDetails();
  }, [id]);

  const handleUpdateTeammate = async (updateData: UpdateTeammateRequest) => {
    if (!id || !teammate) return;
    
    setIsUpdating(true);
    try {
      const updatedTeammate = await apiService.updateTeammate(id, updateData);
      setTeammate(updatedTeammate);
      show({ title: 'Teammate updated successfully!', type: 'success' });
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update teammate:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to update teammate', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateLeave = async (leaveData: CreateLeaveRequest) => {
    if (!id) return;
    
    setIsUpdating(true);
    try {
      await apiService.createTeammateLeave(id, leaveData);
      show({ title: 'Leave request created successfully!', type: 'success' });
      setShowCreateLeaveModal(false);
      fetchTeammateDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to create leave:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to create leave request', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditLeave = (leave: TeammateLeave) => {
    setEditingLeave(leave);
    setShowEditLeaveModal(true);
  };

  const handleUpdateLeave = async (updateData: UpdateLeaveRequest) => {
    if (!id || !editingLeave) return;
    
    setIsUpdating(true);
    try {
      await apiService.updateTeammateLeave(id, editingLeave.id, updateData);
      show({ title: 'Leave updated successfully!', type: 'success' });
      setShowEditLeaveModal(false);
      setEditingLeave(null);
      fetchTeammateDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update leave:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to update leave', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteLeave = async (leave: TeammateLeave) => {
    if (!id) return;
    
    if (!confirm(`Are you sure you want to cancel this ${leave.leaveType.toLowerCase()} leave?`)) {
      return;
    }

    try {
      await apiService.deleteTeammateLeave(id, leave.id);
      show({ title: 'Leave cancelled successfully!', type: 'success' });
      fetchTeammateDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to cancel leave:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to cancel leave', type: 'error' });
    }
  };

  const getRoleBadgeColor = (role: TeammateRole) => {
    switch (role) {
      case 'EM': return 'bg-purple-100 text-purple-800';
      case 'PM': return 'bg-blue-100 text-blue-800';
      case 'DEVELOPER': return 'bg-green-100 text-green-800';
      case 'QA': return 'bg-yellow-100 text-yellow-800';
      case 'DESIGNER': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <Button onClick={() => navigate('/teammates')}>
              Back to Teammates
            </Button>
          </div>
        </Card>
      </SidebarLayout>
    );
  }

  if (!teammate) {
    return (
      <SidebarLayout>
        <Card>
          <div className="p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">Teammate not found</p>
            <Button onClick={() => navigate('/teammates')}>
              Back to Teammates
            </Button>
          </div>
        </Card>
      </SidebarLayout>
    );
  }

  const upcomingLeaves = leaves.filter(leave => new Date(leave.startDate) > new Date() && leave.status === 'APPROVED');
  const activeLeaves = leaves.filter(leave => {
    const now = new Date();
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    return now >= start && now <= end && leave.status === 'APPROVED';
  });

  return (
    <SidebarLayout>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center mb-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/teammates')}
              className="mr-4"
            >
              ← Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{teammate.name}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm rounded-full ${getRoleBadgeColor(teammate.role)}`}>
              {teammate.role}
            </span>
            {teammate.teamName && (
              <span className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                {teammate.teamName}
              </span>
            )}
            <span className="text-gray-600">{teammate.email}</span>
          </div>
        </div>
        <Button onClick={() => setShowEditModal(true)}>
          Edit Teammate
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
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
              onClick={() => setActiveTab('leaves')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'leaves'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Leaves ({leaves.length})
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900 mt-1">{teammate.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="text-gray-900 mt-1">{teammate.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Team</label>
                  <p className="text-gray-900 mt-1">{teammate.teamName || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Capacity</label>
                  <p className="text-gray-900 mt-1">{teammate.capacity} hours per sprint</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Allocation</label>
                  <p className="text-gray-900 mt-1">{teammate.currentAllocation}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Assigned Epics</label>
                  <p className="text-gray-900 mt-1">{teammate.assignedProjectCount} active epics</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Leave Summary */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Summary</h2>
              
              {activeLeaves.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-900">Currently on Leave</h3>
                  {activeLeaves.map(leave => (
                    <p key={leave.id} className="text-sm text-red-800">
                      {leave.leaveType.replace(/_/g, ' ')} until {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              )}

              {upcomingLeaves.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-900">Upcoming Leaves</h3>
                  {upcomingLeaves.map(leave => (
                    <p key={leave.id} className="text-sm text-yellow-800">
                      {leave.leaveType.replace(/_/g, ' ')}: {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{leaves.length}</div>
                  <div className="text-sm text-gray-500">Total Leaves</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{leaves.filter(l => l.status === 'APPROVED').length}</div>
                  <div className="text-sm text-gray-500">Approved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{leaves.filter(l => l.status === 'PENDING').length}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Leave Management</h2>
            <Button onClick={() => setShowCreateLeaveModal(true)}>
              Add Leave Request
            </Button>
          </div>
          
          <LeavesList
            leaves={leaves}
            onEditLeave={handleEditLeave}
            onDeleteLeave={handleDeleteLeave}
          />
        </div>
      )}

      {activeTab === 'capacity' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Capacity Planning</h2>
          
          {capacityBreakdown ? (
            <CapacityBreakdown breakdown={capacityBreakdown} />
          ) : (
            <Card>
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">Capacity data not available</p>
                <p className="text-sm">Capacity planning features may not be enabled or data is still being calculated.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Edit Teammate Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isUpdating && setShowEditModal(false)}
        title="Edit Teammate"
        size="large"
      >
        <EditTeammateForm
          teammate={teammate}
          onSubmit={handleUpdateTeammate}
          onCancel={() => setShowEditModal(false)}
          isLoading={isUpdating}
        />
      </Modal>

      {/* Create Leave Modal */}
      <Modal
        isOpen={showCreateLeaveModal}
        onClose={() => !isUpdating && setShowCreateLeaveModal(false)}
        title="Create Leave Request"
        size="large"
      >
        <CreateLeaveForm
          onSubmit={handleCreateLeave}
          onCancel={() => setShowCreateLeaveModal(false)}
          isLoading={isUpdating}
        />
      </Modal>

      {/* Edit Leave Modal */}
      {editingLeave && (
        <Modal
          isOpen={showEditLeaveModal}
          onClose={() => !isUpdating && setShowEditLeaveModal(false)}
          title="Edit Leave Request"
          size="large"
        >
          <EditLeaveForm
            leave={editingLeave}
            onSubmit={handleUpdateLeave}
            onCancel={() => {
              setShowEditLeaveModal(false);
              setEditingLeave(null);
            }}
            isLoading={isUpdating}
          />
        </Modal>
      )}

      {/* Toasts handled globally by ToastProvider */}
    </SidebarLayout>
  );
};

export default TeammateDetail;
