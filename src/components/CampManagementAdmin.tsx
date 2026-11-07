import React, { useState } from 'react';
import {
  TentTree,
  Plus,
  Search,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  CheckCircle2,
  Edit2,
  Trash2,
  Play,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Activity,
  FileCheck2,
} from 'lucide-react';
import { MedicalCamp, ScreeningRecord } from '../types/screening';

interface CampManagementAdminProps {
  camps: MedicalCamp[];
  setCamps: React.Dispatch<React.SetStateAction<MedicalCamp[]>>;
  activeCampId: string;
  onSelectActiveCamp: (campId: string) => void;
  records: ScreeningRecord[];
}

export const CampManagementAdmin: React.FC<CampManagementAdminProps> = ({
  camps,
  setCamps,
  activeCampId,
  onSelectActiveCamp,
  records,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [editingCamp, setEditingCamp] = useState<MedicalCamp | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [organizer, setOrganizer] = useState<string>('Harikrishna Cancer Foundation');
  const [doctorInCharge, setDoctorInCharge] = useState<string>('Dr. S. Shah, MS (Surgical Oncology)');
  const [status, setStatus] = useState<'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ACTIVE');
  const [notes, setNotes] = useState<string>('');

  const handleStartEdit = (camp: MedicalCamp) => {
    setEditingCamp(camp);
    setIsAddingNew(false);
    setName(camp.name);
    setLocation(camp.location);
    setDate(camp.date);
    setOrganizer(camp.organizer);
    setDoctorInCharge(camp.doctorInCharge);
    setStatus(camp.status);
    setNotes(camp.notes || '');
  };

  const handleStartAdd = () => {
    setEditingCamp(null);
    setIsAddingNew(true);
    setName('');
    setLocation('');
    setDate(new Date().toISOString().slice(0, 10));
    setOrganizer('Harikrishna Cancer Foundation');
    setDoctorInCharge('Dr. S. Shah, MS (Surgical Oncology)');
    setStatus('ACTIVE');
    setNotes('');
  };

  const handleSaveCamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    if (isAddingNew) {
      const newCamp: MedicalCamp = {
        id: `camp-${Date.now()}`,
        name: name.trim(),
        location: location.trim(),
        date,
        organizer: organizer.trim(),
        doctorInCharge: doctorInCharge.trim(),
        status,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
      setCamps((prev) => [newCamp, ...prev]);
      if (status === 'ACTIVE' || camps.length === 0) {
        onSelectActiveCamp(newCamp.id);
      }
      setIsAddingNew(false);
    } else if (editingCamp) {
      setCamps((prev) =>
        prev.map((c) =>
          c.id === editingCamp.id
            ? {
                ...c,
                name: name.trim(),
                location: location.trim(),
                date,
                organizer: organizer.trim(),
                doctorInCharge: doctorInCharge.trim(),
                status,
                notes: notes.trim(),
              }
            : c
        )
      );
      setEditingCamp(null);
    }
  };

  const handleDeleteCamp = (campId: string) => {
    if (window.confirm('Are you sure you want to delete this camp? Existing screening records will retain historical data.')) {
      setCamps((prev) => prev.filter((c) => c.id !== campId));
      if (activeCampId === campId && camps.length > 1) {
        const remaining = camps.filter((c) => c.id !== campId);
        onSelectActiveCamp(remaining[0].id);
      }
    }
  };

  // Filtered camps
  const filteredCamps = camps.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.doctorInCharge.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Action */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
              Operations & Logistics
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">
              {camps.length} Medical Camps Registered
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-0.5">
            <TentTree className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Medical Camp Directory & Active Sessions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure screening camps with dates, organizers, and oncologists. The chosen active camp session automatically tags every digitized questionnaire.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medical Camp</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search camp name, venue, city, doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Camps ({camps.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('UPCOMING')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              statusFilter === 'UPCOMING'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              statusFilter === 'COMPLETED'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Camp Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCamps.map((camp) => {
          const isActiveSession = activeCampId === camp.id;
          // Calculate stats for this camp
          const campRecords = records.filter(
            (r) => r.campId === camp.id || r.campLocation === camp.location || (r.campName && r.campName === camp.name)
          );
          const totalScreened = campRecords.length;
          const highRiskCount = campRecords.filter((r) => r.riskBand === 'HIGH_RISK').length;
          const lowRiskCount = campRecords.filter((r) => r.riskBand === 'LOW_RISK').length;

          return (
            <div
              key={camp.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-xs ${
                isActiveSession
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-700 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isActiveSession ? (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" /> Active Session
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : camp.status === 'UPCOMING'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {camp.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => handleStartEdit(camp)}
                      className="p-1 hover:text-slate-900 dark:hover:text-slate-100 rounded"
                      title="Edit camp details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCamp(camp.id)}
                      className="p-1 hover:text-rose-600 rounded"
                      title="Delete camp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {camp.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{camp.location}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Date:</span>
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {new Date(camp.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Organizer:</span>
                    <span className="truncate max-w-[170px] text-right font-medium text-slate-700 dark:text-slate-300">
                      {camp.organizer}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Oncologist:</span>
                    <span className="truncate max-w-[170px] text-right font-medium text-slate-700 dark:text-slate-300">
                      {camp.doctorInCharge}
                    </span>
                  </div>
                </div>

                {/* Screening Stats Preview */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Screened</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {totalScreened}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-500 block uppercase">High Risk</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {highRiskCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-500 block uppercase">Low Risk</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {lowRiskCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                {isActiveSession ? (
                  <div className="w-full py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 rounded-xl flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Current Active Session</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectActiveCamp(camp.id)}
                    className="w-full py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Set as Active Session</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Camp Modal */}
      {(isAddingNew || editingCamp) && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TentTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {isAddingNew ? 'Register New Medical Camp' : 'Edit Medical Camp Details'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure dates, venue, and medical leadership.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingCamp(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCamp} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medical Camp Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Community Oncology Screening Camp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Venue / City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary Health Centre, Anand, Gujarat"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Camp Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Camp Operational Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">ACTIVE (Accepting Scans)</option>
                    <option value="UPCOMING">UPCOMING (Scheduled)</option>
                    <option value="COMPLETED">COMPLETED (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organizer NGO / Foundation *
                  </label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Doctor in Charge / Oncologist *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorInCharge}
                    onChange={(e) => setDoctorInCharge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Clinical Focus
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on factory workers, tobacco chewers, and gynecological screening"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingCamp(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors shadow-xs"
                >
                  {isAddingNew ? 'Create Medical Camp' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
