import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SingleSelect } from '../ui/SingleSelect';
import { Icon } from '../ui/Icon';
import { useToast } from '../ui/Toast';
import apiService from '../../services/api';

interface FieldMapping {
  jiraFieldId: string;
  zenemFieldPath: string;
  mappingLogic?: string;
  isRequired?: boolean;
}

interface RequiredField {
  zenemField: string;
  label: string;
  mandatory: boolean;
}

interface DiscoveredField {
  id: string;
  name: string;
  type?: string;
  usagePercentage?: number;
  samples?: string[];
}

interface FieldMappingInterfaceProps {
  connectorId: string;
  jobId: string;
  onMappingsSaved?: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const FieldMappingInterface: React.FC<FieldMappingInterfaceProps> = ({
  connectorId,
  jobId,
  onMappingsSaved,
  onValidationChange,
}) => {
  const { show } = useToast();
  
  // State
  const [currentMappings, setCurrentMappings] = useState<FieldMapping[]>([]);
  const [requiredFields, setRequiredFields] = useState<RequiredField[]>([]);
  const [discoveredFields, setDiscoveredFields] = useState<DiscoveredField[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldTypeFilter, setFieldTypeFilter] = useState<string>('all');

  // Filter discovered fields based on search and type
  const filteredFields = useMemo(() => {
    return discoveredFields.filter(field => {
      const matchesSearch = !searchTerm || 
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = fieldTypeFilter === 'all' || 
        (field.type && field.type.toLowerCase().includes(fieldTypeFilter.toLowerCase()));
      
      return matchesSearch && matchesType;
    });
  }, [discoveredFields, searchTerm, fieldTypeFilter]);

  // Get field options for selectors
  const fieldOptions = useMemo(() => {
    return filteredFields.map(field => ({
      value: field.id,
      label: field.name,
      hint: field.usagePercentage ? `${Math.round(field.usagePercentage)}% usage` : undefined,
      subtext: field.samples?.slice(0, 2).join(', ') || undefined,
    }));
  }, [filteredFields]);

  // Calculate validation status
  const validationStatus = useMemo(() => {
    const requiredMappings = requiredFields.filter(f => f.mandatory);
    const mappedRequired = requiredMappings.filter(req => 
      currentMappings.some(mapping => mapping.zenemFieldPath === req.zenemField)
    );
    
    const totalRequired = requiredMappings.length;
    const mappedCount = mappedRequired.length;
    const isComplete = totalRequired === 0 || mappedCount === totalRequired;
    const percentage = totalRequired === 0 ? 100 : Math.round((mappedCount / totalRequired) * 100);
    
    return {
      isComplete,
      percentage,
      mappedCount,
      totalRequired,
      missingFields: requiredMappings.filter(req => 
        !currentMappings.some(mapping => mapping.zenemFieldPath === req.zenemField)
      ),
    };
  }, [currentMappings, requiredFields]);

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [mappingsRes, requiredRes, discoveredRes] = await Promise.all([
        apiService.getCurrentMappings(connectorId, jobId).catch(() => ({ mappings: [] })),
        apiService.getRequiredFields(connectorId, jobId).catch(() => ({ requiredFields: [] })),
        apiService.getDiscoveryResults(connectorId, jobId).catch(() => ({ discoveredFields: [] })),
      ]);

      setCurrentMappings(Array.isArray(mappingsRes?.mappings) ? mappingsRes.mappings : []);
      setRequiredFields(Array.isArray(requiredRes?.requiredFields) ? requiredRes.requiredFields : []);
      setDiscoveredFields(Array.isArray(discoveredRes?.discoveredFields) ? discoveredRes.discoveredFields : []);
    } catch (error) {
      show({
        title: 'Failed to load field mapping data',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Save mappings
  const saveMappings = async () => {
    setSaving(true);
    try {
      await apiService.saveJobMappings(connectorId, jobId, { mappings: currentMappings });
      show({
        title: 'Mappings saved',
        description: 'Field mappings have been successfully saved',
        type: 'success',
      });
      onMappingsSaved?.();
    } catch (error) {
      show({
        title: 'Failed to save mappings',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle mapping changes
  const updateMapping = (zenemFieldPath: string, jiraFieldId: string | null, isRequired: boolean) => {
    setCurrentMappings(prev => {
      const filtered = prev.filter(m => m.zenemFieldPath !== zenemFieldPath);
      if (jiraFieldId) {
        return [...filtered, { jiraFieldId, zenemFieldPath: zenemFieldPath, isRequired }];
      }
      return filtered;
    });
  };

  // Get current mapping for a field
  const getCurrentMapping = (zenemFieldPath: string) => {
    return currentMappings.find(m => m.zenemFieldPath === zenemFieldPath);
  };

  // Effect to notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(validationStatus.isComplete);
  }, [validationStatus.isComplete, onValidationChange]);

  // Load data on mount
  useEffect(() => {
    if (connectorId && jobId) {
      loadData();
    }
  }, [connectorId, jobId]);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Icon name="arrow-path" className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Loading field mappings...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Field Mapping Configuration</h3>
          <Button onClick={saveMappings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Mappings'}
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    validationStatus.isComplete ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${validationStatus.percentage}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {validationStatus.percentage}%
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {validationStatus.mappedCount} of {validationStatus.totalRequired} required fields mapped
            </span>
            {validationStatus.isComplete ? (
              <span className="inline-flex items-center text-green-700">
                <Icon name="check-circle" className="h-4 w-4 mr-1" />
                Ready to proceed
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-600">
                <Icon name="exclamation-triangle" className="h-4 w-4 mr-1" />
                {validationStatus.missingFields.length} missing
              </span>
            )}
          </div>

          {!validationStatus.isComplete && (
            <div className="mt-2 p-3 bg-amber-50 rounded-md border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Missing Required Fields:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {validationStatus.missingFields.map(field => (
                  <li key={field.zenemField} className="flex items-center">
                    <Icon name="arrow-right" className="h-3 w-3 mr-2" />
                    {field.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Field Mapping Interface */}
      <Card>
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search JIRA fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={fieldTypeFilter}
              onChange={(e) => setFieldTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="user">User Fields</option>
              <option value="date">Date Fields</option>
              <option value="string">Text Fields</option>
              <option value="select">Select Fields</option>
              <option value="number">Number Fields</option>
            </select>
            <Button variant="secondary" onClick={loadData}>
              <Icon name="arrow-path" className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Mapping Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source (JIRA)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    →
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target (ZenEM)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {requiredFields.map((field) => {
                  const currentMapping = getCurrentMapping(field.zenemField);
                  const isMapped = !!currentMapping;
                  
                  return (
                    <tr key={field.zenemField} className={field.mandatory ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="w-80">
                          <SingleSelect
                            options={fieldOptions}
                            value={currentMapping?.jiraFieldId || null}
                            onChange={(value) => updateMapping(field.zenemField, value, field.mandatory)}
                            placeholder="Select JIRA field..."
                            searchable
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Icon name="arrow-right" className="h-5 w-5 text-gray-400" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{field.label}</span>
                          {field.mandatory && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{field.zenemField}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            isMapped
                              ? 'bg-green-100 text-green-700'
                              : field.mandatory
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Icon
                            name={isMapped ? 'check-circle' : field.mandatory ? 'exclamation-circle' : 'minus-circle'}
                            className="h-3 w-3 mr-1"
                          />
                          {isMapped ? 'Mapped' : field.mandatory ? 'Required' : 'Optional'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {requiredFields.length === 0 && (
            <div className="text-center py-12">
              <Icon name="document-text" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Available</h3>
              <p className="text-gray-500 mb-4">
                Run field discovery first to see available JIRA fields for mapping.
              </p>
              <Button variant="secondary" onClick={loadData}>
                <Icon name="arrow-path" className="h-4 w-4 mr-2" />
                Check for Fields
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
