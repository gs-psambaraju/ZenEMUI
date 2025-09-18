import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { PencilSquareIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import apiService from '../services/api';
import type { OkrType, UpdateOkrTypeRequest } from '../types';
import { useToast } from '../components/ui/Toast';

export const AdminOkrTypes: React.FC = () => {
  const { show } = useToast();
  const [okrTypes, setOkrTypes] = useState<OkrType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingType, setEditingType] = useState<OkrType | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    isActive: true,
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOkrTypes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const types = await apiService.getOkrTypes();
      setOkrTypes(types);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load OKR types';
      setError(message);
      show({ title: 'Failed to load', description: message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOkrTypes();
  }, []);

  const handleEdit = (okrType: OkrType) => {
    setEditingType(okrType);
    setEditForm({
      displayName: okrType.displayName,
      isActive: okrType.isActive,
      description: okrType.description || ''
    });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingType(null);
    setEditForm({ displayName: '', isActive: true, description: '' });
    setError(null);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload: UpdateOkrTypeRequest = {
        displayName: editForm.displayName.trim(),
        isActive: editForm.isActive,
        description: editForm.description.trim() || null
      };

      await apiService.updateOkrType(editingType.id, payload);
      
      show({ 
        title: 'OKR Type updated', 
        description: `${editForm.displayName} has been updated successfully`, 
        type: 'success' 
      });
      
      handleCloseEdit();
      await loadOkrTypes();
    } catch (e) {
      let errorMessage = 'Failed to update OKR type';
      
      if (e instanceof Error) {
        try {
          // Try to parse as OkrTypeError for specific error codes
          const errorResponse = JSON.parse(e.message);
          if (errorResponse.code === 'TYPE_IN_USE') {
            errorMessage = 'Cannot deactivate this OKR type as it is currently used by existing OKRs in the active period';
          } else if (errorResponse.code === 'IMMUTABLE_FIELD') {
            errorMessage = 'Level and code fields cannot be changed';
          } else {
            errorMessage = errorResponse.message || e.message;
          }
        } catch {
          errorMessage = e.message;
        }
      }
      
      setError(errorMessage);
      show({ title: 'Update failed', description: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = editForm.displayName.trim().length > 0;

  return (
    <SidebarLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin • OKR Types</h1>
        <p className="mt-2 text-gray-600">Configure OKR taxonomy and hierarchy levels.</p>
      </div>

      {/* Info callout */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About OKR Type Configuration</h3>
              <p className="mt-1 text-sm text-blue-700">
                OKR types define the hierarchy and structure of your objectives. 
                Level and code values determine the hierarchy and cannot be changed. 
                You can customize display names and descriptions to match your organization's terminology.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Types table */}
      <Card className="min-h-[60vh]">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">OKR Types</h2>
        
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading OKR types...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadOkrTypes} 
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && okrTypes.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              📊
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No OKR types configured</h3>
            <p className="text-gray-600">OKR types will be seeded automatically by the system.</p>
          </div>
        )}

        {!isLoading && !error && okrTypes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {okrTypes.map((type) => (
                  <tr key={type.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {type.level}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                      {type.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {type.displayName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        type.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                      {type.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleEdit(type)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        title="Edit OKR Type"
                      >
                        <PencilSquareIcon className="h-4 w-4 text-gray-700" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit modal */}
      <Modal
        open={isEditOpen}
        onClose={handleCloseEdit}
        title={editingType ? `Edit ${editingType.displayName}` : 'Edit OKR Type'}
        size="md"
        footer={
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <button
                type="button"
                onClick={handleCloseEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-okr-type-form"
                disabled={isSubmitting || !isFormValid}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isFormValid && !isSubmitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        }
      >
        <form id="edit-okr-type-form" onSubmit={handleSubmitEdit} className="space-y-4">
          {editingType && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Immutable Fields</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Level:</span>
                  <span className="ml-2 font-medium text-gray-900">{editingType.level}</span>
                </div>
                <div>
                  <span className="text-gray-600">Code:</span>
                  <span className="ml-2 font-mono font-medium text-gray-900">{editingType.code}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                These fields determine the hierarchy and cannot be changed.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editForm.displayName}
              onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter display name"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-xs text-gray-600">
              Inactive types cannot be used for new OKRs but existing OKRs remain unchanged.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description for this OKR type"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </form>
      </Modal>
    </SidebarLayout>
  );
};

export default AdminOkrTypes;
