import { useState } from "react";
import { calculateAdjustedDueDate, formatDisplayDate } from "../../utils/healthcare";
import type { DueDateResult } from "../../utils/healthcare";

export function DueDateCalculator() {
    const [lmpDate, setLmpDate] = useState("");
    const [cycleLength, setCycleLength] = useState(28);
    const [result, setResult] = useState<DueDateResult | null>(null);
    const [error, setError] = useState("");

    const handleCalculate = () => {
        setError("");
        if (!lmpDate) {
            setError("Please enter your last menstrual period date.");
            return;
        }
        if (cycleLength < 20 || cycleLength > 45) {
            setError("Cycle length should be between 20 and 45 days.");
            return;
        }
        const date = new Date(lmpDate + "T00:00:00");
        if (date > new Date()) {
            setError("LMP date cannot be in the future.");
            return;
        }
        setResult(calculateAdjustedDueDate(date, cycleLength));
    };

    const trimesterColor = (t: string) => {
        if (t.includes("First")) return "bg-pink-100 text-pink-700 border-pink-200";
        if (t.includes("Second")) return "bg-amber-100 text-amber-700 border-amber-200";
        return "bg-purple-100 text-purple-700 border-purple-200";
    };

    const trimesterProgress = (t: string) => {
        if (t.includes("First")) return "from-pink-400 to-pink-500";
        if (t.includes("Second")) return "from-amber-400 to-amber-500";
        return "from-purple-400 to-purple-500";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-200">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Due Date Calculator</h2>
                <p className="mt-1 text-sm text-slate-500">Based on Naegele's Rule with cycle-length adjustment</p>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Last Menstrual Period (LMP)
                    </label>
                    <input
                        type="date"
                        value={lmpDate}
                        onChange={(e) => setLmpDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Average Cycle Length: <span className="font-bold text-pink-600">{cycleLength} days</span>
                    </label>
                    <input
                        type="range"
                        min={20}
                        max={45}
                        value={cycleLength}
                        onChange={(e) => setCycleLength(Number(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-pink-100 accent-pink-500"
                    />
                    <div className="mt-1 flex justify-between text-xs text-slate-400">
                        <span>20 days</span>
                        <span>28 days (typical)</span>
                        <span>45 days</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <button
                onClick={handleCalculate}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pink-200 transition hover:shadow-xl hover:shadow-pink-300 active:scale-[0.98]"
            >
                Calculate Due Date
            </button>

            {/* Results */}
            {result && (
                <div className="space-y-4 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-5">
                    {/* Due Date */}
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                            Estimated Due Date
                        </p>
                        <p className="mt-1 text-2xl font-bold text-pink-700">
                            {formatDisplayDate(result.adjustedDueDate)}
                        </p>
                        {result.adjustmentDays !== 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                                {result.adjustmentDays > 0 ? "+" : ""}
                                {result.adjustmentDays} day adjustment from standard calculation
                            </p>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm">
                            <p className="text-xl font-bold text-slate-800">
                                {result.gestationalWeeks}w {result.gestationalDays}d
                            </p>
                            <p className="text-xs text-slate-500">Gestational Age</p>
                        </div>
                        <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm">
                            <p className="text-xl font-bold text-slate-800">{result.daysRemaining}</p>
                            <p className="text-xs text-slate-500">Days Left</p>
                        </div>
                        <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm">
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${trimesterColor(result.trimester)}`}>
                                {result.trimester.replace(" Trimester", "")}
                            </span>
                            <p className="mt-1 text-xs text-slate-500">Trimester</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div className="mb-1 flex justify-between text-xs text-slate-400">
                            <span>Week 0</span>
                            <span>Week 13</span>
                            <span>Week 28</span>
                            <span>Week 40</span>
                        </div>
                        <div className="h-4 overflow-hidden rounded-full bg-white/50">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${trimesterProgress(result.trimester)} transition-all duration-700`}
                                style={{ width: `${result.progress}%` }}
                            />
                        </div>
                        <p className="mt-1 text-center text-xs text-pink-500 font-medium">
                            {Math.round(result.progress)}% of pregnancy complete
                        </p>
                    </div>

                    {/* Baby Development */}
                    <div className="rounded-xl bg-white/70 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            What's Happening
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                            {result.gestationalWeeks < 4
                                ? "🌱 Fertilization and implantation may be occurring."
                                : result.gestationalWeeks < 8
                                    ? "💗 Baby's heart is beginning to beat. Major organs are forming."
                                    : result.gestationalWeeks < 12
                                        ? "👶 Baby is now about the size of a lime. Fingers and toes are forming."
                                        : result.gestationalWeeks < 16
                                            ? "🎵 Baby can hear sounds! The skeleton is hardening."
                                            : result.gestationalWeeks < 20
                                                ? "🦶 You might start feeling kicks! Baby is about 6 inches long."
                                                : result.gestationalWeeks < 24
                                                    ? "👁️ Baby's eyes can open. Fingerprints are forming."
                                                    : result.gestationalWeeks < 28
                                                        ? "🧠 Brain development is rapid. Baby responds to light and sound."
                                                        : result.gestationalWeeks < 32
                                                            ? "📈 Baby is gaining weight rapidly. Lungs are maturing."
                                                            : result.gestationalWeeks < 36
                                                                ? "👇 Baby may be moving into head-down position for birth."
                                                                : result.gestationalWeeks < 40
                                                                    ? "🎉 Baby is full-term! Could arrive any day now."
                                                                    : "🎊 Baby is fully developed and ready to meet you!"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
