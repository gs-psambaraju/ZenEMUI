import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EditProjectForm } from '../components/projects/EditProjectForm';
import apiService from '../services/api';
import type { Project, UpdateProjectRequest } from '../types';

export const EpicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Toasts handled via ToastProvider

  const fetchProject = async () => {
    if (!id) {
      setError('Project ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const projectData = await apiService.getProjectDetails(id);
      setProject(projectData);
    } catch (e) {
      console.error('Failed to fetch project:', e);
      setError(e instanceof Error ? e.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleUpdateProject = async (updateData: UpdateProjectRequest) => {
    if (!id || !project) return;
    
    setIsUpdating(true);
    try {
      const updatedProject = await apiService.updateProject(id, updateData);
      setProject(updatedProject);
      show({ title: 'Project updated successfully!', type: 'success' });
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update project:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to update project', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id || !project) return;
    
    if (!confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteProject(id);
      show({ title: 'Project deleted successfully!', type: 'success' });
      navigate('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to delete project', type: 'error' });
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
            <Button onClick={() => navigate('/projects')}>
              Back to Projects
            </Button>
          </div>
        </Card>
      </SidebarLayout>
    );
  }

  if (!project) {
    return (
      <SidebarLayout>
        <Card>
          <div className="p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">Project not found</p>
            <Button onClick={() => navigate('/projects')}>
              Back to Projects
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
            <Button 
              variant="outline" 
              onClick={() => navigate('/projects')}
              className="mr-4"
            >
              ← Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm rounded-full ${
              project.status === 'DONE' ? 'bg-green-100 text-green-800' :
              project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
              project.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm rounded-full ${
              project.healthStatus === 'GREEN' ? 'bg-green-100 text-green-800' :
              project.healthStatus === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
              project.healthStatus === 'RED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.healthStatus}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm rounded-full ${
              project.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
              project.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
              project.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.priority}
            </span>
          </div>
        </div>
        <div className="space-x-4">
          <Button onClick={() => setShowEditModal(true)}>
            Edit Project
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDeleteProject}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              {project.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900 mt-1">{project.description}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Project Type</label>
                <p className="text-gray-900 mt-1">{project.projectType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Team</label>
                <p className="text-gray-900 mt-1">{project.teamName || project.teamId}</p>
              </div>
              {project.initiativeName && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Initiative</label>
                  <p className="text-gray-900 mt-1">{project.initiativeName}</p>
                </div>
              )}
              {project.parentProjectName && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Parent Project</label>
                  <p className="text-gray-900 mt-1">{project.parentProjectName}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Timeline Information */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              {project.startDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <p className="text-gray-900 mt-1">{new Date(project.startDate).toLocaleDateString()}</p>
                </div>
              )}
              {project.targetEndDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Target End Date</label>
                  <p className="text-gray-900 mt-1">{new Date(project.targetEndDate).toLocaleDateString()}</p>
                </div>
              )}
              {project.actualStartDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Actual Start Date</label>
                  <p className="text-gray-900 mt-1">{new Date(project.actualStartDate).toLocaleDateString()}</p>
                </div>
              )}
              {project.actualEndDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Actual End Date</label>
                  <p className="text-gray-900 mt-1">{new Date(project.actualEndDate).toLocaleDateString()}</p>
                </div>
              )}
              {project.plannedReleaseDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Planned Release Date</label>
                  <p className="text-gray-900 mt-1">{new Date(project.plannedReleaseDate).toLocaleDateString()}</p>
                </div>
              )}
              {project.actualReleaseDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Actual Release Date</label>
                  <p className="text-gray-900 mt-1">{new Date(project.actualReleaseDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Team Assignments */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Assignments</h2>
            <div className="space-y-4">
              {project.engineeringManagerName && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Engineering Manager</label>
                  <p className="text-gray-900 mt-1">{project.engineeringManagerName}</p>
                </div>
              )}
              {project.productManagerName && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Product Manager</label>
                  <p className="text-gray-900 mt-1">{project.productManagerName}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Jira Integration */}
        {(project.jiraKey || project.jiraProjectKey || project.jiraIssueId) && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Jira Integration</h2>
              <div className="space-y-4">
                {project.jiraKey && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Jira Key</label>
                    <p className="text-gray-900 mt-1">{project.jiraKey}</p>
                  </div>
                )}
                {project.jiraProjectKey && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Jira Project Key</label>
                    <p className="text-gray-900 mt-1">{project.jiraProjectKey}</p>
                  </div>
                )}
                {project.jiraIssueId && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Jira Issue ID</label>
                    <p className="text-gray-900 mt-1">{project.jiraIssueId}</p>
                  </div>
                )}
                {project.jiraLastSync && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Sync</label>
                    <p className="text-gray-900 mt-1">{new Date(project.jiraLastSync).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Readiness Tracking */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Readiness Tracking</h2>
            <div className="space-y-4">
              {project.groomedDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Groomed Date</label>
                  <p className="text-gray-900 mt-1">{new Date(project.groomedDate).toLocaleDateString()}</p>
                </div>
              )}
              {project.mocksStatus && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Mocks Status</label>
                  <p className="text-gray-900 mt-1">{project.mocksStatus.replace(/_/g, ' ')}</p>
                </div>
              )}
              {project.mocksFinalizedDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Mocks Finalized Date</label>
                  <p className="text-gray-900 mt-1">{new Date(project.mocksFinalizedDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Release Management */}
        {project.releaseVersions && project.releaseVersions.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Release Versions</h2>
              <div className="flex flex-wrap gap-2">
                {project.releaseVersions.map((version, index) => (
                  <span
                    key={index}
                    className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                  >
                    {version}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Audit Information */}
        <Card className="col-span-full">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Audit Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Created At</label>
                <p className="text-gray-900 mt-1">{new Date(project.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-gray-900 mt-1">{new Date(project.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isUpdating && setShowEditModal(false)}
        title="Edit Project"
        size="large"
      >
        <EditProjectForm
          project={project}
          onSubmit={handleUpdateProject}
          onCancel={() => setShowEditModal(false)}
          isLoading={isUpdating}
        />
      </Modal>

      {/* Toasts handled globally by ToastProvider */}
    </SidebarLayout>
  );
};

export default EpicDetail;
