import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import apiService from '../services/api';
import type { HolidayCalendar, Holiday, CreateHolidayRequest } from '../types';

export const AdminHolidayCalendarDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState<HolidayCalendar | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [form, setForm] = useState<CreateHolidayRequest>({ name: '', holidayDate: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    setIsLoading(true); setError(null);
    try {
      const details = await apiService.getHolidayCalendarDetails(id);
      const list = await apiService.getHolidaysInCalendar(id, { year: new Date().getFullYear() });
      setCalendar(details);
      setHolidays(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const openAdd = () => { setForm({ name: '', holidayDate: '' }); setShowAdd(true); };
  const openEdit = (h: Holiday) => { setEditingHoliday(h); setForm({ name: h.name, holidayDate: h.holidayDate, isRecurring: h.isRecurring, recurringMonth: h.recurringMonth, recurringDay: h.recurringDay, description: h.description }); };

  const submitAdd = async () => {
    if (!id) return; setSaving(true);
    try { await apiService.addHolidayToCalendar(id, form); setShowAdd(false); fetchAll(); } finally { setSaving(false); }
  };
  const submitEdit = async () => {
    if (!id || !editingHoliday) return; setSaving(true);
    try { await apiService.updateHoliday(id, editingHoliday.id, form); setEditingHoliday(null); fetchAll(); } finally { setSaving(false); }
  };
  const onDelete = async (h: Holiday) => {
    if (!id) return; if (!confirm(`Delete holiday '${h.name}'?`)) return;
    await apiService.deleteHoliday(id, h.id); fetchAll();
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <Card><div className="p-6 text-gray-600">Loading…</div></Card>
      </SidebarLayout>
    );
  }
  if (error || !calendar) {
    return (
      <SidebarLayout>
        <Card><div className="p-6 text-red-600">{error || 'Calendar not found'}</div></Card>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{calendar.name}</h1>
          <p className="text-gray-600">Region: {calendar.region}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/admin/holiday-calendars')}>Back</Button>
          <Button onClick={openAdd}>Add Holiday</Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{h.holidayDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{h.isRecurring ? `Yes (${h.recurringMonth}/${h.recurringDay})` : 'No'}</td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button onClick={() => openEdit(h)} className="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => onDelete(h)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {holidays.length === 0 && (
            <div className="p-8 text-center text-gray-500">No holidays defined</div>
          )}
        </div>
      </Card>

      {/* Add Holiday */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Holiday" size="md">
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Date (YYYY-MM-DD)" value={form.holidayDate} onChange={(e) => setForm({ ...form, holidayDate: e.target.value })} />
          <div className="flex items-center space-x-3">
            <label className="text-sm text-gray-700">Recurring</label>
            <input type="checkbox" checked={!!form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />
            <Input placeholder="Month" value={form.recurringMonth?.toString() || ''} onChange={(e) => setForm({ ...form, recurringMonth: Number(e.target.value) || undefined })} />
            <Input placeholder="Day" value={form.recurringDay?.toString() || ''} onChange={(e) => setForm({ ...form, recurringDay: Number(e.target.value) || undefined })} />
          </div>
          <Input label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={submitAdd} disabled={saving}>{saving ? 'Saving…' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Holiday */}
      <Modal isOpen={!!editingHoliday} onClose={() => setEditingHoliday(null)} title="Edit Holiday" size="md">
        {editingHoliday && (
          <div className="space-y-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Date (YYYY-MM-DD)" value={form.holidayDate} onChange={(e) => setForm({ ...form, holidayDate: e.target.value })} />
            <div className="flex items-center space-x-3">
              <label className="text-sm text-gray-700">Recurring</label>
              <input type="checkbox" checked={!!form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />
              <Input placeholder="Month" value={form.recurringMonth?.toString() || ''} onChange={(e) => setForm({ ...form, recurringMonth: Number(e.target.value) || undefined })} />
              <Input placeholder="Day" value={form.recurringDay?.toString() || ''} onChange={(e) => setForm({ ...form, recurringDay: Number(e.target.value) || undefined })} />
            </div>
            <Input label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingHoliday(null)}>Cancel</Button>
              <Button onClick={submitEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </SidebarLayout>
  );
};

export default AdminHolidayCalendarDetail;


