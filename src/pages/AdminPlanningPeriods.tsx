import React, { useEffect, useMemo, useState } from 'react';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { SingleSelect } from '../components/ui/SingleSelect';
import { Button } from '../components/ui/Button';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import apiService from '../services/api';
import type { PlanningPeriod, CreatePlanningPeriodRequest, FiscalConfig, ApplyTemplateRequest, PeriodType } from '../types';
import { useToast } from '../components/ui/Toast';

const FISCAL_YEAR_START_MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const PERIOD_TYPES: { value: PeriodType; label: string }[] = [
  { value: 'YEAR', label: 'Year' },
  { value: 'HALF', label: 'Half' },
  { value: 'QUARTER', label: 'Quarter' },
  { value: 'MONTH', label: 'Month' },
];

const TEMPLATES = [
  { value: 'STANDARD', label: 'Standard Calendar Year', enabled: true, description: 'Calendar quarters (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec)' },
  { value: 'CUSTOM', label: 'Custom Fiscal Year', enabled: false, description: 'Based on your fiscal year settings', tooltip: 'Parked for future release' },
];

interface PeriodFormData {
  name: string;
  periodType: PeriodType;
  parentPeriodId: string;
  startDate: string;
  endDate: string;
  planningStartDate: string;
  planningEndDate: string;
  reviewStartDate: string;
  reviewEndDate: string;
  isActive: boolean;
}

const initialFormData: PeriodFormData = {
  name: '',
  periodType: 'QUARTER',
  parentPeriodId: '',
  startDate: '',
  endDate: '',
  planningStartDate: '',
  planningEndDate: '',
  reviewStartDate: '',
  reviewEndDate: '',
  isActive: false,
};

export const AdminPlanningPeriods: React.FC = () => {
  const { show } = useToast();
  const [periods, setPeriods] = useState<PlanningPeriod[]>([]);
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>({ fiscalYearStartMonth: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState<string>('1');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PlanningPeriod | null>(null);
  const [formData, setFormData] = useState<PeriodFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Template form
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    template: 'STANDARD' as ApplyTemplateRequest['template'],
    year: new Date().getFullYear(),
  });
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [periodsData, configData] = await Promise.all([
        apiService.getPlanningPeriods(),
        apiService.getFiscalConfig(),
      ]);
      setPeriods(periodsData);
      setFiscalConfig(configData);
      setFiscalYearStartMonth(configData.fiscalYearStartMonth.toString());
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load data';
      setError(errorMessage);
      show({ title: 'Failed to load', description: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Computed values
  const parentOptions = useMemo(() => {
    const currentLevel = PERIOD_TYPES.find(t => t.value === formData.periodType)?.value === 'YEAR' ? 1 : 
                       PERIOD_TYPES.find(t => t.value === formData.periodType)?.value === 'HALF' ? 2 :
                       PERIOD_TYPES.find(t => t.value === formData.periodType)?.value === 'QUARTER' ? 3 : 4;
    
    return periods
      .filter(p => p.level === currentLevel - 1)
      .map(p => ({ value: p.id, label: p.name }));
  }, [periods, formData.periodType]);

  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [periods]);

  // Event handlers
  const handleSaveFiscalConfig = async () => {
    try {
      const newConfig = { fiscalYearStartMonth: parseInt(fiscalYearStartMonth) };
      await apiService.updateFiscalConfig(newConfig);
      setFiscalConfig(newConfig);
      show({ title: 'Fiscal config saved', type: 'success' });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save fiscal config';
      show({ title: 'Failed to save', description: errorMessage, type: 'error' });
    }
  };

  const openCreateModal = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const openEditModal = (period: PlanningPeriod) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      periodType: period.periodType,
      parentPeriodId: period.parentPeriodId || '',
      startDate: period.startDate,
      endDate: period.endDate,
      planningStartDate: period.planningStartDate || '',
      planningEndDate: period.planningEndDate || '',
      reviewStartDate: period.reviewStartDate || '',
      reviewEndDate: period.reviewEndDate || '',
      isActive: period.isActive,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.endDate) errors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      errors.endDate = 'End date must be after start date';
    }
    
    // Planning dates validation
    if (formData.planningStartDate && formData.planningEndDate && formData.planningStartDate >= formData.planningEndDate) {
      errors.planningEndDate = 'Planning end date must be after planning start date';
    }
    
    // Review dates validation
    if (formData.reviewStartDate && formData.reviewEndDate && formData.reviewStartDate >= formData.reviewEndDate) {
      errors.reviewEndDate = 'Review end date must be after review start date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload: CreatePlanningPeriodRequest = {
        name: formData.name,
        periodType: formData.periodType,
        level: PERIOD_TYPES.find(t => t.value === formData.periodType)?.value === 'YEAR' ? 1 : 
               PERIOD_TYPES.find(t => t.value === formData.periodType)?.value === 'HALF' ? 2 :
               PERIOD_TYPES.find(t => t.value === formData.periodType)?.value === 'QUARTER' ? 3 : 4,
        parentPeriodId: formData.parentPeriodId || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        planningStartDate: formData.planningStartDate || undefined,
        planningEndDate: formData.planningEndDate || undefined,
        reviewStartDate: formData.reviewStartDate || undefined,
        reviewEndDate: formData.reviewEndDate || undefined,
        isActive: formData.isActive,
      };

      if (editingPeriod) {
        await apiService.updatePlanningPeriod(editingPeriod.id, payload);
        show({ title: 'Period updated', type: 'success' });
        setIsEditModalOpen(false);
      } else {
        await apiService.createPlanningPeriod(payload);
        show({ title: 'Period created', type: 'success' });
        setIsCreateModalOpen(false);
      }
      
      await loadData();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save period';
      show({ title: 'Failed to save', description: errorMessage, type: 'error' });
    }
  };

  const handleDelete = async (period: PlanningPeriod) => {
    if (!confirm(`Delete "${period.name}"? This cannot be undone.`)) return;
    
    try {
      await apiService.deletePlanningPeriod(period.id);
      show({ title: 'Period deleted', type: 'success' });
      await loadData();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete period';
      show({ title: 'Failed to delete', description: errorMessage, type: 'error' });
    }
  };

  const handleGenerateTemplate = async () => {
    if (!confirm(`Generate ${templateForm.template} template for ${templateForm.year}? This will create planning periods in your database.`)) {
      return;
    }

    setIsGeneratingTemplate(true);
    try {
      const result = await apiService.applyPlanningTemplate(templateForm);
      const periodsCount = Array.isArray(result) ? result.length : 5; // Fallback to expected count
      show({ 
        title: 'Periods created successfully', 
        description: `Created ${periodsCount} planning periods for ${templateForm.year}`, 
        type: 'success' 
      });
      setIsTemplateModalOpen(false);
      await loadData();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create periods';
      show({ title: 'Failed to create periods', description: errorMessage, type: 'error' });
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin • Planning Periods</h1>
        <p className="mt-2 text-gray-600">Configure fiscal year settings and manage planning periods.</p>
      </div>

      {/* Fiscal Year Configuration */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fiscal Year Configuration</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiscal Year Start Month
            </label>
            <SingleSelect
              options={FISCAL_YEAR_START_MONTHS}
              value={fiscalYearStartMonth}
              onChange={(value) => setFiscalYearStartMonth(value || '1')}
              placeholder="Select month"
            />
          </div>
          <Button 
            onClick={handleSaveFiscalConfig}
            disabled={fiscalYearStartMonth === fiscalConfig.fiscalYearStartMonth.toString()}
          >
            Save
          </Button>
        </div>
      </Card>

      {/* Templates */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Templates</h2>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsTemplateModalOpen(true)}
            variant="secondary"
          >
            Generate Year
          </Button>
          <p className="text-sm text-gray-600">
            Generate a complete year of planning periods using a predefined template.
          </p>
        </div>
      </Card>

      {/* Planning Periods List */}
      <Card>
        {isLoading ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Planning Periods</h2>
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Planning Periods</h2>
            <p className="text-red-600">{error}</p>
          </div>
        ) : periods.length === 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Planning Periods</h2>
            <div className="text-center py-16">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                📅
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No planning periods yet</h3>
              <p className="text-gray-600 mb-4">Create your first planning period or generate from a template.</p>
              <div className="flex justify-center gap-3">
                <Button onClick={openCreateModal}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Period
                </Button>
                <Button onClick={() => setIsTemplateModalOpen(true)} variant="secondary">
                  Generate Year
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Planning Periods</h2>
              <Button onClick={openCreateModal}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Period
              </Button>
            </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start/End</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planning</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPeriods.map((period) => {
                  const parent = periods.find(p => p.id === period.parentPeriodId);
                  return (
                    <tr key={period.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{period.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{period.periodType}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{period.level}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{parent?.name || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {period.startDate} to {period.endDate}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {period.planningStartDate && period.planningEndDate 
                          ? `${period.planningStartDate} to ${period.planningEndDate}`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {period.reviewStartDate && period.reviewEndDate 
                          ? `${period.reviewStartDate} to ${period.reviewEndDate}`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          period.isActive 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {period.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(period)}
                            className="text-gray-700 hover:text-blue-600"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(period)}
                            className="text-gray-700 hover:text-red-600"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setEditingPeriod(null);
        }}
        title={editingPeriod ? 'Edit Planning Period' : 'Create Planning Period'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setEditingPeriod(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPeriod ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            placeholder="e.g., Q1 2025"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
            <SingleSelect
              options={PERIOD_TYPES.map(t => ({ value: t.value, label: t.label }))}
              value={formData.periodType}
              onChange={(value) => setFormData(prev => ({ ...prev, periodType: value as PeriodType }))}
              placeholder="Select type"
            />
          </div>

          {parentOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Period</label>
              <SingleSelect
                options={[{ value: '', label: 'No parent' }, ...parentOptions]}
                value={formData.parentPeriodId}
                onChange={(value) => setFormData(prev => ({ ...prev, parentPeriodId: value || '' }))}
                placeholder="Select parent"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              error={formErrors.startDate}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              error={formErrors.endDate}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Planning Start Date (Optional)"
              type="date"
              value={formData.planningStartDate}
              onChange={(e) => setFormData(prev => ({ ...prev, planningStartDate: e.target.value }))}
              error={formErrors.planningStartDate}
            />
            <Input
              label="Planning End Date (Optional)"
              type="date"
              value={formData.planningEndDate}
              onChange={(e) => setFormData(prev => ({ ...prev, planningEndDate: e.target.value }))}
              error={formErrors.planningEndDate}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Review Start Date (Optional)"
              type="date"
              value={formData.reviewStartDate}
              onChange={(e) => setFormData(prev => ({ ...prev, reviewStartDate: e.target.value }))}
              error={formErrors.reviewStartDate}
            />
            <Input
              label="Review End Date (Optional)"
              type="date"
              value={formData.reviewEndDate}
              onChange={(e) => setFormData(prev => ({ ...prev, reviewEndDate: e.target.value }))}
              error={formErrors.reviewEndDate}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Set as active period for this level
            </label>
          </div>
        </div>
      </Modal>

      {/* Template Modal */}
      <Modal
        open={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
        }}
        title="Generate Planning Periods"
        size="md"
        footer={
          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={() => setIsTemplateModalOpen(false)}
              disabled={isGeneratingTemplate}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateTemplate}
              disabled={isGeneratingTemplate || templateForm.template !== 'STANDARD'}
              isLoading={isGeneratingTemplate}
            >
              {isGeneratingTemplate ? 'Creating...' : 'Create Periods'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
              <div className="space-y-2">
                {TEMPLATES.map((template) => (
                  <div key={template.value} className="relative">
                    <label 
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                        template.enabled 
                          ? templateForm.template === template.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                      title={template.enabled ? template.description : template.tooltip}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.value}
                        checked={templateForm.template === template.value}
                        onChange={(e) => template.enabled && setTemplateForm(prev => ({ 
                          ...prev, 
                          template: e.target.value as ApplyTemplateRequest['template'] 
                        }))}
                        disabled={!template.enabled}
                        className={`mt-0.5 ${template.enabled ? '' : 'opacity-50'}`}
                      />
                      <div className="ml-3 flex-1">
                        <div className={`text-sm font-medium ${template.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                          {template.label}
                          {!template.enabled && (
                            <span className="ml-2 text-xs text-gray-400 italic">
                              ({template.tooltip})
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${template.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                          {template.description}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Input
              label="Year"
              type="number"
              min="2020"
              max="2030"
              value={templateForm.year.toString()}
              onChange={(e) => setTemplateForm(prev => ({ 
                ...prev, 
                year: parseInt(e.target.value) || new Date().getFullYear() 
              }))}
              helperText="Select the year for which to generate planning periods"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What will be created?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Standard Calendar template creates:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>1 Fiscal Year ({templateForm.year})</li>
                    <li>4 Quarters (Q1-Q4 following calendar year)</li>
                  </ul>
                  <p className="mt-2 font-medium">Total: 5 planning periods</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
};

export default AdminPlanningPeriods;
