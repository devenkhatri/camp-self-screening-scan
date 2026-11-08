import React from 'react';
import { ScanLine, FileSpreadsheet, ShieldAlert, Printer, BarChart3, Settings, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'scan' | 'history' | 'questions' | 'print' | 'usage' | 'settings';
  setActiveTab: (tab: 'scan' | 'history' | 'questions' | 'print' | 'usage' | 'settings') => void;
  onNewScanClick: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewScanClick,
  isDarkMode,
  toggleDarkMode,
}) => {
  return (
    <>
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 md:gap-8 h-14 sm:h-16">
            {/* Zone 1: Brand wordmark (responsive text) */}
            <button
              onClick={() => setActiveTab('scan')}
              className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none group shrink-0 min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-semibold shadow-xs shrink-0">
                <ScanLine className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 dark:text-emerald-600" />
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate block">
                  <span className="inline sm:hidden">Camp Scan</span>
                  <span className="hidden sm:inline">Camp Self-Screening Scan</span>
                </span>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-none truncate">
                  <span className="inline sm:hidden">Paper AI Scanner</span>
                  <span className="hidden sm:inline">Clinical Paper AI Scanner</span>
                </div>
              </div>
            </button>

            {/* Zone 2: Desktop Nav links */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
              <button
                onClick={() => setActiveTab('scan')}
                className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'scan'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ScanLine className="w-4 h-4" />
                Scanner
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Screening Log
              </button>

              <button
                onClick={() => setActiveTab('questions')}
                className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'questions'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Camps & Admin
              </button>

              <button
                onClick={() => setActiveTab('print')}
                className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'print'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Printer className="w-4 h-4" />
                Print Forms
              </button>

              <button
                onClick={() => setActiveTab('usage')}
                className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'usage'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Estimates & Usage
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'settings'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </nav>

            {/* Zone 3: 1 primary action (Always visible on mobile) + theme toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button
                onClick={toggleDarkMode}
                aria-label="Toggle visual theme"
                className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Top "Scan Form" Button - visible and prominent on ALL screen sizes */}
              <button
                onClick={onNewScanClick}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors whitespace-nowrap shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <ScanLine className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
                <span>Scan Form</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-First Bottom Navigation Dock (Visible on Mobile Screens) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-1 px-1 shadow-lg safe-area-bottom transition-colors no-print"
      >
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'scan'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <ScanLine className="w-4 h-4 mb-0.5" />
          <span>Scanner</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mb-0.5" />
          <span>Log</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'questions'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 mb-0.5" />
          <span>Camps</span>
        </button>

        <button
          onClick={() => setActiveTab('print')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'print'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Printer className="w-4 h-4 mb-0.5" />
          <span>Print</span>
        </button>

        <button
          onClick={() => setActiveTab('usage')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'usage'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Usage</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Settings className="w-4 h-4 mb-0.5" />
          <span>Config</span>
        </button>
      </nav>
    </>
  );
};
