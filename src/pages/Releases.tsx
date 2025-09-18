import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import apiService from '../services/api';
import type { ReleaseRow } from '../services/api';

export const Releases: React.FC = () => {
  const [rows, setRows] = useState<ReleaseRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const toDate = new Date();
    toDate.setDate(today.getDate() + 90);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await apiService.getReleases({ from: fmt(today), to: fmt(toDate) });
        setRows(resp);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load releases');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <SidebarLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Releases</h1>
        <p className="mt-2 text-gray-600">Upcoming and recent releases (POC read-only).</p>
      </div>
      <Card>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed md:table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Release</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Release</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="hidden md:table-cell px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-2 md:px-4 py-2 text-sm text-gray-900 break-words">{r.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{r.plannedReleaseDate || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{r.actualReleaseDate || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{r.status}</td>
                    <td className="hidden md:table-cell px-4 py-2 text-sm text-gray-700">{r.healthStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="text-gray-500">No releases in window.</p>}
          </div>
        )}
      </Card>
    </SidebarLayout>
  );
};

export default Releases;


