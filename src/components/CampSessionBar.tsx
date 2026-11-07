import React, { useState } from 'react';
import {
  TentTree,
  ChevronDown,
  Plus,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  CheckCircle2,
  Settings,
  X,
} from 'lucide-react';
import { MedicalCamp } from '../types/screening';

interface CampSessionBarProps {
  camps: MedicalCamp[];
  activeCamp: MedicalCamp | undefined;
  onSelectActiveCamp: (campId: string) => void;
  onSaveNewCamp: (camp: Omit<MedicalCamp, 'id' | 'createdAt'>) => void;
  onOpenCampAdmin: () => void;
}

export const CampSessionBar: React.FC<CampSessionBarProps> = ({
  camps,
  activeCamp,
  onSelectActiveCamp,
  onSaveNewCamp,
  onOpenCampAdmin,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New camp modal form state
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [organizer, setOrganizer] = useState<string>('Harikrishna Cancer Foundation');
  const [doctorInCharge, setDoctorInCharge] = useState<string>('Dr. S. Shah, MS (Surgical Oncology)');
  const [notes, setNotes] = useState<string>('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    onSaveNewCamp({
      name: name.trim(),
      location: location.trim(),
      date,
      organizer: organizer.trim(),
      doctorInCharge: doctorInCharge.trim(),
      status: 'ACTIVE',
      notes: notes.trim(),
    });

    setIsCreateModalOpen(false);
    // Reset form
    setName('');
    setLocation('');
    setNotes('');
  };

  return (
    <>
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Active Camp Details */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-xs">
              <TentTree className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  Active Medical Camp Session
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  All scans auto-linked
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {activeCamp ? activeCamp.name : 'No Medical Camp Selected'}
              </h2>

              {activeCamp && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[220px] sm:max-w-none">{activeCamp.location}</span>
                  </span>

                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{new Date(activeCamp.date).toLocaleDateString()}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{activeCamp.organizer}</span>
                  </span>

                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{activeCamp.doctorInCharge}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Switcher Dropdown & Create Modal */}
          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            {/* Quick Switch Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
                title="Switch active camp session"
              >
                <span>Switch Camp ({camps.length})</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 p-2 space-y-1">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Select Active Screening Camp
                      </span>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenCampAdmin();
                        }}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Settings className="w-3 h-3" />
                        Manage
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 py-1">
                      {camps.map((c) => {
                        const isSelected = activeCamp?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              onSelectActiveCamp(c.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-slate-900 dark:text-slate-100 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-semibold">{c.name}</span>
                                {isSelected && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {c.location} · {new Date(c.date).toLocaleDateString()}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {c.organizer} · {c.doctorInCharge}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0 ${
                                c.status === 'ACTIVE'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {c.status}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsCreateModalOpen(true);
                        }}
                        className="w-full py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Create New Camp Session</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick New Camp Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              title="Add a new camp session"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Camp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Camp Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TentTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Create Medical Camp Session
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define camp details for auto-tagging all incoming physical scans.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
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
                    Organizer NGO / Trust *
                  </label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Oncologist / Doctor in Charge *
                </label>
                <input
                  type="text"
                  required
                  value={doctorInCharge}
                  onChange={(e) => setDoctorInCharge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Focus Target (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mass screening for agricultural workers with bidi addiction"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  This camp will be set as your <strong>Active Session</strong>. All subsequent form scans will automatically inherit this camp.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors shadow-xs"
                >
                  Create & Activate Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
