import { useEffect, useRef } from 'react'
import { useSession } from '../../context/SessionContext'

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { cameraStream } = useSession()

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Face guide overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Oval guide */}
          <div
            className="w-48 h-64 border-2 border-dashed border-white/50 rounded-[50%]"
            style={{
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
            }}
          />

          {/* Corner guides */}
          <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-healing-400 rounded-tl-lg" />
          <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-healing-400 rounded-tr-lg" />
          <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-healing-400 rounded-bl-lg" />
          <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-healing-400 rounded-br-lg" />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-6 left-0 right-0 text-center">
        <p className="text-white/80 text-sm">
          Position your face within the guide
        </p>
      </div>
    </div>
  )
}
