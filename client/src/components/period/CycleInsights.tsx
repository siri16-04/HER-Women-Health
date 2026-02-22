import { useMemo } from "react";
import type { PeriodEntry } from "../../utils/healthcare";
import { calculateCycleStats, calculateCycleChaosIndex, formatDisplayDate } from "../../utils/healthcare";

interface Props {
    periods: PeriodEntry[];
}

export function CycleInsights({ periods }: Props) {
    const stats = useMemo(() => calculateCycleStats(periods), [periods]);
    const chaosIndex = useMemo(
        () => (stats.cycleLengths.length >= 2 ? calculateCycleChaosIndex(stats.cycleLengths) : null),
        [stats.cycleLengths]
    );

    const daysUntilNextPeriod = useMemo(() => {
        if (!stats.nextPeriodDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const next = new Date(stats.nextPeriodDate);
        next.setHours(0, 0, 0, 0);
        return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }, [stats.nextPeriodDate]);

    const daysUntilOvulation = useMemo(() => {
        if (!stats.ovulationDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ovulation = new Date(stats.ovulationDate);
        ovulation.setHours(0, 0, 0, 0);
        return Math.ceil((ovulation.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }, [stats.ovulationDate]);

    const getChaosColor = (color: string) => {
        switch (color) {
            case "green": return "text-emerald-600 bg-emerald-50";
            case "yellow": return "text-amber-600 bg-amber-50";
            case "red": return "text-red-600 bg-red-50";
            default: return "text-slate-600 bg-slate-50";
        }
    };

    if (periods.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
                    <svg className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">No Data Yet</h3>
                <p className="mt-1 text-sm text-slate-500">
                    Log your first period to see insights and predictions.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Countdown Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Next Period */}
                <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-4">
                    <div className="flex items-center gap-2 text-pink-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">Next Period</span>
                    </div>
                    {daysUntilNextPeriod !== null ? (
                        <>
                            <p className="mt-2 text-3xl font-bold text-pink-600">
                                {daysUntilNextPeriod <= 0 ? "Today!" : `${daysUntilNextPeriod}d`}
                            </p>
                            <p className="text-xs text-pink-400">
                                {stats.nextPeriodDate && formatDisplayDate(stats.nextPeriodDate)}
                            </p>
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-pink-400">Log more periods</p>
                    )}
                </div>

                {/* Ovulation */}
                <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 p-4">
                    <div className="flex items-center gap-2 text-purple-400">
                        <span className="text-lg">🥚</span>
                        <span className="text-xs font-semibold uppercase tracking-wider">Ovulation</span>
                    </div>
                    {daysUntilOvulation !== null ? (
                        <>
                            <p className="mt-2 text-3xl font-bold text-purple-600">
                                {daysUntilOvulation <= 0 ? "Today!" : `${daysUntilOvulation}d`}
                            </p>
                            <p className="text-xs text-purple-400">
                                {stats.ovulationDate && formatDisplayDate(stats.ovulationDate)}
                            </p>
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-purple-400">Log more periods</p>
                    )}
                </div>
            </div>

            {/* Fertile Window */}
            {stats.fertileWindowStart && stats.fertileWindowEnd && (
                <div className="rounded-2xl border border-purple-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-purple-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-sm font-semibold">Fertile Window</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                        {formatDisplayDate(stats.fertileWindowStart)} — {formatDisplayDate(stats.fertileWindowEnd)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Highest chance of conception during this window
                    </p>
                </div>
            )}

            {/* Cycle Stats */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Cycle Statistics
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-2xl font-bold text-slate-800">{stats.averageCycleLength}</p>
                        <p className="text-xs text-slate-500">Avg Cycle</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-2xl font-bold text-slate-800">{stats.averagePeriodLength}</p>
                        <p className="text-xs text-slate-500">Avg Period</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-2xl font-bold text-slate-800">{periods.length}</p>
                        <p className="text-xs text-slate-500">Logged</p>
                    </div>
                </div>
            </div>

            {/* Chaos Index */}
            {chaosIndex && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Cycle Regularity Index
                    </h4>

                    <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getChaosColor(chaosIndex.labelColor)}`}>
                            {chaosIndex.label}
                        </span>
                        <span className="text-sm text-slate-500">
                            σ = {chaosIndex.stddev} days
                        </span>
                    </div>

                    {/* Gauge */}
                    <div className="mt-3">
                        <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
                            <div className="absolute inset-y-0 left-0 w-1/3 bg-emerald-300" />
                            <div className="absolute inset-y-0 left-1/3 w-1/3 bg-amber-300" />
                            <div className="absolute inset-y-0 left-2/3 w-1/3 bg-red-300" />
                            <div
                                className="absolute top-0 h-full w-1 bg-slate-800 shadow"
                                style={{ left: `${Math.min(95, (chaosIndex.stddev / 20) * 100)}%` }}
                            />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                            <span>Regular</span>
                            <span>Mild</span>
                            <span>Irregular</span>
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">{chaosIndex.advice}</p>
                </div>
            )}

            {/* Cycle History */}
            {stats.cycleLengths.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-700">Cycle Length History</h4>
                    <div className="flex items-end gap-1" style={{ height: 60 }}>
                        {stats.cycleLengths.map((length, i) => {
                            const maxVal = Math.max(...stats.cycleLengths);
                            const minVal = Math.min(...stats.cycleLengths, 20);
                            const height = ((length - minVal + 5) / (maxVal - minVal + 10)) * 50 + 10;
                            return (
                                <div
                                    key={i}
                                    className="flex-1 rounded-t bg-gradient-to-t from-pink-400 to-pink-300"
                                    style={{ height: `${height}px` }}
                                    title={`Cycle ${i + 1}: ${length} days`}
                                />
                            );
                        })}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                        <span>Oldest</span>
                        <span>Recent</span>
                    </div>
                </div>
            )}
        </div>
    );
}
