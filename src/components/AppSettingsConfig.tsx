import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Coins,
  ShieldCheck,
  RefreshCw,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Receipt,
  Layers,
  BarChart3,
} from 'lucide-react';
import { AppConfiguration, ScanUsageLog } from '../types/screening';

interface AppSettingsConfigProps {
  config: AppConfiguration;
  onUpdateConfig: (newConfig: AppConfiguration) => void;
  logs: ScanUsageLog[];
  onNavigateToUsage: () => void;
}

export const AppSettingsConfig: React.FC<AppSettingsConfigProps> = ({
  config,
  onUpdateConfig,
  logs,
  onNavigateToUsage,
}) => {
  // Local editable form state
  const [monthlyBudgetInr, setMonthlyBudgetInr] = useState<number>(config.monthlyBudgetInr);
  const [usdToInrRate, setUsdToInrRate] = useState<number>(config.usdToInrRate);
  const [quotaWarningThresholdPct, setQuotaWarningThresholdPct] = useState<number>(
    config.quotaWarningThresholdPct || 80
  );
  const [perScanThresholdMultiplier, setPerScanThresholdMultiplier] = useState<number>(
    config.perScanThresholdMultiplier || 5
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync when prop changes
  useEffect(() => {
    setMonthlyBudgetInr(config.monthlyBudgetInr);
    setUsdToInrRate(config.usdToInrRate);
    setQuotaWarningThresholdPct(config.quotaWarningThresholdPct || 80);
    setPerScanThresholdMultiplier(config.perScanThresholdMultiplier || 5);
    setHasUnsavedChanges(false);
  }, [config]);

  // Track unsaved state
  const handleBudgetChange = (val: number) => {
    setMonthlyBudgetInr(val);
    setHasUnsavedChanges(true);
    setSaveSuccessMessage(null);
  };

  const handleRateChange = (val: number) => {
    setUsdToInrRate(val);
    setHasUnsavedChanges(true);
    setSaveSuccessMessage(null);
  };

  const handleThresholdChange = (val: number) => {
    setQuotaWarningThresholdPct(val);
    setHasUnsavedChanges(true);
    setSaveSuccessMessage(null);
  };

  const handleMultiplierChange = (val: number) => {
    setPerScanThresholdMultiplier(val);
    setHasUnsavedChanges(true);
    setSaveSuccessMessage(null);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (monthlyBudgetInr <= 0 || usdToInrRate <= 0 || perScanThresholdMultiplier <= 0) return;

    const updated: AppConfiguration = {
      monthlyBudgetInr: Number(monthlyBudgetInr),
      usdToInrRate: Number(usdToInrRate),
      quotaWarningThresholdPct: Number(quotaWarningThresholdPct),
      perScanThresholdMultiplier: Number(perScanThresholdMultiplier),
      lastUpdated: new Date().toISOString(),
    };

    onUpdateConfig(updated);
    setHasUnsavedChanges(false);
    setSaveSuccessMessage('Configurations saved! Application telemetry, budget guards, and 5x scan thresholds updated across all screens.');

    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 6000);
  };

  const handleResetToDefaults = () => {
    const defaults: AppConfiguration = {
      monthlyBudgetInr: 2100.0,
      usdToInrRate: 86.50,
      quotaWarningThresholdPct: 80,
      perScanThresholdMultiplier: 5,
      lastUpdated: new Date().toISOString(),
    };

    setMonthlyBudgetInr(defaults.monthlyBudgetInr);
    setUsdToInrRate(defaults.usdToInrRate);
    setQuotaWarningThresholdPct(defaults.quotaWarningThresholdPct);
    setPerScanThresholdMultiplier(defaults.perScanThresholdMultiplier);
    onUpdateConfig(defaults);
    setHasUnsavedChanges(false);
    setSaveSuccessMessage('Reset to factory oncology camp defaults (₹2,100 / month, $1 = ₹86.50, 5x per-scan threshold).');

    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 6000);
  };

  // Live calculations based on current editable parameters
  const totalScans = logs.length;
  const currentTotalUsd = logs.reduce(
    (sum, l) => sum + (l.costUsdEstimate || (l.costInrEstimate ? l.costInrEstimate / config.usdToInrRate : 0.000145)),
    0
  );

  // Recalculated total INR using the active rate
  const recalculatedTotalInr = currentTotalUsd * usdToInrRate;
  const recalculatedBudgetUsedPct = monthlyBudgetInr > 0
    ? Math.min(100, Math.round((recalculatedTotalInr / monthlyBudgetInr) * 100))
    : 0;

  // Single form scan costs based on active rate
  // Standard Gemini 3.8 Flash: 1,740 prompt tokens ($0.075/1M), 260 candidates tokens ($0.30/1M)
  const singleScanCostUsd = (1740 * 0.075) / 1000000 + (260 * 0.30) / 1000000; // ~$0.0001425 USD
  const singleScanCostInr = singleScanCostUsd * usdToInrRate;
  const singleScanPaise = (singleScanCostInr * 100).toFixed(2);

  // Per scan threshold calculation (e.g. 5x limit)
  const perScanThresholdCostInr = singleScanCostInr * perScanThresholdMultiplier;
  const perScanThresholdPaise = (perScanThresholdCostInr * 100).toFixed(2);
  const scansOverThresholdCount = logs.filter(
    (l) => (l.costInrEstimate || 0) > perScanThresholdCostInr
  ).length;

  // Estimated scan volume capacity supported by the budget
  const estimatedScanCapacity = singleScanCostInr > 0 ? Math.floor(monthlyBudgetInr / singleScanCostInr) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
              System Administration
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Live Currency & Quota Controls
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5 mt-0.5">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Camp Configurations & Financial Controls
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure the camp monthly scanning budget, quota guard thresholds, and USD-to-INR currency exchange rate. All cost calculations and telemetry adapt instantly when updated.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onNavigateToUsage}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>View Estimates & Usage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-400 dark:border-amber-600 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">You have unsaved configuration changes</span>
              <span className="text-[11px] text-amber-800 dark:text-amber-300">
                Click "Save & Apply Configurations" to update telemetry calculations across the application.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Now</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* CONFIGURATION CARD 1: CAMP MONTHLY BUDGET & QUOTA GUARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Camp Monthly Budget & Quota Guard Amount
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set the hard safety quota for AI vision scanning across community screening camps. Protects the foundation from unexpected billing spikes.
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-mono text-xs font-semibold">
                Monthly Cap: ₹{Number(monthlyBudgetInr).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Input & Presets (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Monthly Budget Cap in Indian Rupee (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    max="500000"
                    step="50"
                    value={monthlyBudgetInr}
                    onChange={(e) => handleBudgetChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Recommended foundation allocation for multi-village camps: ₹2,100 to ₹5,000 per month.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Quick Budget Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1000, 2100, 5000, 10000, 25000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleBudgetChange(preset)}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                        monthlyBudgetInr === preset
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ₹{preset.toLocaleString()}
                      {preset === 2100 ? ' (Default)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quota Warning Trigger */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Quota Warning Threshold:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {quotaWarningThresholdPct}% of budget
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={quotaWarningThresholdPct}
                  onChange={(e) => handleThresholdChange(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>50% (Cautious)</span>
                  <span>80% (Recommended)</span>
                  <span>95% (Aggressive)</span>
                </div>
              </div>
            </div>

            {/* Capacity & Quota Telemetry Preview (5 cols) */}
            <div className="md:col-span-5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block uppercase tracking-wider">
                Budget Capacity Telemetry
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Estimated Scan Capacity:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    ~{estimatedScanCapacity.toLocaleString()} forms
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Current Monthly Spend:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹{recalculatedTotalInr.toFixed(4)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Quota Utilization:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {recalculatedBudgetUsedPct}%
                  </span>
                </div>

                {/* Visual Progress Meter */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      recalculatedBudgetUsedPct >= quotaWarningThresholdPct
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(2, recalculatedBudgetUsedPct)}%` }}
                  />
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  ✓ With a monthly cap of <strong>₹{monthlyBudgetInr.toLocaleString()}</strong>, Harikrishna Cancer Foundation can screen up to <strong>~{estimatedScanCapacity.toLocaleString()} patients</strong> per month with complete AI vision support.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONFIGURATION CARD 2: INR AMOUNT OF 1 USD (EXCHANGE RATE) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  2. INR Amount of 1 USD (Currency Exchange Rate)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set the Indian Rupee valuation for 1 US Dollar. All multimodal API token expenses billed in USD are dynamically translated to INR (₹) and paise using this configured rate.
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-mono text-xs font-semibold">
                $1 USD = ₹{Number(usdToInrRate).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Input & Presets (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  INR Amount per 1 USD (₹/$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="50"
                    max="150"
                    step="0.05"
                    value={usdToInrRate}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Official standard reference rate: <strong>₹86.50 INR / USD</strong>.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Exchange Rate Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[84.50, 85.50, 86.50, 87.25, 88.00].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleRateChange(preset)}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                        Math.abs(usdToInrRate - preset) < 0.01
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ₹{preset.toFixed(2)}
                      {preset === 86.50 ? ' (Reference)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-sky-900 dark:text-sky-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Updating the exchange rate dynamically updates all historical scan log displays, estimated costs in paise, and ongoing live scan requests immediately.
                </span>
              </div>
            </div>

            {/* Real-time Pricing Translation (5 cols) */}
            <div className="md:col-span-5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block uppercase tracking-wider">
                Live Cost Translation Rates
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Input Tokens ($0.075 / 1M):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹{(0.075 * usdToInrRate).toFixed(3)} / 1M
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Output Tokens ($0.30 / 1M):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹{(0.30 * usdToInrRate).toFixed(3)} / 1M
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Average Physical Form Scan:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    ~{singleScanPaise} paise (₹{singleScanCostInr.toFixed(4)})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">10,000 Patient Camp Cost:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹{(singleScanCostInr * 10000).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONFIGURATION CARD 3: PER SCAN ESTIMATE THRESHOLD MULTIPLIER (e.g. 5x) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    3. Per Scan Estimate Anomaly Guard (Threshold Multiplier)
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {perScanThresholdMultiplier}x Threshold
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set the threshold multiplier for per-scan cost estimates (default 5x). Scans whose billed AI token cost exceeds this multiple of the baseline per-scan estimate are highlighted with high-cost spike warning badges in telemetry logs.
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md font-mono text-xs font-bold border border-amber-200 dark:border-amber-800">
                Cap: {perScanThresholdMultiplier}x (~{perScanThresholdPaise}p)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Input & Presets (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Per Scan Cost Spike Multiplier (e.g. 5x)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1.5"
                    max="25"
                    step="0.5"
                    value={perScanThresholdMultiplier}
                    onChange={(e) => handleMultiplierChange(parseFloat(e.target.value) || 1)}
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    x
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Standard baseline per scan is ~{singleScanPaise} paise. Any scan exceeding <strong>{perScanThresholdMultiplier}x</strong> (~{perScanThresholdPaise} paise / ₹{perScanThresholdCostInr.toFixed(4)}) is flagged as an anomalous spike.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Threshold Multiplier Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[2, 3, 5, 8, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleMultiplierChange(preset)}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                        perScanThresholdMultiplier === preset
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {preset}x
                      {preset === 5 ? ' (Default)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  When field screeners upload high-resolution double sheets or noisy scans requiring extended prompt tokens, this 5x threshold guards against silent cost escalation.
                </span>
              </div>
            </div>

            {/* Real-time Threshold Preview (5 cols) */}
            <div className="md:col-span-5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block uppercase tracking-wider">
                Live Threshold Telemetry
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Baseline Per Scan:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    ~{singleScanPaise} paise (₹{singleScanCostInr.toFixed(4)})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Configured Multiplier:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {perScanThresholdMultiplier}x
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Warning Trigger Limit:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                    ~{perScanThresholdPaise} paise (₹{perScanThresholdCostInr.toFixed(4)})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Scans Over Threshold:</span>
                  <span className={`font-mono font-bold ${scansOverThresholdCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {scansOverThresholdCount} / {totalScans}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {scansOverThresholdCount === 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      All scanned questionnaires are within the {perScanThresholdMultiplier}x cost boundary.
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {scansOverThresholdCount} scan(s) exceeded the {perScanThresholdMultiplier}x per-scan cost ceiling.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Last configured:</span>
            <span className="font-mono font-semibold">
              {config.lastUpdated ? new Date(config.lastUpdated).toLocaleString() : 'System default'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <button
              type="submit"
              disabled={!hasUnsavedChanges}
              className={`flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white cursor-pointer hover:shadow-emerald-500/25'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Configurations</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
