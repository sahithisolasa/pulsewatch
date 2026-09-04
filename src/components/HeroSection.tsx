import React from 'react';
import { History, CheckCircle2, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { PulseOverviewResponse } from '../types.ts';

interface HeroSectionProps {
  pulse: PulseOverviewResponse | null;
  userName?: string | null;
  onMarkChecked: () => void;
  onSimulateAway: (minutes: number) => void;
  onSimulateMovement: (step?: number) => void;
  isUpdatingCheckpoints?: boolean;
  isSimulating?: boolean;
  simulationScenario?: {
    step: number;
    totalSteps: number;
    scenarioName: string;
    description: string;
    highlightStock?: string;
  } | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  pulse,
  userName,
  onMarkChecked,
  onSimulateAway,
  onSimulateMovement,
  isUpdatingCheckpoints,
  isSimulating,
  simulationScenario,
}) => {
  const awayText = pulse?.awayDurationText || '5h 24m';
  const trackedCount = pulse?.trackedCount ?? 8;
  const meaningfulChanges = pulse?.meaningfulChangesCount ?? 3;
  const unusualVolume = pulse?.unusualVolumeEventsCount ?? 2;
  const majorEvents = pulse?.majorEventsCount ?? 1;

  const displayName = userName || 'Aman';

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome & Checkpoint Bar */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Welcome back, {displayName}.
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Here's what changed since your last check{' '}
              <span className="text-slate-100 font-medium">{awayText} ago</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Prominent Simulate Market Movement Button */}
            <button
              onClick={() => onSimulateMovement()}
              disabled={isSimulating}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 border border-indigo-400/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              title="Advance simulated market state to trigger realistic price changes, volume anomalies, and catalysts"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-300 ${isSimulating ? 'animate-spin' : 'fill-amber-300'}`} />
              <span>{isSimulating ? 'Simulating Movement...' : 'Simulate Market Movement'}</span>
              <Sparkles className="w-3 h-3 text-indigo-200 opacity-80" />
            </button>

            {/* Away time simulation buttons */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mr-1 flex items-center gap-1">
                <History className="w-3 h-3 text-slate-400" />
                Away:
              </span>
              <button
                onClick={() => onSimulateAway(60)}
                className="px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Simulate 1 hour away"
              >
                1h
              </button>
              <button
                onClick={() => onSimulateAway(324)}
                className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/40"
                title="Simulate 5h 24m away (Hackathon default)"
              >
                5h 24m
              </button>
              <button
                onClick={() => onSimulateAway(1440)}
                className="px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Simulate 24 hours away"
              >
                24h
              </button>
            </div>

            {/* Mark as seen / checked button */}
            <button
              onClick={onMarkChecked}
              disabled={isUpdatingCheckpoints}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 font-medium text-slate-200 transition disabled:opacity-50 flex items-center gap-1.5"
              title="Save current prices as your new baseline checkpoint"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isUpdatingCheckpoints ? 'Saving...' : 'Mark all as seen'}</span>
            </button>
          </div>
        </div>

        {/* Active Simulation Scenario Banner & Scenario Selector */}
        {simulationScenario && (
          <div className="bg-[#101014] border border-slate-800/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-indigo-950/70 text-indigo-400 border border-indigo-800/50 shrink-0">
                Demo Step {simulationScenario.step + 1}/{simulationScenario.totalSteps}
              </span>
              <div className="truncate">
                <span className="font-semibold text-slate-200">{simulationScenario.scenarioName}: </span>
                <span className="text-slate-400 truncate">{simulationScenario.description}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {[0, 1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => onSimulateMovement(s)}
                  disabled={isSimulating}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    simulationScenario.step === s
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                  title={`Jump directly to Scenario ${s + 1}`}
                >
                  Step {s + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4 Metric Cards in Professional Polish Design */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tracked Stocks */}
        <div className="bg-[#141416] p-4 rounded-xl border border-slate-800 flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Tracked Stocks
          </span>
          <span className="text-2xl font-bold text-white">{trackedCount}</span>
        </div>

        {/* Meaningful Changes with red left border */}
        <div className="bg-[#141416] p-4 rounded-xl border border-slate-800 flex flex-col gap-1 border-l-4 border-l-red-500 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Meaningful Changes
          </span>
          <span className="text-2xl font-bold text-red-400">{meaningfulChanges}</span>
        </div>

        {/* Unusual Volume */}
        <div className="bg-[#141416] p-4 rounded-xl border border-slate-800 flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Unusual Volume
          </span>
          <span className="text-2xl font-bold text-white">{unusualVolume}</span>
        </div>

        {/* Market Events */}
        <div className="bg-[#141416] p-4 rounded-xl border border-slate-800 flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Market Events
          </span>
          <span className="text-2xl font-bold text-white">{majorEvents}</span>
        </div>
      </section>
    </div>
  );
};
