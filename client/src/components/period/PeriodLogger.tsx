import { useState, useEffect } from "react";
import type { PeriodEntry } from "../../utils/healthcare";
import { SYMPTOM_OPTIONS, formatDate } from "../../utils/healthcare";

interface Props {
    selectedDate: Date | null;
    existingPeriod: PeriodEntry | null;
    onSave: (entry: PeriodEntry) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export function PeriodLogger({ selectedDate, existingPeriod, onSave, onDelete, onClose }: Props) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [flow, setFlow] = useState<"light" | "medium" | "heavy">("medium");
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (existingPeriod) {
            setStartDate(existingPeriod.startDate);
            setEndDate(existingPeriod.endDate);
            setFlow(existingPeriod.flow);
            setSymptoms(existingPeriod.symptoms);
            setNotes(existingPeriod.notes);
        } else if (selectedDate) {
            const dateStr = formatDate(selectedDate);
            setStartDate(dateStr);
            const endD = new Date(selectedDate);
            endD.setDate(endD.getDate() + 4);
            setEndDate(formatDate(endD));
            setFlow("medium");
            setSymptoms([]);
            setNotes("");
        }
    }, [selectedDate, existingPeriod]);

    const toggleSymptom = (symptom: string) => {
        setSymptoms((prev) =>
            prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
        );
    };

    const handleSave = () => {
        if (!startDate || !endDate) return;

        const entry: PeriodEntry = {
            id: existingPeriod?.id || crypto.randomUUID(),
            startDate,
            endDate,
            flow,
            symptoms,
            notes,
        };

        onSave(entry);
    };

    const handleDelete = () => {
        if (existingPeriod) {
            onDelete(existingPeriod.id);
        }
    };

    if (!selectedDate && !existingPeriod) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">
                        {existingPeriod ? "Edit Period" : "Log Period"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                            />
                        </div>
                    </div>

                    {/* Flow Intensity */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Flow Intensity</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["light", "medium", "heavy"] as const).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setFlow(level)}
                                    className={`rounded-xl py-3 text-sm font-medium capitalize transition ${flow === level
                                            ? level === "light"
                                                ? "bg-pink-200 text-pink-800 ring-2 ring-pink-400"
                                                : level === "medium"
                                                    ? "bg-pink-400 text-white ring-2 ring-pink-500"
                                                    : "bg-pink-600 text-white ring-2 ring-pink-700"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {level === "light" && "💧"} {level === "medium" && "💧💧"} {level === "heavy" && "💧💧💧"}
                                    <span className="ml-1">{level}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Symptoms */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Symptoms</label>
                        <div className="flex flex-wrap gap-2">
                            {SYMPTOM_OPTIONS.map((symptom) => (
                                <button
                                    key={symptom}
                                    onClick={() => toggleSymptom(symptom)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${symptoms.includes(symptom)
                                            ? "bg-pink-500 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {symptom}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional notes..."
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        {existingPeriod && (
                            <button
                                onClick={handleDelete}
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                            >
                                Delete
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-200 transition hover:shadow-xl"
                        >
                            {existingPeriod ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
