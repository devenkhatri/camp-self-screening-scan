import React from 'react';
import {
  BarChart3,
  DollarSign,
  Layers,
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  FileCheck,
  Coins,
} from 'lucide-react';
import { ScanUsageLog } from '../types/screening';

interface UsageCostTrackerProps {
  logs: ScanUsageLog[];
}

export const UsageCostTracker: React.FC<UsageCostTrackerProps> = ({ logs }) => {
  // Aggregate statistics
  const totalScans = logs.length;
  const duplicateInterceptedCount = logs.filter((l) => l.isDuplicate).length;
  const flaggedForReviewCount = logs.filter((l) => l.status === 'FLAGGED_REVIEW').length;
  const totalCostInr = logs.reduce(
    (sum, l) => sum + (l.costInrEstimate || (l.costUsdEstimate ? l.costUsdEstimate * 86.5 : 0.013)),
    0
  );

  // Camp Monthly Cap Configuration in Indian Rupee
  const monthlyBudgetCapInr = 2100.0; // ₹2,100 allows ~160,000 scans
  const budgetUsedPct = Math.min(100, Math.round((totalCostInr / monthlyBudgetCapInr) * 100));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Screening Camp AI Cost & Token Usage Telemetry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational monitoring: Forms scanned, token cost calculations per centre in Indian Rupee (₹ INR), and monthly quota guards.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Active Quota: Standard Tier (INR)</span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Scans */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Scans Read</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {totalScans}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Physical questionnaires digitized
          </div>
        </div>

        {/* Card 2: Estimated AI Cost (INR) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated AI Cost</span>
            <span className="text-sm font-bold text-emerald-600 font-mono-tabular">₹ INR</span>
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            ₹{totalCostInr.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            ~₹0.013 / scan (1.3 paise)
          </div>
        </div>

        {/* Card 3: Duplicates Intercepted */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Duplicate Warnings</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {duplicateInterceptedCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Re-scans flagged by hash
          </div>
        </div>

        {/* Card 4: Human Review Rate */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Amber Review Rate</span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {totalScans > 0 ? Math.round((flaggedForReviewCount / totalScans) * 100) : 0}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {flaggedForReviewCount} scan{flaggedForReviewCount !== 1 ? 's' : ''} had low confidence marks
          </div>
        </div>
      </div>

      {/* Monthly Budget Cap Progress Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Camp Monthly Budget & Token Cap (₹ INR)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configured threshold protects against accidental runaway batch uploads.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
              ₹{totalCostInr.toFixed(2)} / ₹{monthlyBudgetCapInr.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 block">({budgetUsedPct}% utilized)</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.max(2, budgetUsedPct)}%` }}
          />
        </div>
      </div>

      {/* Recent Scan Execution Log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recent Scans Execution Log ({logs.length})
          </h3>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No API calls recorded in this session yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-2.5 px-4">TIMESTAMP</th>
                  <th className="py-2.5 px-4">FILE</th>
                  <th className="py-2.5 px-4">FORM TYPE</th>
                  <th className="py-2.5 px-4 text-center">DUPLICATE?</th>
                  <th className="py-2.5 px-4 text-center font-mono">EST. TOKENS</th>
                  <th className="py-2.5 px-4 text-center font-mono">EST. COST (₹)</th>
                  <th className="py-2.5 px-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                      {log.fileName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                      {log.formType}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {log.isDuplicate ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          YES
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">NO</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                      {log.tokenCountEstimate}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                      ₹{(log.costInrEstimate || 0.013).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span
                        className={`text-[11px] font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {log.status === 'FLAGGED_REVIEW' ? 'Review Required' : 'Passed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

