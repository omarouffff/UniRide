'use client'

import { useEffect, useRef, useState } from 'react'
import { Compass, MapPin } from 'lucide-react'

const pickupMarkers = [
  { label: 'Central Library', top: '18%', left: '24%' },
  { label: 'North Gate', top: '42%', left: '62%' },
  { label: 'Sports Hub', top: '68%', left: '33%' },
]

export default function HomeMap({ pickup, destination }: { pickup: string; destination: string }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [geoReady, setGeoReady] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState('')
  const [currentPosition, setCurrentPosition] = useState({ lat: 0, lng: 0 })
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!navigator.geolocation) {
      setMapError('Geolocation unavailable in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({ lat: position.coords.latitude, lng: position.coords.longitude })
        setGeoReady(true)
      },
      () => {
        setMapError('Allow location access to preview live routes.')
      },
      { timeout: 5000 }
    )
  }, [])

  useEffect(() => {
    if (!googleMapsKey || !geoReady || !mapRef.current) return

    const google = (window as any).google
    const renderMap = () => {
      if (!mapRef.current || !google?.maps) return

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: currentPosition.lat, lng: currentPosition.lng },
        zoom: 13,
        disableDefaultUI: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#94a3b8' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#1e293b' }],
          },
          {
            featureType: 'transit',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#94a3b8' }],
          },
        ],
      })

      new google.maps.Marker({ position: currentPosition, map, title: 'You are here' })
      new google.maps.Marker({ position: { lat: currentPosition.lat + 0.009, lng: currentPosition.lng + 0.014 }, map, title: pickup })
      new google.maps.Marker({ position: { lat: currentPosition.lat - 0.008, lng: currentPosition.lng + 0.03 }, map, title: destination })

      const routeLine = new google.maps.Polyline({
        path: [
          currentPosition,
          { lat: currentPosition.lat + 0.009, lng: currentPosition.lng + 0.014 },
          { lat: currentPosition.lat - 0.008, lng: currentPosition.lng + 0.03 },
        ],
        geodesic: true,
        strokeColor: '#34d399',
        strokeOpacity: 0.75,
        strokeWeight: 4,
      })
      routeLine.setMap(map)
      setMapLoaded(true)
    }

    if (google && google.maps) {
      renderMap()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}`
    script.async = true
    script.defer = true
    script.onload = () => renderMap()
    script.onerror = () => setMapError('Unable to load Google Maps. Check your API key.')
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [googleMapsKey, geoReady, currentPosition, pickup, destination])

  const hasFallback = !googleMapsKey || !!mapError

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),transparent_28%)]" />
      <div className="absolute inset-x-0 top-4 px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-3xl border border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl shadow-inner shadow-slate-950/20">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Live route preview</p>
            <h3 className="text-lg font-semibold text-white">{pickup} → {destination}</h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            <Compass className="h-4 w-4" />
            {geoReady ? 'Nearest pickup ETA 6 min' : 'Getting location...'}
          </div>
        </div>
      </div>
      <div ref={mapRef} className="relative h-full w-full rounded-[2rem]" />

      {hasFallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-950/85 p-6 text-center text-slate-200">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold">Live campus map ready</p>
            <p className="text-sm text-slate-400 max-w-sm">
              Enable a Google Maps API key with <code className="rounded bg-slate-900/70 px-2 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for full route visualization.
            </p>
          </div>
          <div className="grid gap-3 text-left sm:grid-cols-3">
            {pickupMarkers.map((marker) => (
              <div key={marker.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase text-slate-400">{marker.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">Nearby pickup</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pickup</p>
            <p className="mt-2 text-sm text-white">{pickup}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Destination</p>
            <p className="mt-2 text-sm text-white">{destination}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Nearest pickup</p>
            <p className="mt-2 text-sm text-white">{geoReady ? 'North Gate Stop' : 'Detecting...'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
