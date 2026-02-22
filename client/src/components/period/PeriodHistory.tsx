import { useMemo } from "react";
import type { PeriodEntry } from "../../utils/healthcare";
import { formatDisplayDate } from "../../utils/healthcare";

interface Props {
    periods: PeriodEntry[];
    onEdit: (period: PeriodEntry) => void;
}

export function PeriodHistory({ periods, onEdit }: Props) {
    const sortedPeriods = useMemo(() => {
        return [...periods].sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
    }, [periods]);

    const getFlowStyle = (flow: string) => {
        switch (flow) {
            case "light": return "bg-pink-200 text-pink-700";
            case "medium": return "bg-pink-400 text-white";
            case "heavy": return "bg-pink-600 text-white";
            default: return "bg-pink-300 text-pink-800";
        }
    };

    const getDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    if (periods.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
                    <svg className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">No Periods Logged</h3>
                <p className="mt-1 text-sm text-slate-500">
                    Tap on a date in the calendar to log your first period.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <svg className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Period History ({periods.length})
            </h4>

            <div className="space-y-2">
                {sortedPeriods.map((period) => (
                    <button
                        key={period.id}
                        onClick={() => onEdit(period)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-pink-200 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    {formatDisplayDate(new Date(period.startDate))}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {getDuration(period.startDate, period.endDate)} days
                                </p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${getFlowStyle(period.flow)}`}>
                                {period.flow}
                            </span>
                        </div>

                        {period.symptoms.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {period.symptoms.slice(0, 4).map((symptom) => (
                                    <span
                                        key={symptom}
                                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                                    >
                                        {symptom}
                                    </span>
                                ))}
                                {period.symptoms.length > 4 && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                        +{period.symptoms.length - 4}
                                    </span>
                                )}
                            </div>
                        )}

                        {period.notes && (
                            <p className="mt-2 line-clamp-1 text-xs text-slate-400 italic">
                                "{period.notes}"
                            </p>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
