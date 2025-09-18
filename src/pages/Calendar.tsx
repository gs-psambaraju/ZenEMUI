import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { IconButton, Icon } from '../components/ui/Icon';
import { ContextualRefreshButton } from '../components/refresh/ContextualRefreshButton';
import apiService from '../services/api';
import type { CalendarEventResponse, Teammate } from '../types';

const parseQuery = (search: string) => Object.fromEntries(new URLSearchParams(search));

// Helper function to get local ISO string (avoids timezone issues)
const getLocalISOString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Dynamic leave types from backend
type LeaveTypeMeta = { code: string; displayName: string; description?: string; isPrimary: boolean };

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const q = useMemo(() => parseQuery(location.search), [location.search]);

  const today = new Date();
  const initialYear = q.year ? parseInt(q.year) : today.getFullYear();
  const initialMonth = q.month ? parseInt(q.month) : today.getMonth() + 1; // 1-12

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalendarEventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDayIso, setOpenDayIso] = useState<string | null>(null);
  // Quick add leave
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [leaveType, setLeaveType] = useState<string>('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [savingLeave, setSavingLeave] = useState(false);
  const [leaveTeammateId, setLeaveTeammateId] = useState<string>('');
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeMeta[]>([]);
  const [selectedTeammate, setSelectedTeammate] = useState<Teammate | null>(null);
  const [teammateSearchTerm, setTeammateSearchTerm] = useState('');
  const [searchedTeammates, setSearchedTeammates] = useState<Teammate[]>([]);
  const [loadingTeammates, setLoadingTeammates] = useState(false);

  // Search teammates with debounce
  useEffect(() => {
    if (teammateSearchTerm.length < 2) {
      setSearchedTeammates([]);
      return;
    }

    const searchTeammates = async () => {
      setLoadingTeammates(true);
      try {
        const response = await apiService.getTeammates({
          search: teammateSearchTerm,
          size: 10
        });
        setSearchedTeammates(response.content);
      } catch (error) {
        console.error('Failed to search teammates:', error);
        setSearchedTeammates([]);
      } finally {
        setLoadingTeammates(false);
      }
    };

    const debounceTimer = setTimeout(searchTeammates, 300);
    return () => clearTimeout(debounceTimer);
  }, [teammateSearchTerm]);

  // Reset teammate selection when modal opens
  useEffect(() => {
    if (showAddLeave) {
      setSelectedTeammate(null);
      setTeammateSearchTerm('');
      setLeaveTeammateId('');
    }
  }, [showAddLeave]);

  const filters = useMemo(() => ({
    teamId: q.teamId || undefined,
    teamMemberId: q.teamMemberId || undefined,
    projectId: q.projectId || undefined,
  }), [q.teamId, q.teamMemberId, q.projectId]);

  const updateUrl = (y: number, m: number) => {
    const params = new URLSearchParams({ year: String(y), month: String(m) });
    if (filters.teamId) params.set('teamId', filters.teamId);
    if (filters.teamMemberId) params.set('teamMemberId', filters.teamMemberId);
    if (filters.projectId) params.set('projectId', filters.projectId);
    navigate({ pathname: '/calendar', search: `?${params.toString()}` }, { replace: true });
  };

  const fetchMonth = async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getCalendarMonth(y, m, filters);
      setEvents(data);
      // Prefetch prev/next in background (best-effort)
      const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
      const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
      void apiService.getCalendarMonth(prev.y, prev.m, filters);
      void apiService.getCalendarMonth(next.y, next.m, filters);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setYear(initialYear);
    setMonth(initialMonth);
    fetchMonth(initialYear, initialMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Load leave types once
  useEffect(() => {
    let isMounted = true;
    apiService.getLeaveTypes()
      .then((types) => { if (isMounted) setLeaveTypes(types); })
      .catch((err) => console.error('Failed to load leave types', err));
    return () => { isMounted = false; };
  }, []);

  // Ensure selected leave type matches loaded list (prefer a primary type)
  useEffect(() => {
    if (!leaveTypes.length) return;
    const exists = leaveTypes.some(t => t.code === leaveType);
    if (!exists) {
      const preferred = leaveTypes.find(t => t.isPrimary) || leaveTypes[0];
      setLeaveType(preferred.code);
    }
  }, [leaveTypes]);

  const startOfMonth = new Date(year, month - 1, 1);
  const firstDayMondayIndex = (startOfMonth.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: Array<{ date: Date; iso: string }> = [];
  // Build grid with leading blanks to Monday start
  for (let i = 0; i < firstDayMondayIndex; i++) {
    const d = new Date(startOfMonth);
    d.setDate(d.getDate() - (firstDayMondayIndex - i));
    days.push({ date: d, iso: getLocalISOString(d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    days.push({ date, iso: getLocalISOString(date) });
  }
  // trailing to complete 42 cells (6 weeks)
  while (days.length % 7 !== 0 || days.length < 42) {
    const last = days[days.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    days.push({ date: next, iso: getLocalISOString(next) });
  }

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEventResponse[]> = {};
    for (const ev of events) {
      const start = new Date(ev.eventDate + 'T00:00:00'); // Ensure local date interpretation
      const end = ev.endDate ? new Date(ev.endDate + 'T00:00:00') : start;
      const cur = new Date(start);
      while (cur <= end) {
        const iso = getLocalISOString(cur);
        if (!map[iso]) map[iso] = [];
        // Holidays as individual day pills (no spanning bars)
        map[iso].push(ev);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  const colorFor = (t: string) => {
    switch (t) {
      case 'LEAVE': return 'bg-red-100 text-red-700';
      case 'HOLIDAY': return 'bg-yellow-100 text-yellow-800';
      case 'SPRINT_START':
      case 'SPRINT_END': return 'bg-blue-100 text-blue-800';
      case 'PROJECT_START':
      case 'PROJECT_DEADLINE':
      case 'PROJECT_MILESTONE': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const goPrev = () => {
    const y = month === 1 ? year - 1 : year;
    const m = month === 1 ? 12 : month - 1;
    setYear(y); setMonth(m); updateUrl(y, m);
  };
  const goNext = () => {
    const y = month === 12 ? year + 1 : year;
    const m = month === 12 ? 1 : month + 1;
    setYear(y); setMonth(m); updateUrl(y, m);
  };

  return (
    <SidebarLayout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <div className="flex items-center space-x-2">
          <ContextualRefreshButton
            context="calendar"
            suggestedTargets={['CALENDAR']}
            label="Refresh Events"
          />
          <IconButton icon="arrow-left" variant="ghost" onClick={goPrev} title="Previous month" />
          <IconButton icon="arrow-right" variant="ghost" onClick={goNext} title="Next month" />
        </div>
      </div>
      <div className="mb-4 text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm text-lg font-semibold text-gray-900">
          {new Date(year, month - 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <Card>
        {loading && <p className="p-4 text-gray-600">Loading…</p>}
        {error && <p className="p-4 text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="p-3">
            <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-500 mb-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="px-2 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map(({ date, iso }, idx) => {
                const inMonth = date.getMonth() + 1 === month;
                const dayEvents = eventsByDay[iso] || [];
                const visible = dayEvents.slice(0, 2);
                const overflow = dayEvents.length - visible.length;
                return (
                  <div
                    key={idx}
                    className={`group relative border rounded-md p-2 min-h-[90px] ${inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'} hover:border-blue-300 cursor-pointer`}
                    onClick={() => setOpenDayIso(openDayIso === iso ? null : iso)}
                  >
                    <div className="text-xs font-medium mb-1">{date.getDate()}</div>
                    {inMonth && (
                      <button
                        className="hidden group-hover:flex absolute right-1 top-1 h-5 w-5 items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                        onClick={(e) => { e.stopPropagation(); setLeaveStart(iso); setLeaveEnd(iso); setLeaveTeammateId((filters.teamMemberId as string) || ''); setShowAddLeave(true); }}
                        aria-label="Add leave"
                        title="Add leave"
                      >
                        +
                      </button>
                    )}
                    <div className="space-y-1">
                      {visible.map((ev, i) => (
                        <div key={i} className={`px-2 py-1 rounded ${colorFor(ev.eventType)} cursor-pointer group`} title={ev.title}>
                          <div className="flex items-center space-x-1">
                            <Icon name="calendar" className="h-3 w-3" />
                            <span className="truncate block text-xs">{ev.title}</span>
                          </div>
                          {/* simple hover popover */}
                          <div className="hidden group-hover:block absolute z-10 mt-1 w-64 bg-white border border-gray-200 shadow-md rounded p-2 text-xs text-gray-700">
                            <div className="font-medium text-gray-900 mb-1">{ev.title}</div>
                            <div className="text-gray-600 mb-1">
                              {ev.eventDate}{ev.endDate ? ` - ${ev.endDate}` : ''}
                            </div>
                            <div className="text-gray-600 capitalize">{ev.eventType.replace(/_/g,' ').toLowerCase()}</div>
                          </div>
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div className="text-xs text-blue-600 cursor-pointer">+{overflow} more</div>
                      )}
                    </div>

                    {openDayIso === iso && (
                      <div className="absolute left-2 top-8 z-20 w-64 bg-white border border-gray-200 shadow-lg rounded-md p-2 text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="font-medium text-gray-900 mb-2">{iso}</div>
                        {(eventsByDay[iso] || []).length === 0 && (
                          <div className="text-xs text-gray-500 mb-2">No events</div>
                        )}
                        <div className="space-y-1 max-h-40 overflow-y-auto mb-2">
                          {(eventsByDay[iso] || []).map((ev, i) => (
                            <div key={i} className={`px-2 py-1 rounded ${colorFor(ev.eventType)} text-xs`}>{ev.title}</div>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <button className="text-xs text-blue-600 hover:text-blue-800" onClick={() => { setLeaveStart(iso); setLeaveEnd(iso); setLeaveTeammateId((filters.teamMemberId as string) || ''); setShowAddLeave(true); }}>Add Leave</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Quick Add Leave Modal */}
      <Modal isOpen={showAddLeave} onClose={() => setShowAddLeave(false)} title="Add Leave" size="md">
        <div className="space-y-4">
          {!filters.teamMemberId && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Select Teammate</label>
              <div className="relative">
                <Input
                  placeholder="Type teammate name to search..."
                  value={selectedTeammate ? selectedTeammate.name : teammateSearchTerm}
                  onChange={(e) => {
                    if (selectedTeammate) {
                      // If teammate was selected, clear selection to allow new search
                      setSelectedTeammate(null);
                      setTeammateSearchTerm(e.target.value);
                    } else {
                      setTeammateSearchTerm(e.target.value);
                    }
                  }}
                />
                
                {/* Search results dropdown */}
                {teammateSearchTerm.length >= 2 && !selectedTeammate && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {loadingTeammates ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                    ) : searchedTeammates.length > 0 ? (
                      searchedTeammates.map(teammate => (
                        <button
                          key={teammate.id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                          onClick={() => {
                            setSelectedTeammate(teammate);
                            setLeaveTeammateId(teammate.id);
                            setTeammateSearchTerm('');
                          }}
                        >
                          <div className="font-medium text-gray-900">{teammate.name}</div>
                          <div className="text-xs text-gray-500">{teammate.email}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No teammates found</div>
                    )}
                  </div>
                )}
              </div>
              
              {selectedTeammate && (
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-blue-900">{selectedTeammate.name}</div>
                    <div className="text-xs text-blue-700">{selectedTeammate.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeammate(null);
                      setLeaveTeammateId('');
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Icon name="x-mark" className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Search and select a teammate, or leave blank to use current teammate filter
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700">Start</label>
              <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm text-gray-700">End</label>
              <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700">Leave Type</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" disabled={!leaveTypes.length}>
              {leaveTypes
                .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.displayName.localeCompare(b.displayName))
                .map(t => (
                  <option key={t.code} value={t.code}>{t.displayName}</option>
                ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddLeave(false)}>Cancel</Button>
            <Button onClick={async () => {
              setSavingLeave(true);
              try {
                const targetId = leaveTeammateId || (filters.teamMemberId as string);
                if (!targetId) {
                  alert('Please select a teammate or navigate to a specific teammate page.');
                  return;
                }
                await apiService.createTeammateLeave(targetId, {
                  leaveType: leaveType as any,
                  startDate: leaveStart,
                  endDate: leaveEnd || leaveStart,
                  description: 'Added from calendar',
                } as any);
                setShowAddLeave(false);
                setOpenDayIso(null);
                fetchMonth(year, month);
              } catch (error) {
                alert('Failed to create leave. Please try again.');
                console.error('Failed to create leave:', error);
              } finally { setSavingLeave(false); }
            }} disabled={savingLeave || (!filters.teamMemberId && !selectedTeammate)}>{savingLeave ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
};

export default Calendar;


