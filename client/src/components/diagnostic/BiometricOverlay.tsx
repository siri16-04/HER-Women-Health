import { useBiometrics } from '../../context/BiometricContext'

export default function BiometricOverlay() {
  const { currentBpm, currentHrv, currentConfidence, isScanning } = useBiometrics()

  if (!isScanning) return null

  return (
    <div className="absolute top-20 left-6 space-y-3">
      {/* BPM Card */}
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[140px]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {/* Pulse animation */}
            <div className="absolute inset-0 animate-ping">
              <svg className="w-5 h-5 text-red-500/50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase">Heart Rate</p>
            <p className="text-xl font-semibold text-white">
              {currentBpm !== null ? `${Math.round(currentBpm)}` : '--'}
              <span className="text-sm font-normal text-neutral-400 ml-1">BPM</span>
            </p>
          </div>
        </div>
      </div>

      {/* HRV Card */}
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[140px]">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-clinical-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <div>
            <p className="text-xs text-neutral-400 uppercase">HRV</p>
            <p className="text-xl font-semibold text-white">
              {currentHrv !== null ? `${Math.round(currentHrv)}` : '--'}
              <span className="text-sm font-normal text-neutral-400 ml-1">ms</span>
            </p>
          </div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
        <p className="text-xs text-neutral-400 uppercase mb-1">Signal Quality</p>
        <div className="flex gap-1">
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
            <div
              key={i}
              className={`h-2 w-4 rounded-sm transition-colors ${
                currentConfidence >= threshold
                  ? 'bg-healing-500'
                  : 'bg-neutral-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
