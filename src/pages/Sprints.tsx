import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import apiService from '../services/api';
import type { SprintRow } from '../services/api';

export const Sprints: React.FC = () => {
  const [rows, setRows] = useState<SprintRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await apiService.getSprints({ page: 0, size: 20 });
        setRows(resp?.content || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load sprints');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <SidebarLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sprints</h1>
        <p className="mt-2 text-gray-600">List sprints with key metrics (POC read-only).</p>
      </div>
      <Card>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed md:table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-2 md:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-2 md:px-4 py-2 text-sm text-gray-900 break-words">{s.name}</td>
                    <td className="px-2 md:px-4 py-2 text-sm text-gray-700 break-words">{s.teamId}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{s.startDate} → {s.endDate}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{s.status}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{s.completedStoryPoints} / {s.plannedStoryPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="text-gray-500">No sprints found.</p>}
          </div>
        )}
      </Card>
    </SidebarLayout>
  );
};

export default Sprints;


