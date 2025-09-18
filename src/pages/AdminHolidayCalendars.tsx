import React, { useEffect, useMemo, useState } from 'react';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import apiService from '../services/api';
import type { HolidayCalendar, CreateHolidayCalendarRequest, UpdateHolidayCalendarRequest } from '../types';

export const AdminHolidayCalendars: React.FC = () => {
  const [calendars, setCalendars] = useState<HolidayCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<HolidayCalendar | null>(null);
  const [form, setForm] = useState<CreateHolidayCalendarRequest>({ name: '', region: '', description: '' });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() =>
    calendars.filter(c =>
      (!search || c.name.toLowerCase().includes(search.toLowerCase())) &&
      (!regionFilter || c.region === regionFilter)
    ), [calendars, search, regionFilter]);

  const fetchCalendars = async () => {
    setIsLoading(true); setError(null);
    try {
      const page = await apiService.getHolidayCalendars({ page: 0, size: 200 });
      setCalendars(page.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendars');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCalendars(); }, []);

  const openCreate = () => { setForm({ name: '', region: '', description: '' }); setShowCreate(true); };
  const openEdit = (c: HolidayCalendar) => { setEditing(c); setForm({ name: c.name, region: c.region, description: c.description }); setShowEdit(true); };

  const submitCreate = async () => {
    setSaving(true);
    try { await apiService.createHolidayCalendar(form); setShowCreate(false); fetchCalendars(); } finally { setSaving(false); }
  };
  const submitEdit = async () => {
    if (!editing) return; setSaving(true);
    try { await apiService.updateHolidayCalendar(editing.id, form as UpdateHolidayCalendarRequest); setShowEdit(false); fetchCalendars(); } finally { setSaving(false); }
  };
  const onDelete = async (c: HolidayCalendar) => {
    if (!confirm(`Delete calendar '${c.name}'?`)) return;
    await apiService.deleteHolidayCalendar(c.id); fetchCalendars();
  };

  return (
    <SidebarLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holiday Calendars</h1>
          <p className="text-gray-600">Create calendars and manage regional holidays</p>
        </div>
        <Button onClick={openCreate}>Create Calendar</Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Input placeholder="Filter by region (e.g. US, IN)" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} />
        </div>
        {isLoading && <p className="p-4 text-gray-600">Loading…</p>}
        {error && <p className="p-4 text-red-600">{error}</p>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holidays</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.region}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.holidayCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800">Edit</button>
                      <button onClick={() => onDelete(c)} className="text-red-600 hover:text-red-800">Delete</button>
                      <button onClick={() => window.location.assign(`/admin/holiday-calendars/${c.id}`)} className="text-gray-600 hover:text-gray-800">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-500">No calendars found</div>
            )}
          </div>
        )}
      </Card>

      {/* Create */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Holiday Calendar" size="md">
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          <Input label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submitCreate} disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Holiday Calendar" size="md">
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          <Input label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={submitEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
};

export default AdminHolidayCalendars;


