import { useEffect, useState } from 'react'
import type { Clinic } from '../../types'

interface ClinicMapProps {
  clinics: Clinic[]
  userLocation: { lat: number; lng: number } | null
}

export default function ClinicMap({ clinics, userLocation }: ClinicMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Dynamically load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Dynamically load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setMapLoaded(true)
      document.body.appendChild(script)
    } else {
      setMapLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !userLocation || !window.L) return

    const mapContainer = document.getElementById('clinic-map')
    if (!mapContainer) return

    // Clear any existing map
    mapContainer.innerHTML = ''

    const map = window.L.map('clinic-map').setView(
      [userLocation.lat, userLocation.lng],
      13
    )

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // User location marker
    const userIcon = window.L.divIcon({
      className: 'user-marker',
      html: '<div class="w-4 h-4 bg-clinical-600 rounded-full border-2 border-white shadow-lg"></div>',
      iconSize: [16, 16],
    })

    window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('Your Location')

    // Clinic markers
    clinics.forEach((clinic) => {
      const clinicIcon = window.L.divIcon({
        className: 'clinic-marker',
        html: '<div class="w-6 h-6 bg-healing-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">+</div>',
        iconSize: [24, 24],
      })

      window.L.marker([clinic.location.lat, clinic.location.lng], { icon: clinicIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <strong>${clinic.name}</strong><br/>
            <span class="text-sm text-gray-600">${clinic.address}</span>
            ${clinic.phone ? `<br/><a href="tel:${clinic.phone}" class="text-blue-600">${clinic.phone}</a>` : ''}
          </div>
        `)
    })

    // Fit bounds to show all markers
    if (clinics.length > 0) {
      const allPoints = [
        [userLocation.lat, userLocation.lng],
        ...clinics.map((c) => [c.location.lat, c.location.lng]),
      ]
      map.fitBounds(allPoints as [number, number][], { padding: [50, 50] })
    }

    return () => {
      map.remove()
    }
  }, [mapLoaded, userLocation, clinics])

  if (!userLocation) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500">
          Enable location access to find nearby clinics
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Map container */}
      <div
        id="clinic-map"
        className="h-64 rounded-lg overflow-hidden border border-neutral-200"
      />

      {/* Clinic list */}
      {clinics.length > 0 ? (
        <div className="mt-4 space-y-3">
          {clinics.slice(0, 5).map((clinic) => (
            <div
              key={clinic.id}
              className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
            >
              <div className="w-8 h-8 bg-healing-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-healing-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-neutral-800 truncate">{clinic.name}</h4>
                <p className="text-sm text-neutral-500 truncate">{clinic.address}</p>
                {clinic.phone && (
                  <a
                    href={`tel:${clinic.phone}`}
                    className="text-sm text-clinical-600 hover:underline"
                  >
                    {clinic.phone}
                  </a>
                )}
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.location.lat},${clinic.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-clinical-600 hover:text-clinical-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-neutral-500">
          No nearby clinics found in your area.
        </p>
      )}
    </div>
  )
}

// Extend window for Leaflet
declare global {
  interface Window {
    L: typeof import('leaflet')
  }
}
