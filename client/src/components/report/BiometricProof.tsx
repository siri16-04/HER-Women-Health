import type { BiometricSummary } from '../../types'

interface BiometricProofProps {
  summary: BiometricSummary
}

export default function BiometricProof({ summary }: BiometricProofProps) {
  const getBpmStatus = (bpm: number) => {
    if (bpm < 60) return { label: 'Below Normal', color: 'text-clinical-600' }
    if (bpm > 100) return { label: 'Elevated', color: 'text-warmth-600' }
    return { label: 'Normal', color: 'text-healing-600' }
  }

  const getHrvStatus = (hrv: number) => {
    if (hrv < 20) return { label: 'Low', color: 'text-warmth-600' }
    if (hrv > 50) return { label: 'Good', color: 'text-healing-600' }
    return { label: 'Moderate', color: 'text-clinical-600' }
  }

  const bpmStatus = getBpmStatus(summary.avgBpm)
  const hrvStatus = getHrvStatus(summary.avgHrv)
  const qualityPercent = Math.round((summary.validReadings / summary.totalReadings) * 100)

  return (
    <div className="card">
      <h2 className="text-lg font-medium text-neutral-800 mb-4">
        Biometric Evidence
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        Objective measurements captured during your {summary.scanDuration}-second scan
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Average BPM */}
        <div className="bg-neutral-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-neutral-800">{summary.avgBpm}</p>
          <p className="text-xs text-neutral-500">Avg BPM</p>
          <p className={`text-xs font-medium mt-1 ${bpmStatus.color}`}>
            {bpmStatus.label}
          </p>
        </div>

        {/* BPM Range */}
        <div className="bg-neutral-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-clinical-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h4l3-9 4 18 3-9h4"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-neutral-800">
            {summary.minBpm}-{summary.maxBpm}
          </p>
          <p className="text-xs text-neutral-500">BPM Range</p>
          <p className="text-xs text-neutral-400 mt-1">
            {summary.maxBpm - summary.minBpm} BPM variation
          </p>
        </div>

        {/* HRV */}
        <div className="bg-neutral-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-healing-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-neutral-800">{summary.avgHrv}</p>
          <p className="text-xs text-neutral-500">Avg HRV (ms)</p>
          <p className={`text-xs font-medium mt-1 ${hrvStatus.color}`}>
            {hrvStatus.label}
          </p>
        </div>

        {/* Signal Quality */}
        <div className="bg-neutral-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20v-6M6 20V10M18 20V4"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-neutral-800">{qualityPercent}%</p>
          <p className="text-xs text-neutral-500">Signal Quality</p>
          <p className="text-xs text-neutral-400 mt-1">
            {summary.validReadings}/{summary.totalReadings} readings
          </p>
        </div>
      </div>

      {/* Interpretation note */}
      <div className="mt-4 p-3 bg-clinical-50 rounded-lg border border-clinical-100">
        <p className="text-sm text-clinical-800">
          <strong>Note:</strong> These measurements were captured via contactless photoplethysmography (PPG)
          using your device camera. While indicative, they should be verified with clinical-grade equipment.
        </p>
      </div>
    </div>
  )
}
