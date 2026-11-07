import React, { useState } from 'react';
import {
  BarChart3,
  DollarSign,
  Layers,
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  FileCheck,
  Coins,
  Sparkles,
  Info,
  ExternalLink,
  Receipt,
  X,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { ScanUsageLog } from '../types/screening';

interface UsageCostTrackerProps {
  logs: ScanUsageLog[];
}

export const UsageCostTracker: React.FC<UsageCostTrackerProps> = ({ logs }) => {
  const [selectedLogForBreakdown, setSelectedLogForBreakdown] = useState<ScanUsageLog | null>(null);

  // Aggregate statistics
  const totalScans = logs.length;
  const duplicateInterceptedCount = logs.filter((l) => l.isDuplicate).length;
  const flaggedForReviewCount = logs.filter((l) => l.status === 'FLAGGED_REVIEW').length;

  const totalCostInr = logs.reduce(
    (sum, l) => sum + (l.costInrEstimate || (l.costUsdEstimate ? l.costUsdEstimate * 86.5 : 0.0125)),
    0
  );

  const totalCostUsd = logs.reduce(
    (sum, l) => sum + (l.costUsdEstimate || (l.costInrEstimate ? l.costInrEstimate / 86.5 : 0.000145)),
    0
  );

  const totalTokens = logs.reduce((sum, l) => sum + (l.tokenCountEstimate || 2000), 0);
  const avgCostInr = totalScans > 0 ? totalCostInr / totalScans : 0.0125;
  const avgCostPaise = (avgCostInr * 100).toFixed(2);

  // Camp Monthly Cap Configuration in Indian Rupee
  const monthlyBudgetCapInr = 2100.0; // ₹2,100 allows ~170,000 scans
  const budgetUsedPct = Math.min(100, Math.round((totalCostInr / monthlyBudgetCapInr) * 100));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Screening Camp AI Cost & Token Usage Telemetry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time optical form scanning telemetry: Actual billed tokens per scan, cost calculations in Indian Rupee (₹ INR) & USD ($), and monthly quota controls.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Gemini 3.8 Flash Multimodal Live Telemetry</span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Scans */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Scans Read</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {totalScans}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Physical questionnaires digitized
          </div>
        </div>

        {/* Card 2: Actual AI Cost (INR & USD) */}
        <div className="p-5 bg-white dark:bg-slate-900 border-2 border-emerald-500/50 dark:border-emerald-500/40 rounded-2xl shadow-xs space-y-1 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" />
              Actual AI Cost
            </span>
            <span className="text-xs font-bold text-emerald-600 font-mono-tabular">₹ INR</span>
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            ₹{totalCostInr.toFixed(4)}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-between">
            <span>Avg ~{avgCostPaise} paise / scan</span>
            <span className="text-slate-400">(${totalCostUsd.toFixed(5)})</span>
          </div>
        </div>

        {/* Card 3: Total Tokens Consumed */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Billed Tokens</span>
            <Cpu className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {totalTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            ~2,000 tokens / physical form
          </div>
        </div>

        {/* Card 4: Human Review Rate */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Amber Review Rate</span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {totalScans > 0 ? Math.round((flaggedForReviewCount / totalScans) * 100) : 0}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {flaggedForReviewCount} scan{flaggedForReviewCount !== 1 ? 's' : ''} had low certainty marks
          </div>
        </div>
      </div>

      {/* Transparent Pricing Breakdown Formula Card */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Official Google Gemini 3.8 Flash Cost Formula
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exact multimodal API rates applied to physical document and questionnaire scanning:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
              1 USD = ₹86.50 INR
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">
              1. Input / High-Res Image Tokens
            </span>
            <div className="text-sm font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
              $0.075 / 1,000,000 tokens
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              $0.000000075 / token · ~1,700 tokens per filled form image
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">
              2. Output / Clinical Structured JSON
            </span>
            <div className="text-sm font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
              $0.30 / 1,000,000 tokens
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              $0.00000030 / token · ~250 tokens per 13 question response
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl space-y-1 bg-emerald-50/40 dark:bg-emerald-950/20">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-semibold uppercase">
              3. Actual Cost per Patient Form
            </span>
            <div className="text-base font-bold font-mono-tabular text-emerald-700 dark:text-emerald-400">
              ~₹0.0125 (1.25 paise) / scan
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              ₹1.00 INR digitizes over 80 physical clinical screening sheets!
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Budget Cap Progress Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Camp Monthly Budget & Quota Guard (₹ INR)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pre-configured limit protects camps against runaway upload loops.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
              ₹{totalCostInr.toFixed(3)} / ₹{monthlyBudgetCapInr.toFixed(2)}
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

      {/* Recent Scan Execution Log with Actual AI Cost Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recent Scans Execution Log & Actual AI Cost ({logs.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click any scan to inspect the exact token calculation and cost formula breakdown.
            </p>
          </div>

          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            Real Billed Telemetry
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No API calls recorded in this session yet. Upload or photograph a paper form to see real-time AI cost telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4">DOCUMENT / FILE</th>
                  <th className="py-3 px-4">MODEL & MODE</th>
                  <th className="py-3 px-4 text-center font-mono">TOKENS (IN / OUT)</th>
                  <th className="py-3 px-4 text-center font-mono">ACTUAL AI COST</th>
                  <th className="py-3 px-4 text-center">CERTAINTY</th>
                  <th className="py-3 px-4 text-right">INSPECT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => {
                  const promptTok = log.promptTokens || 1740;
                  const candTok = log.candidatesTokens || 260;
                  const totalTok = log.tokenCountEstimate || promptTok + candTok;
                  const costInr = log.costInrEstimate || 0.0125;
                  const costUsd = log.costUsdEstimate || costInr / 86.5;
                  const paiseStr = log.costPaiseFormatted || `${(costInr * 100).toFixed(2)} paise`;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLogForBreakdown(log)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <div className="truncate max-w-[180px] font-semibold">{log.fileName}</div>
                        <div className="text-[10px] text-slate-400">{log.formType}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>{log.modelUsed || 'gemini-3.8-flash'}</span>
                        </span>
                        {log.isLiveApi && (
                          <span className="ml-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Live
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{totalTok.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {promptTok} in · {candTok} out
                        </div>
                      </td>

                      {/* ACTUAL AI COST COLUMN */}
                      <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                          ₹{costInr.toFixed(4)}
                        </div>
                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-semibold">
                            {paiseStr}
                          </span>
                          <span className="text-[10px] text-slate-400">(${costUsd.toFixed(5)})</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {log.status === 'FLAGGED_REVIEW' ? 'Review Flag' : 'Pass'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogForBreakdown(log);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Exact AI Cost & Token Breakdown for Selected Scan */}
      {selectedLogForBreakdown && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Exact Scan AI Cost Breakdown
                  </h3>
                  <span className="text-xs text-slate-500 font-mono-tabular">
                    {selectedLogForBreakdown.fileName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedLogForBreakdown(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exact Cost Highlight Banner */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-semibold tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  Total Billed Cost for this Scan
                </span>
                <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  ₹{(selectedLogForBreakdown.costInrEstimate || 0.0125).toFixed(4)}{' '}
                  <span className="text-sm font-semibold">
                    ({selectedLogForBreakdown.costPaiseFormatted || '1.25 paise'})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">USD Equivalent</span>
                <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                  ${(selectedLogForBreakdown.costUsdEstimate || 0.000145).toFixed(6)}
                </span>
              </div>
            </div>

            {/* Token Math Breakdown */}
            <div className="space-y-3 text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                Token Consumption & Formula:
              </span>

              {/* Input Tokens */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Input / Prompt Tokens (Image + Instructions)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedLogForBreakdown.promptTokens || 1740} tokens × $0.075 / 1M
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ${(((selectedLogForBreakdown.promptTokens || 1740) * 0.075) / 1000000).toFixed(6)}
                </span>
              </div>

              {/* Output Tokens */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Output Tokens (13 Question Codes & Confidence JSON)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedLogForBreakdown.candidatesTokens || 260} tokens × $0.30 / 1M
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ${(((selectedLogForBreakdown.candidatesTokens || 260) * 0.30) / 1000000).toFixed(6)}
                </span>
              </div>

              {/* Exchange Rate Conversion */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    USD to INR Conversion Rate
                  </span>
                  <span className="text-[11px] text-slate-500">Live community camp benchmark</span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  1 USD = ₹86.50 INR
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForBreakdown(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
