interface ScanProgressProps {
  duration: number
  elapsed: number
}

export default function ScanProgress({ duration, elapsed }: ScanProgressProps) {
  const progress = Math.min((elapsed / duration) * 100, 100)
  const remaining = Math.max(duration - elapsed, 0)

  return (
    <div className="absolute top-6 right-6 w-48">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-neutral-400 uppercase">Scanning</span>
          <span className="text-sm font-medium text-white">
            {remaining}s
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-clinical-500 to-healing-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phase indicator */}
        <div className="flex justify-between mt-2">
          <span className={`w-2 h-2 rounded-full ${elapsed > 0 ? 'bg-healing-500' : 'bg-neutral-600'}`} />
          <span className={`w-2 h-2 rounded-full ${elapsed > duration * 0.25 ? 'bg-healing-500' : 'bg-neutral-600'}`} />
          <span className={`w-2 h-2 rounded-full ${elapsed > duration * 0.5 ? 'bg-healing-500' : 'bg-neutral-600'}`} />
          <span className={`w-2 h-2 rounded-full ${elapsed > duration * 0.75 ? 'bg-healing-500' : 'bg-neutral-600'}`} />
          <span className={`w-2 h-2 rounded-full ${elapsed >= duration ? 'bg-healing-500' : 'bg-neutral-600'}`} />
        </div>
      </div>
    </div>
  )
}
