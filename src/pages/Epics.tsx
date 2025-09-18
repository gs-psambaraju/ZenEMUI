import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { CreateEpicForm } from '../components/epics/CreateEpicForm';
import { ContextualRefreshButton } from '../components/refresh/ContextualRefreshButton';
import apiService from '../services/api';
import type { EpicListItem, PageResponse } from '../services/api';
import type { CreateEpicRequest } from '../types';

export const Epics: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useToast();
  const [data, setData] = useState<PageResponse<EpicListItem> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Toasts handled via ToastProvider

  const fetchEpics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await apiService.getEpics({ page: 0, size: 20, sortBy: 'updatedAt', sortDirection: 'DESC' });
      setData(resp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load epics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEpics();
  }, []);

  const handleCreateEpic = async (epicData: CreateEpicRequest) => {
    setIsCreating(true);
    try {
      await apiService.createEpic(epicData);
      show({ title: 'Epic created successfully!', type: 'success' });
      setShowCreateModal(false);
      fetchEpics(); // Refresh the list
    } catch (error) {
      console.error('Failed to create epic:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to create epic', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEpic = async (epicId: string, epicName: string) => {
    if (!confirm(`Are you sure you want to delete the epic "${epicName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteEpic(epicId);
      show({ title: 'Epic deleted successfully!', type: 'success' });
      fetchEpics(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete epic:', error);
      show({ title: error instanceof Error ? error.message : 'Failed to delete epic', type: 'error' });
    }
  };

  const handleViewEpic = (epicId: string) => {
    navigate(`/epics/${epicId}`);
  };

  return (
    <SidebarLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Epics</h1>
          <p className="mt-2 text-gray-600">Manage your epics and stories.</p>
        </div>
        <div className="flex items-center space-x-2">
          <ContextualRefreshButton
            context="projects"
            suggestedTargets={['EPICS', 'STORIES', 'SPRINT']}
            label="Refresh Data"
          />
          <Button onClick={() => setShowCreateModal(true)}>
            Create Epic
          </Button>
        </div>
      </div>

      <Card>
        {isLoading && <p className="p-4 text-gray-600">Loading...</p>}
        {error && <p className="p-4 text-red-600">{error}</p>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed md:table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Release</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.content.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-2 md:px-4 py-3 text-sm text-gray-900 break-words">
                      <button
                        onClick={() => handleViewEpic(p.id)}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        p.status === 'DONE' ? 'bg-green-100 text-green-800' :
                        p.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        p.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        p.healthStatus === 'GREEN' ? 'bg-green-100 text-green-800' :
                        p.healthStatus === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                        p.healthStatus === 'RED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {p.healthStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        p.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        p.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        p.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-700">{p.teamName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.plannedReleaseDate || '-'}</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-700">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => handleViewEpic(p.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteEpic(p.id, p.name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.content?.length && (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">No epics found</p>
                <p className="text-sm">Create your first epic to get started</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Create Epic Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !isCreating && setShowCreateModal(false)}
        title="Create New Epic"
        size="large"
      >
        <CreateEpicForm
          onSubmit={handleCreateEpic}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isCreating}
        />
      </Modal>

      {/* Toasts handled globally by ToastProvider */}
    </SidebarLayout>
  );
};

export default Epics;


