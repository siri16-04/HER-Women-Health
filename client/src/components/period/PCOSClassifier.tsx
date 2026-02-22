import { useState } from "react";
import { classifyPCOSPhenotype } from "../../utils/healthcare";
import type { PCOSResult } from "../../utils/healthcare";

function ToggleSwitch({
    label,
    description,
    icon,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    icon: React.ReactNode;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all ${checked
                    ? "border-violet-400 bg-violet-50 shadow-md shadow-violet-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
        >
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${checked
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-200"
                        : "bg-slate-100 text-slate-400"
                    }`}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${checked ? "text-violet-800" : "text-slate-700"}`}>
                    {label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{description}</p>
            </div>
            <div
                className={`mt-1 h-6 w-11 shrink-0 rounded-full p-0.5 transition ${checked ? "bg-violet-500" : "bg-slate-200"
                    }`}
            >
                <div
                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </div>
        </button>
    );
}

export function PCOSClassifier() {
    const [irregularPeriods, setIrregularPeriods] = useState(false);
    const [highAndrogens, setHighAndrogens] = useState(false);
    const [polycysticOvaries, setPolycysticOvaries] = useState(false);
    const [result, setResult] = useState<PCOSResult | null>(null);

    const handleClassify = () => {
        setResult(classifyPCOSPhenotype(irregularPeriods, highAndrogens, polycysticOvaries));
    };

    const severityStyle = (severity: string) => {
        switch (severity) {
            case "high":
                return "bg-red-100 text-red-700 border-red-200";
            case "moderate":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "mild":
                return "bg-green-100 text-green-700 border-green-200";
            default:
                return "bg-slate-100 text-slate-600 border-slate-200";
        }
    };

    const phenotypeEmoji = (p: string | null) => {
        switch (p) {
            case "A": return "🔴";
            case "B": return "🟠";
            case "C": return "🟡";
            case "D": return "🟢";
            default: return "✅";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">PCOS Assessment</h2>
                <p className="mt-1 text-sm text-slate-500">Rotterdam Criteria (2003)</p>
            </div>

            {/* Info */}
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-sm text-violet-700">
                    PCOS diagnosis requires at least <strong>2 of 3</strong> criteria.
                    Toggle each criterion that applies to you.
                </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
                <ToggleSwitch
                    label="Irregular Periods"
                    description="Cycles longer than 35 days, fewer than 8 cycles/year, or absent periods"
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    checked={irregularPeriods}
                    onChange={setIrregularPeriods}
                />
                <ToggleSwitch
                    label="High Androgens"
                    description="Acne, excess hair growth, hair loss, or elevated androgen levels in blood tests"
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                    checked={highAndrogens}
                    onChange={setHighAndrogens}
                />
                <ToggleSwitch
                    label="Polycystic Ovaries"
                    description="12+ follicles per ovary or ovarian volume >10 mL on ultrasound"
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="3" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                        </svg>
                    }
                    checked={polycysticOvaries}
                    onChange={setPolycysticOvaries}
                />
            </div>

            <button
                onClick={handleClassify}
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:shadow-xl hover:shadow-violet-300 active:scale-[0.98]"
            >
                Assess Phenotype
            </button>

            {/* Results */}
            {result && (
                <div className="space-y-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-5">
                    <div className="text-center">
                        <span className="text-4xl">{phenotypeEmoji(result.phenotype)}</span>
                        <p className="mt-2 text-lg font-bold text-violet-800">{result.label}</p>
                        <span className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase ${severityStyle(result.severity)}`}>
                            {result.severity === "none" ? "No PCOS Detected" : `${result.severity} Risk`}
                        </span>
                    </div>

                    <div className="rounded-xl bg-white/70 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</p>
                        <p className="mt-1 text-sm text-slate-700">{result.description}</p>
                    </div>

                    <div className="rounded-xl bg-white/70 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recommendation</p>
                        <p className="mt-1 text-sm text-slate-700">{result.recommendation}</p>
                    </div>

                    {/* Phenotype table */}
                    {result.phenotype && (
                        <div className="overflow-hidden rounded-xl border border-violet-200">
                            <table className="w-full text-xs">
                                <thead className="bg-violet-100">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-violet-700">Type</th>
                                        <th className="px-3 py-2 text-center font-semibold text-violet-700">Irregular</th>
                                        <th className="px-3 py-2 text-center font-semibold text-violet-700">Androgens</th>
                                        <th className="px-3 py-2 text-center font-semibold text-violet-700">PCO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { p: "A", i: true, a: true, o: true },
                                        { p: "B", i: true, a: true, o: false },
                                        { p: "C", i: false, a: true, o: true },
                                        { p: "D", i: true, a: false, o: true },
                                    ].map((row) => (
                                        <tr
                                            key={row.p}
                                            className={`border-t border-violet-100 ${result.phenotype === row.p ? "bg-violet-100 font-bold" : "bg-white"}`}
                                        >
                                            <td className="px-3 py-2 text-slate-700">
                                                {result.phenotype === row.p ? "→ " : ""}Phenotype {row.p}
                                            </td>
                                            <td className="px-3 py-2 text-center">{row.i ? "✓" : "—"}</td>
                                            <td className="px-3 py-2 text-center">{row.a ? "✓" : "—"}</td>
                                            <td className="px-3 py-2 text-center">{row.o ? "✓" : "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
