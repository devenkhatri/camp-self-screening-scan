import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Eye,
  TrendingUp,
  PieChart as PieChartIcon,
  ShieldAlert,
  Users,
  Activity,
  Calendar,
  X,
  Building2,
  BarChart2,
  Flame,
  ArrowUpRight,
  Stethoscope,
  Target,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import { ScreeningRecord, RiskBand, MedicalCamp } from '../types/screening';
import { RISK_BANDS_GUIDANCE } from '../data/screeningData';

export interface CampPerformanceMetric {
  campId: string;
  campName: string;
  shortName: string;
  location: string;
  date: string;
  doctorInCharge: string;
  organizer: string;
  totalScreened: number;
  highRiskCount: number;
  lowRiskCount: number;
  noRiskCount: number;
  highRiskPct: number;
  lowRiskPct: number;
  noRiskPct: number;
  avgScore: number;
  prevalenceTier: 'CRITICAL_HIGH' | 'MODERATE' | 'LOW';
}

interface ScreeningHistoryLogProps {
  records: ScreeningRecord[];
  camps?: MedicalCamp[];
  onSelectRecord?: (record: ScreeningRecord) => void;
  defaultTab?: 'performance' | 'log';
}

export const ScreeningHistoryLog: React.FC<ScreeningHistoryLogProps> = ({
  records,
  camps = [],
  defaultTab = 'log',
}) => {
  const [dashboardTab, setDashboardTab] = useState<'performance' | 'log'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBand, setSelectedBand] = useState<'ALL' | RiskBand>('ALL');
  const [selectedCampId, setSelectedCampId] = useState<'ALL' | string>('ALL');
  const [activeModalRecord, setActiveModalRecord] = useState<ScreeningRecord | null>(null);

  // Compute Camp Performance Analytics & Risk Distribution per Camp
  const campPerformanceStats = useMemo<CampPerformanceMetric[]>(() => {
    const campMap = new Map<
      string,
      {
        campId: string;
        campName: string;
        location: string;
        date: string;
        doctorInCharge: string;
        organizer: string;
      }
    >();

    // Seed from known registered camps
    camps.forEach((c) => {
      campMap.set(c.id, {
        campId: c.id,
        campName: c.name,
        location: c.location,
        date: c.date,
        doctorInCharge: c.doctorInCharge,
        organizer: c.organizer,
      });
    });

    // Capture any additional camps directly referenced in records
    records.forEach((r) => {
      const id = r.campId || r.campName || 'unassigned-camp';
      if (!campMap.has(id)) {
        campMap.set(id, {
          campId: id,
          campName: r.campName || r.campLocation || 'Community Screening Camp',
          location: r.campLocation || 'Gujarat',
          date: r.timestamp.slice(0, 10),
          doctorInCharge: r.reviewedBy || 'Attending Oncologist',
          organizer: 'Community Health Trust',
        });
      }
    });

    const metrics: CampPerformanceMetric[] = Array.from(campMap.values()).map((camp) => {
      const matching = records.filter(
        (r) =>
          r.campId === camp.campId ||
          (r.campName && r.campName === camp.campName) ||
          (r.campLocation && r.campLocation === camp.location)
      );

      const totalScreened = matching.length;
      const highRiskCount = matching.filter((r) => r.riskBand === 'HIGH_RISK').length;
      const lowRiskCount = matching.filter((r) => r.riskBand === 'LOW_RISK').length;
      const noRiskCount = matching.filter((r) => r.riskBand === 'NO_RISK').length;

      const highRiskPct = totalScreened > 0 ? Math.round((highRiskCount / totalScreened) * 100) : 0;
      const lowRiskPct = totalScreened > 0 ? Math.round((lowRiskCount / totalScreened) * 100) : 0;
      const noRiskPct = totalScreened > 0 ? Math.round((noRiskCount / totalScreened) * 100) : 0;

      const totalScoreSum = matching.reduce((sum, r) => sum + (r.totalScore || 0), 0);
      const avgScore = totalScreened > 0 ? Number((totalScoreSum / totalScreened).toFixed(2)) : 0;

      // Clean short label for Recharts axes
      let shortName = camp.campName;
      if (shortName.includes('Mehsana')) shortName = 'Mehsana Camp';
      else if (shortName.includes('Ahmedabad')) shortName = 'Ahmedabad Camp';
      else if (shortName.includes('Surat')) shortName = 'Surat Camp';
      else if (shortName.length > 20) shortName = shortName.slice(0, 18) + '...';

      let prevalenceTier: 'CRITICAL_HIGH' | 'MODERATE' | 'LOW' = 'LOW';
      if (highRiskPct >= 28 || avgScore >= 2.5) {
        prevalenceTier = 'CRITICAL_HIGH';
      } else if (highRiskPct >= 15 || avgScore >= 1.5) {
        prevalenceTier = 'MODERATE';
      }

      return {
        ...camp,
        shortName,
        totalScreened,
        highRiskCount,
        lowRiskCount,
        noRiskCount,
        highRiskPct,
        lowRiskPct,
        noRiskPct,
        avgScore,
        prevalenceTier,
      };
    });

    // Sort by high-risk rate and avg score descending to highlight oncology hotspots first
    return metrics.sort((a, b) => b.highRiskPct - a.highRiskPct || b.avgScore - a.avgScore);
  }, [camps, records]);

  // Identify highest prevalence hotspot camp for oncologist attention
  const highestRiskCamp = useMemo(() => {
    return (
      campPerformanceStats.find((c) => c.totalScreened > 0 && c.prevalenceTier === 'CRITICAL_HIGH') ||
      campPerformanceStats.find((c) => c.totalScreened > 0) ||
      campPerformanceStats[0]
    );
  }, [campPerformanceStats]);

  // Filter records by selected medical camp first
  const campFilteredRecords = useMemo(() => {
    if (selectedCampId === 'ALL') return records;
    const targetCamp = camps.find((c) => c.id === selectedCampId);
    return records.filter(
      (r) =>
        r.campId === selectedCampId ||
        (targetCamp && (r.campName === targetCamp.name || r.campLocation === targetCamp.location))
    );
  }, [records, selectedCampId, camps]);

  // High-level summary metrics (scoped to selected camp)
  const totalCount = campFilteredRecords.length;
  const highRiskCount = useMemo(() => campFilteredRecords.filter((r) => r.riskBand === 'HIGH_RISK').length, [campFilteredRecords]);
  const lowRiskCount = useMemo(() => campFilteredRecords.filter((r) => r.riskBand === 'LOW_RISK').length, [campFilteredRecords]);
  const noRiskCount = useMemo(() => campFilteredRecords.filter((r) => r.riskBand === 'NO_RISK').length, [campFilteredRecords]);

  const highRiskPct = totalCount > 0 ? Math.round((highRiskCount / totalCount) * 100) : 0;
  const lowRiskPct = totalCount > 0 ? Math.round((lowRiskCount / totalCount) * 100) : 0;
  const noRiskPct = totalCount > 0 ? Math.round((noRiskCount / totalCount) * 100) : 0;

  // Screening Trends over Time (grouped by date for selected camp)
  const trendData = useMemo(() => {
    if (campFilteredRecords.length === 0) return [];

    const map = new Map<
      string,
      { date: string; rawTimestamp: number; highRisk: number; lowRisk: number; noRisk: number; total: number }
    >();

    // Sort chronologically
    const sorted = [...campFilteredRecords].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach((rec) => {
      const d = new Date(rec.timestamp);
      const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: dateKey,
          rawTimestamp: dayStart,
          highRisk: 0,
          lowRisk: 0,
          noRisk: 0,
          total: 0,
        });
      }

      const entry = map.get(dateKey)!;
      entry.total += 1;
      if (rec.riskBand === 'HIGH_RISK') {
        entry.highRisk += 1;
      } else if (rec.riskBand === 'LOW_RISK') {
        entry.lowRisk += 1;
      } else {
        entry.noRisk += 1;
      }
    });

    return Array.from(map.values());
  }, [campFilteredRecords]);

  // Cohort Risk Distribution for Donut Chart
  const riskDistribution = useMemo(() => {
    return [
      { name: 'High Risk (Score ≥ 4)', value: highRiskCount, color: '#e11d48' },
      { name: 'Low Risk (Score 1–3)', value: lowRiskCount, color: '#f59e0b' },
      { name: 'No Risk (Score 0)', value: noRiskCount, color: '#10b981' },
    ];
  }, [highRiskCount, lowRiskCount, noRiskCount]);

  // Filter records for table view
  const filteredRecords = useMemo(() => {
    return campFilteredRecords.filter((rec) => {
      const matchesSearch =
        (rec.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.patientId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.campLocation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.campName || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBand = selectedBand === 'ALL' || rec.riskBand === selectedBand;
      return matchesSearch && matchesBand;
    });
  }, [campFilteredRecords, searchQuery, selectedBand]);

  // Export to CSV
  const handleExportCsv = () => {
    if (records.length === 0) return;

    const headers = [
      'Record ID',
      'Camp Name',
      'Patient ID',
      'Patient Name',
      'Age',
      'Gender',
      'Camp Location',
      'Date',
      'Time',
      'Total Score',
      'Risk Band',
      'Clinical Advice',
      'Suggested Tests',
      'Reviewer',
      'Source File',
      'Came From Scan',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((r) => {
      const d = new Date(r.timestamp);
      const dateStr = d.toLocaleDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const adviceStr = (r.clinicalAdvice || []).join('; ');
      const testsStr = (r.suggestedTests || []).join('; ');

      return [
        escapeCsv(r.id),
        escapeCsv(r.campName || r.campLocation || 'Standard Camp'),
        escapeCsv(r.patientId || 'UNASSIGNED'),
        escapeCsv(r.patientName || 'Anonymous Participant'),
        escapeCsv(r.patientAge || ''),
        escapeCsv(r.patientGender || ''),
        escapeCsv(r.campLocation || ''),
        escapeCsv(dateStr),
        escapeCsv(timeStr),
        escapeCsv(r.totalScore),
        escapeCsv(r.riskBand),
        escapeCsv(adviceStr),
        escapeCsv(testsStr),
        escapeCsv(r.reviewedBy),
        escapeCsv(r.fileName),
        escapeCsv('YES'),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `camp_screening_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
              Epidemiology & Triage Analytics
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">
              {camps.length} Camps · {records.length} Screenings
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5 mt-0.5">
            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Camp Risk Analytics & Audit Log
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDashboardTab('performance')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                dashboardTab === 'performance'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <span>Camp Performance ({campPerformanceStats.length})</span>
            </button>

            <button
              onClick={() => setDashboardTab('log')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                dashboardTab === 'log'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Screening Log ({campFilteredRecords.length})</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="hidden sm:flex px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors shadow-xs items-center gap-1.5 disabled:opacity-40"
            title="Download complete dataset as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB 1: CAMP PERFORMANCE & PREVALENCE */}
      {dashboardTab === 'performance' ? (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* High-Prevalence Alert Banner for Oncologists */}
          {highestRiskCamp && highestRiskCamp.totalScreened > 0 && (
            <div className="p-5 bg-rose-50/80 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-rose-700 dark:text-rose-400">
                      High-Prevalence Oncology Hotspot Alert
                    </span>
                    <span className="text-xs text-rose-400">·</span>
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 font-mono">
                      {highestRiskCamp.highRiskPct}% High-Risk Rate
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {highestRiskCamp.campName} ({highestRiskCamp.location})
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                    Out of {highestRiskCamp.totalScreened} digitized screenings, {highestRiskCamp.highRiskCount} patients show severe cancer symptom scores (avg severity {highestRiskCamp.avgScore} / 13). Lead: {highestRiskCamp.doctorInCharge}. Immediate clinical biopsy mobilization recommended.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCampId(highestRiskCamp.campId);
                  setDashboardTab('log');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs flex items-center gap-2 shrink-0 self-end sm:self-center"
              >
                <span>View Patients ({highestRiskCamp.totalScreened})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 4 Summary Metric KPI Cards for Camp Performance */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                <span>Camps Monitored</span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
                {campPerformanceStats.length}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {campPerformanceStats.filter((c) => c.totalScreened > 0).length} actively reporting
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold mb-1">
                <span>High Prevalence Hotspots</span>
                <Flame className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold font-mono-tabular text-rose-600 dark:text-rose-400">
                {campPerformanceStats.filter((c) => c.prevalenceTier === 'CRITICAL_HIGH').length}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Locations with &ge;28% high risk
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                <span>Cross-Camp Avg Score</span>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
                {(
                  campPerformanceStats.reduce((acc, c) => acc + c.avgScore * c.totalScreened, 0) /
                  (records.length || 1)
                ).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Normal population &lt; 2.0
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">
                <span>High Risk Patients</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono-tabular text-amber-600 dark:text-amber-400">
                {campPerformanceStats.reduce((acc, c) => acc + c.highRiskCount, 0)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Urgent oncology workup
              </div>
            </div>
          </div>

          {/* Recharts Analytics: 2 Charts Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Average Risk Score & Prevalence Index per Camp */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-rose-600" />
                    Average Risk Score per Camp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Visualizing symptom severity index (0–13). Red threshold marks high-prevalence cancer locations.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded">
                  Alert &ge; 2.5
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={campPerformanceStats.filter((c) => c.totalScreened > 0)}
                    margin={{ top: 20, right: 20, left: -15, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      allowDecimals={true}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as CampPerformanceMetric;
                          return (
                            <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                              <div className="font-bold border-b border-slate-700 dark:border-slate-300 pb-1">
                                {data.campName}
                              </div>
                              <div className="text-slate-300 dark:text-slate-600">
                                Location: {data.location}
                              </div>
                              <div className="text-emerald-400 dark:text-emerald-600 font-semibold">
                                Total Screened: {data.totalScreened}
                              </div>
                              <div className="text-rose-400 dark:text-rose-600 font-bold">
                                Avg Risk Score: {data.avgScore} / 13 ({data.highRiskPct}% High Risk)
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Lead: {data.doctorInCharge}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={2.5}
                      stroke="#e11d48"
                      strokeDasharray="4 4"
                      label={{
                        value: 'High Prevalence Alert (2.5)',
                        position: 'insideTopRight',
                        fill: '#e11d48',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                      {campPerformanceStats
                        .filter((c) => c.totalScreened > 0)
                        .map((entry, idx) => (
                          <Cell
                            key={`bar-${idx}`}
                            fill={
                              entry.prevalenceTier === 'CRITICAL_HIGH'
                                ? '#e11d48'
                                : entry.prevalenceTier === 'MODERATE'
                                ? '#f59e0b'
                                : '#10b981'
                            }
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Risk Stratification Distribution per Camp (Stacked Bar) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-600" />
                    Risk Band Distribution per Camp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cohort triage composition: High Risk vs Low Risk vs No Risk breakdown.
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={campPerformanceStats.filter((c) => c.totalScreened > 0)}
                    margin={{ top: 20, right: 20, left: -15, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as CampPerformanceMetric;
                          return (
                            <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                              <div className="font-bold border-b border-slate-700 dark:border-slate-300 pb-1">
                                {data.campName} · {data.totalScreened} Screened
                              </div>
                              <div className="text-rose-400 dark:text-rose-600 font-medium">
                                High Risk (Score &ge; 4): {data.highRiskCount} ({data.highRiskPct}%)
                              </div>
                              <div className="text-amber-400 dark:text-amber-600 font-medium">
                                Low Risk (Score 1–3): {data.lowRiskCount} ({data.lowRiskPct}%)
                              </div>
                              <div className="text-emerald-400 dark:text-emerald-600 font-medium">
                                No Risk (Score 0): {data.noRiskCount} ({data.noRiskPct}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar
                      dataKey="highRiskCount"
                      name="High Risk (Score ≥ 4)"
                      stackId="a"
                      fill="#e11d48"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="lowRiskCount"
                      name="Low Risk (Score 1–3)"
                      stackId="a"
                      fill="#f59e0b"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="noRiskCount"
                      name="No Risk (Score 0)"
                      stackId="a"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Camp Performance Leaderboard & Action Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  Camp Risk Prevalence Leaderboard
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ranked by high-risk patient concentration to prioritize regional oncology biopsy and follow-up.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4 w-12 text-center font-mono">RANK</th>
                    <th className="py-3 px-4">MEDICAL CAMP & VENUE</th>
                    <th className="py-3 px-4">PREVALENCE STATUS</th>
                    <th className="py-3 px-4 text-center font-mono">TOTAL SCREENED</th>
                    <th className="py-3 px-4 text-center font-mono">AVG SCORE</th>
                    <th className="py-3 px-4">RISK PROFILE</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {campPerformanceStats.map((camp, index) => {
                    return (
                      <tr
                        key={camp.campId}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                          #{index + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {camp.campName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{camp.location}</span>
                            <span>·</span>
                            <span>Lead: {camp.doctorInCharge}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {camp.prevalenceTier === 'CRITICAL_HIGH' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              <Flame className="w-3.5 h-3.5 text-rose-600" />
                              High Prevalence Hotspot
                            </span>
                          ) : camp.prevalenceTier === 'MODERATE' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Moderate Prevalence
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Normal Distribution
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono-tabular font-bold text-sm text-slate-900 dark:text-slate-100">
                          {camp.totalScreened}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono-tabular font-bold text-sm text-slate-900 dark:text-slate-100">
                          <span
                            className={
                              camp.avgScore >= 2.5
                                ? 'text-rose-600 dark:text-rose-400'
                                : camp.avgScore >= 1.5
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {camp.avgScore.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              {camp.highRiskPct}% ({camp.highRiskCount} patients)
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {camp.lowRiskCount} low · {camp.noRiskCount} none
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${camp.highRiskPct}%` }}
                              className="bg-rose-600 h-full"
                            />
                            <div
                              style={{ width: `${camp.lowRiskPct}%` }}
                              className="bg-amber-500 h-full"
                            />
                            <div
                              style={{ width: `${camp.noRiskPct}%` }}
                              className="bg-emerald-500 h-full"
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedCampId(camp.campId);
                              setDashboardTab('log');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>View Patients</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* DASHBOARD TAB 2: SCREENING AUDIT LOG & TIMELINE */
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* SUMMARY DASHBOARD WITH RECHARTS */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header & Export CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                Epidemiology & Triage Analytics
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-mono">
                {totalCount} Total Screenings
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Camp Screening Trends & Risk Distribution
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              disabled={records.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors shadow-xs flex items-center gap-2 disabled:opacity-40"
              title="Download entire dataset as CSV for government or hospital reporting"
            >
              <Download className="w-4 h-4" />
              <span>Export to CSV ({totalCount})</span>
            </button>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Screenings */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
              <span>Total Screened</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
              {totalCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Physical questionnaires digitized
            </div>
          </div>

          {/* KPI 2: High Risk */}
          <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-semibold mb-1">
              <span>High Risk (≥ 4 pts)</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold font-mono-tabular text-rose-700 dark:text-rose-400">
              {highRiskCount}{' '}
              <span className="text-xs font-normal text-rose-600 dark:text-rose-300">
                ({highRiskPct}%)
              </span>
            </div>
            <div className="text-[11px] text-rose-600/80 dark:text-rose-300/80 mt-1">
              Urgent oncology workup required
            </div>
          </div>

          {/* KPI 3: Low Risk */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-semibold mb-1">
              <span>Low Risk (1–3 pts)</span>
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono-tabular text-amber-700 dark:text-amber-400">
              {lowRiskCount}{' '}
              <span className="text-xs font-normal text-amber-600 dark:text-amber-300">
                ({lowRiskPct}%)
              </span>
            </div>
            <div className="text-[11px] text-amber-600/80 dark:text-amber-300/80 mt-1">
              Preventive follow-up / lifestyle
            </div>
          </div>

          {/* KPI 4: No Risk */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-1">
              <span>No Risk (0 pts)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono-tabular text-emerald-700 dark:text-emerald-400">
              {noRiskCount}{' '}
              <span className="text-xs font-normal text-emerald-600 dark:text-emerald-300">
                ({noRiskPct}%)
              </span>
            </div>
            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-300/80 mt-1">
              Routine periodic self-check
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {records.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
            <PieChartIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Analytics Visualizations Awaiting Data
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Scan physical questionnaire forms or click "Load Sample Brochure (PDF)" on the Scanner tab to populate timeline trends and cohort distribution charts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Chart 1: Screening Trend Over Time (Stacked BarChart) */}
            <div className="lg:col-span-8 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Screenings by Risk Band Over Time
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Daily intake breakdown: High Risk vs Low Risk vs No Risk
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const high = payload.find((p) => p.dataKey === 'highRisk')?.value || 0;
                          const low = payload.find((p) => p.dataKey === 'lowRisk')?.value || 0;
                          const no = payload.find((p) => p.dataKey === 'noRisk')?.value || 0;
                          const sum = Number(high) + Number(low) + Number(no);

                          return (
                            <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 p-3 rounded-lg shadow-lg text-xs space-y-1">
                              <div className="font-bold border-b border-slate-700 dark:border-slate-300 pb-1">
                                {label} · {sum} Total
                              </div>
                              <div className="text-rose-400 dark:text-rose-600 font-medium">
                                High Risk: {high}
                              </div>
                              <div className="text-amber-400 dark:text-amber-600 font-medium">
                                Low Risk: {low}
                              </div>
                              <div className="text-emerald-400 dark:text-emerald-600 font-medium">
                                No Risk: {no}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                    />
                    <Bar
                      dataKey="highRisk"
                      name="High Risk (Score ≥ 4)"
                      stackId="riskStack"
                      fill="#e11d48"
                    />
                    <Bar
                      dataKey="lowRisk"
                      name="Low Risk (Score 1–3)"
                      stackId="riskStack"
                      fill="#f59e0b"
                    />
                    <Bar
                      dataKey="noRisk"
                      name="No Risk (Score 0)"
                      stackId="riskStack"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Cohort Risk Distribution (Pie/Donut Chart) */}
            <div className="lg:col-span-4 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
              <div className="mb-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Cohort Risk Breakdown
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Relative proportion across all {totalCount} records
                </span>
              </div>

              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const pct = totalCount > 0 ? Math.round((data.value / totalCount) * 100) : 0;
                          return (
                            <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 p-2 rounded-lg text-xs font-medium shadow-md">
                              <div>{data.name}</div>
                              <div className="font-mono text-emerald-400 dark:text-emerald-600">
                                {data.value} patients ({pct}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Badge in Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100 leading-none">
                    {totalCount}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Total
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                {riskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-[11px]">
                      {item.value} ({totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* FILTER & SEARCH BAR */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Screening Audit Log & Clinical Roster
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified scan records with risk stratification and original document audit trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Camp Filter Dropdown */}
          {camps && camps.length > 0 && (
            <select
              value={selectedCampId}
              onChange={(e) => setSelectedCampId(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
            >
              <option value="ALL">All Camps ({camps.length})</option>
              {camps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.location})
                </option>
              ))}
            </select>
          )}

          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient, ID, camp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Risk Band Segmented Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setSelectedBand('ALL')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedBand === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setSelectedBand('HIGH_RISK')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedBand === 'HIGH_RISK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              High Risk
            </button>
            <button
              onClick={() => setSelectedBand('LOW_RISK')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedBand === 'LOW_RISK'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Low Risk
            </button>
            <button
              onClick={() => setSelectedBand('NO_RISK')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedBand === 'NO_RISK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              No Risk
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* RECORDS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No screening records found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Scan a filled paper questionnaire or test with the sample brochure to see verified patient records here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (Visible only on mobile devices for clear readability) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRecords.map((rec) => {
              const guidance = RISK_BANDS_GUIDANCE[rec.riskBand];
              return (
                <div key={rec.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {rec.patientName || 'Anonymous Participant'}
                      </h4>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                        ID: {rec.patientId || 'UNASSIGNED'} {rec.patientAge ? `· ${rec.patientAge}y` : ''} {rec.patientGender ? `· ${rec.patientGender}` : ''}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
                        Score
                      </span>
                      <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                        {rec.totalScore} pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${guidance.badgeBg} ${guidance.colorClass}`}
                    >
                      {rec.riskBand === 'HIGH_RISK' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                      {rec.riskBand === 'NO_RISK' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      <span>{guidance.label}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveModalRecord(rec)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Result</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="truncate max-w-[180px]">{rec.campName || rec.campLocation || 'Clinical Camp'}</span>
                    <span>{new Date(rec.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4">PATIENT & ID</th>
                  <th className="py-3 px-4">CAMP / LOCATION</th>
                  <th className="py-3 px-4 text-center font-mono">SCORE</th>
                  <th className="py-3 px-4">RISK STRATIFICATION</th>
                  <th className="py-3 px-4">SOURCE DOCUMENT</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((rec) => {
                  const guidance = RISK_BANDS_GUIDANCE[rec.riskBand];
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {rec.patientName || 'Anonymous Participant'}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          ID: {rec.patientId || 'UNASSIGNED'} {rec.patientAge ? `· ${rec.patientAge}y` : ''} {rec.patientGender ? `· ${rec.patientGender}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {rec.campName || rec.campLocation || 'Clinical Camp'}
                        </div>
                        {rec.campName && rec.campLocation && rec.campName !== rec.campLocation && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {rec.campLocation}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono-tabular font-bold text-sm text-slate-900 dark:text-slate-100">
                        {rec.totalScore}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${guidance.badgeBg} ${guidance.colorClass}`}
                        >
                          {rec.riskBand === 'HIGH_RISK' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {rec.riskBand === 'NO_RISK' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {guidance.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]">
                          {rec.fileName}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          Came from scan (audit ready)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(rec.timestamp).toLocaleDateString()} {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveModalRecord(rec)}
                          className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>
        </div>
      )}

      {/* RECORD DETAILS MODAL (Mobile full-screen, desktop centered modal) */}
      {activeModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col sm:items-center sm:justify-center sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 sm:rounded-2xl w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Screening Record Audit Detail · {activeModalRecord.patientName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verified by {activeModalRecord.reviewedBy} on {new Date(activeModalRecord.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setActiveModalRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Score & Risk Summary banner */}
              <div
                className={`p-4 rounded-xl border ${
                  RISK_BANDS_GUIDANCE[activeModalRecord.riskBand].badgeBg
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold block text-slate-500 dark:text-slate-400">
                      Risk Stratification Result
                    </span>
                    <h4
                      className={`text-lg font-bold ${
                        RISK_BANDS_GUIDANCE[activeModalRecord.riskBand].colorClass
                      }`}
                    >
                      {RISK_BANDS_GUIDANCE[activeModalRecord.riskBand].label}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                      {RISK_BANDS_GUIDANCE[activeModalRecord.riskBand].summary}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-500 block">Total Score</span>
                    <span className="text-3xl font-mono font-bold text-slate-900 dark:text-slate-100">
                      {activeModalRecord.totalScore}
                    </span>
                  </div>
                </div>

                {/* Suggested Tests */}
                {activeModalRecord.suggestedTests && activeModalRecord.suggestedTests.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <span className="font-semibold block text-slate-800 dark:text-slate-200 mb-1">
                      Recommended Clinical Next Steps & Diagnostic Workup:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300">
                      {activeModalRecord.suggestedTests.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Answers Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Question Breakdown & Verified Marks ({activeModalRecord.answers.length})
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {activeModalRecord.answers.map((ans) => (
                    <div
                      key={ans.code}
                      className="p-3 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {ans.code}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{ans.category}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-snug">
                          {ans.questionText}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            ans.answer === 'yes'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : ans.answer === 'no'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {ans.answer.toUpperCase()} {ans.answer === 'yes' ? `(+${ans.scoreYes} pts)` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Original Scanned Source */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Original Scanned Document Proof
                </h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl max-h-72 overflow-auto flex justify-center">
                  {activeModalRecord.fileType === 'application/pdf' ? (
                    <div className="text-xs text-slate-500 py-4 text-center">
                      <p className="mb-2">Multi-page PDF Document on file ({activeModalRecord.fileName})</p>
                      <a
                        href={activeModalRecord.sourceImageUrl}
                        download={activeModalRecord.fileName}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Attached PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={activeModalRecord.sourceImageUrl}
                      alt="Scanned source audit"
                      className="max-h-64 object-contain rounded"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
              <button
                onClick={() => setActiveModalRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50"
              >
                Close Audit Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
