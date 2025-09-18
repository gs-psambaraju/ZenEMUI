import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import apiService from '../../services/api';

interface Props {
  teamId: string;
  onClose: () => void;
}

export const AssignCalendars: React.FC<Props> = ({ teamId, onClose }) => {
  const [available, setAvailable] = useState<Array<{ id: string; name: string; region: string }>>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const page = await apiService.getHolidayCalendars({ page: 0, size: 200 });
      const team = await apiService.getTeamHolidayCalendars(teamId);
      setAvailable(page.content.map(c => ({ id: c.id, name: c.name, region: c.region })));
      setAssigned(team.assignedCalendars.map(c => c.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [teamId]);

  const toggle = (id: string) => {
    setAssigned(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiService.assignHolidayCalendarsToTeam(teamId, { calendarIds: assigned });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-gray-600">Loading…</div>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Available Calendars</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {available.map((c) => (
              <label key={c.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-600">Region: {c.region}</div>
                </div>
                <input type="checkbox" checked={assigned.includes(c.id)} onChange={() => toggle(c.id)} />
              </label>
            ))}
          </div>
        </div>
      </Card>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </div>
  );
};

export default AssignCalendars;


