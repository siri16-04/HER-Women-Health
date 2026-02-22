import { useState, useMemo } from "react";
import type { PeriodEntry } from "../../utils/healthcare";
import { calculateCycleStats } from "../../utils/healthcare";

interface Props {
    periods: PeriodEntry[];
    onDateClick: (date: Date) => void;
    selectedDate: Date | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function MenstrualCalendar({ periods, onDateClick, selectedDate }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const stats = useMemo(() => calculateCycleStats(periods), [periods]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty slots for days before the first day
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date | null) => {
        if (!date || !selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const isPeriodDay = (date: Date | null) => {
        if (!date) return false;
        return periods.some((period) => {
            const start = new Date(period.startDate);
            const end = new Date(period.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            return checkDate >= start && checkDate <= end;
        });
    };

    const getPeriodFlow = (date: Date | null): string | null => {
        if (!date) return null;
        for (const period of periods) {
            const start = new Date(period.startDate);
            const end = new Date(period.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            if (checkDate >= start && checkDate <= end) {
                return period.flow;
            }
        }
        return null;
    };

    const isPredictedPeriod = (date: Date | null) => {
        if (!date || !stats.nextPeriodDate) return false;
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        const predictedStart = new Date(stats.nextPeriodDate);
        predictedStart.setHours(0, 0, 0, 0);
        const predictedEnd = new Date(predictedStart);
        predictedEnd.setDate(predictedEnd.getDate() + stats.averagePeriodLength - 1);
        return checkDate >= predictedStart && checkDate <= predictedEnd && !isPeriodDay(date);
    };

    const isFertileDay = (date: Date | null) => {
        if (!date || !stats.fertileWindowStart || !stats.fertileWindowEnd) return false;
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        const start = new Date(stats.fertileWindowStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(stats.fertileWindowEnd);
        end.setHours(0, 0, 0, 0);
        return checkDate >= start && checkDate <= end && !isPeriodDay(date);
    };

    const isOvulationDay = (date: Date | null) => {
        if (!date || !stats.ovulationDate) return false;
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        const ovulation = new Date(stats.ovulationDate);
        ovulation.setHours(0, 0, 0, 0);
        return checkDate.getTime() === ovulation.getTime();
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    const getFlowColor = (flow: string | null) => {
        switch (flow) {
            case "light": return "bg-pink-300";
            case "medium": return "bg-pink-500";
            case "heavy": return "bg-pink-700";
            default: return "bg-pink-400";
        }
    };

    return (
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm max-w-sm mx-auto">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <button
                    onClick={prevMonth}
                    className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-50"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="text-center">
                    <h3 className="text-base font-semibold text-slate-700">
                        {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <button
                        onClick={goToToday}
                        className="mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-pink-500 hover:text-pink-600"
                    >
                        Today
                    </button>
                </div>

                <button
                    onClick={nextMonth}
                    className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-50"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Day headers */}
            <div className="mb-1 grid grid-cols-7 gap-1">
                {DAYS.map((day) => (
                    <div key={day} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {day.charAt(0)}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                    if (!date) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const isPeriod = isPeriodDay(date);
                    const isPredicted = isPredictedPeriod(date);
                    const isFertile = isFertileDay(date);
                    const isOvulation = isOvulationDay(date);
                    const flow = getPeriodFlow(date);

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onDateClick(date)}
                            className={`relative aspect-square rounded-full p-0.5 text-xs font-medium transition-all hover:scale-105 ${isSelected(date)
                                ? "ring-1 ring-pink-500 ring-offset-1"
                                : ""
                                } ${isPeriod
                                    ? `${getFlowColor(flow)} text-white shadow-sm`
                                    : isPredicted
                                        ? "bg-pink-50 text-pink-500 border border-dashed border-pink-200"
                                        : isOvulation
                                            ? "bg-purple-500 text-white shadow-sm"
                                            : isFertile
                                                ? "bg-purple-50 text-purple-600"
                                                : isToday(date)
                                                    ? "bg-slate-800 text-white"
                                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <span className="flex h-full items-center justify-center">
                                {date.getDate()}
                            </span>
                            {isOvulation && !isPeriod && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[6px]">🥚</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-pink-500" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Period</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full border border-dashed border-pink-300 bg-pink-50" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Predicted</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-purple-50 border border-purple-100" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Fertile</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Ovulation</span>
                </div>
            </div>
        </div>
    );
}
