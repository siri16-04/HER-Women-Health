export interface PeriodEntry {
    id: string;
    startDate: string;
    endDate: string;
    flow: "light" | "medium" | "heavy";
    symptoms: string[];
    notes: string;
}

export interface DueDateResult {
    adjustedDueDate: Date;
    adjustmentDays: number;
    gestationalWeeks: number;
    gestationalDays: number;
    daysRemaining: number;
    trimester: string;
    progress: number;
}

export interface PCOSResult {
    phenotype: "A" | "B" | "C" | "D" | null;
    label: string;
    severity: "high" | "moderate" | "mild" | "none";
    description: string;
    recommendation: string;
}

export const SYMPTOM_OPTIONS = [
    "Cramps", "Headache", "Bloating", "Fatigue", "Acne",
    "Backache", "Mood Swings", "Cravings", "Nausea", "Breast Tenderness"
];

export function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

export function formatDisplayDate(dateStr: string | Date): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function calculateCycleStats(periods: PeriodEntry[]) {
    if (periods.length === 0) {
        return {
            cycleLengths: [],
            averageCycleLength: 28,
            averagePeriodLength: 5,
            nextPeriodDate: null,
            ovulationDate: null,
            fertileWindowStart: null,
            fertileWindowEnd: null
        };
    }

    const sorted = [...periods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const cycleLengths: number[] = [];
    const periodLengths: number[] = [];

    for (let i = 0; i < sorted.length; i++) {
        const end = new Date(sorted[i].endDate).getTime();
        const start = new Date(sorted[i].startDate).getTime();
        const length = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (length > 0 && length <= 15) periodLengths.push(length);

        if (i > 0) {
            const prevStart = new Date(sorted[i - 1].startDate).getTime();
            const cycleLength = Math.round((start - prevStart) / (1000 * 60 * 60 * 24));
            if (cycleLength >= 15 && cycleLength <= 60) cycleLengths.push(cycleLength);
        }
    }

    const averageCycleLength = cycleLengths.length > 0 ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : 28;
    const averagePeriodLength = periodLengths.length > 0 ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length) : 5;

    const lastPeriodDate = sorted[sorted.length - 1].startDate;
    const nextPeriodDateObj = new Date(lastPeriodDate);
    nextPeriodDateObj.setDate(nextPeriodDateObj.getDate() + averageCycleLength);

    const ovulationDateObj = new Date(nextPeriodDateObj);
    ovulationDateObj.setDate(ovulationDateObj.getDate() - 14);

    const fertileStartObj = new Date(ovulationDateObj);
    fertileStartObj.setDate(fertileStartObj.getDate() - 5);
    const fertileEndObj = new Date(ovulationDateObj);
    fertileEndObj.setDate(fertileEndObj.getDate() + 1);

    return {
        cycleLengths,
        averageCycleLength,
        averagePeriodLength,
        nextPeriodDate: formatDate(nextPeriodDateObj),
        ovulationDate: formatDate(ovulationDateObj),
        fertileWindowStart: formatDate(fertileStartObj),
        fertileWindowEnd: formatDate(fertileEndObj)
    };
}

export function calculateCycleChaosIndex(cycleLengths: number[]) {
    if (cycleLengths.length < 2) return null;
    const mean = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const variance = cycleLengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / cycleLengths.length;
    const stddev = Math.round(Math.sqrt(variance) * 10) / 10;

    if (stddev <= 2.5) {
        return { stddev, label: "Regular", labelColor: "green", advice: "Your cycles are very consistent. Excellent predictability." };
    } else if (stddev <= 5) {
        return { stddev, label: "Mildly Irregular", labelColor: "yellow", advice: "Slight variations in your cycle length. Normal for most." };
    } else {
        return { stddev, label: "Irregular", labelColor: "red", advice: "High variability. Consider tracking symptoms closely or consulting a doctor if trying to conceive." };
    }
}

export function calculateAdjustedDueDate(lmpDate: Date, cycleLength: number): DueDateResult {
    const adjustedLmp = new Date(lmpDate);
    const adjustmentDays = cycleLength - 28;

    // Naegele's rule adjusted for cycle length: LMP + 280 days + (Cycle_Length - 28)
    const dueDate = new Date(adjustedLmp);
    dueDate.setDate(dueDate.getDate() + 280 + adjustmentDays);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conceptionDate = new Date(adjustedLmp);
    conceptionDate.setDate(conceptionDate.getDate() + 14 + adjustmentDays);

    // Calculate gestation weeks and days
    const totalDaysPregnant = Math.max(0, Math.floor((today.getTime() - adjustedLmp.getTime()) / (1000 * 60 * 60 * 24)));
    const gestationalWeeks = Math.floor(totalDaysPregnant / 7);
    const gestationalDays = totalDaysPregnant % 7;

    const daysRemaining = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const totalPregnancyDays = 280 + adjustmentDays;
    const progress = Math.min(100, Math.max(0, (totalDaysPregnant / totalPregnancyDays) * 100));

    let trimester = "First Trimester";
    if (gestationalWeeks >= 13 && gestationalWeeks < 28) trimester = "Second Trimester";
    else if (gestationalWeeks >= 28) trimester = "Third Trimester";

    return {
        adjustedDueDate: dueDate,
        adjustmentDays,
        gestationalWeeks,
        gestationalDays,
        daysRemaining,
        trimester,
        progress
    };
}

export function classifyPCOSPhenotype(irregularPeriods: boolean, highAndrogens: boolean, polycysticOvaries: boolean): PCOSResult {
    const flags = [irregularPeriods, highAndrogens, polycysticOvaries].filter(Boolean).length;
    if (flags < 2) {
        return {
            phenotype: null,
            label: "Criteria Not Met",
            severity: "none",
            description: "You do not meet the Rotterdam criteria for PCOS diagnosis.",
            recommendation: "Continue tracking your cycles. If you have concerns, consult a doctor."
        };
    }

    if (irregularPeriods && highAndrogens && polycysticOvaries) {
        return { phenotype: "A", label: "Classic PCOS", severity: "high", description: "All three criteria are present.", recommendation: "Consult an endocrinologist for comprehensive management and metabolic screening." };
    } else if (irregularPeriods && highAndrogens && !polycysticOvaries) {
        return { phenotype: "B", label: "Classic PCOS (Non-PCO)", severity: "high", description: "Irregular cycles and high androgens, but normal ovaries.", recommendation: "Focus on androgen management and irregular cycle regulation." };
    } else if (!irregularPeriods && highAndrogens && polycysticOvaries) {
        return { phenotype: "C", label: "Ovulatory PCOS", severity: "moderate", description: "Regular cycles but high androgens and polycystic ovaries.", recommendation: "Metabolic screening is recommended; fertility is often preserved." };
    } else {
        return { phenotype: "D", label: "Non-Hyperandrogenic PCOS", severity: "mild", description: "Irregular cycles and polycystic ovaries without high androgens.", recommendation: "Usually associated with fewer metabolic risks. Focus on cycle regulation." };
    }
}
