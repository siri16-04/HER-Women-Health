import type { Clinic } from '../types/index.js'

// OpenStreetMap Overpass API for finding nearby healthcare facilities
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter'

interface OverpassElement {
  type: string
  id: number
  lat: number
  lon: number
  tags?: {
    [key: string]: string | undefined
    name?: string
    'addr:street'?: string
    'addr:housenumber'?: string
    'addr:city'?: string
    'addr:postcode'?: string
    phone?: string
    website?: string
    healthcare?: string
    amenity?: string
    'healthcare:speciality'?: string
  }
}

interface OverpassResponse {
  elements: OverpassElement[]
}

export class ClinicsService {
  async findNearbyClinics(
    lat: number,
    lng: number,
    radiusMeters: number = 15000
  ): Promise<Clinic[]> {
    // Overpass query for health-related facilities (broader search)
    const query = `
      [out:json][timeout:25];
      (
        node["healthcare"](around:${radiusMeters},${lat},${lng});
        node["amenity"="doctors"](around:${radiusMeters},${lat},${lng});
        node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
        node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
        node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
        way["healthcare"](around:${radiusMeters},${lat},${lng});
        way["amenity"="doctors"](around:${radiusMeters},${lat},${lng});
        way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
        way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      );
      out body center;
    `

    try {
      console.log(`[clinics] Searching near ${lat},${lng} radius=${radiusMeters}m`)
      const response = await fetch(OVERPASS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ data: query }),
      })

      if (!response.ok) {
        console.error(`[clinics] Overpass API error: ${response.status}`)
        throw new Error(`Overpass API error: ${response.status}`)
      }

      const data = (await response.json()) as OverpassResponse
      console.log(`[clinics] Overpass returned ${data.elements?.length || 0} elements`)

      if (!data.elements) {
        console.warn('[clinics] No elements in Overpass response:', data)
        return []
      }

      const clinics: Clinic[] = data.elements
        .filter((el) => {
          try {
            // Must have coordinates (directly or via center for way/relation)
            const elLat = el.lat ?? (el as any).center?.lat
            const elLon = el.lon ?? (el as any).center?.lon
            return elLat != null && elLon != null
          } catch (e) {
            console.error('[clinics] Filter crash on element:', el, e)
            return false
          }
        })
        .map((el) => {
          try {
            const tags = el.tags || {}
            const address = this.buildAddress(tags)
            const elLat = el.lat ?? (el as any).center?.lat
            const elLon = el.lon ?? (el as any).center?.lon

            // Determine name
            let name = tags.name
            if (!name) {
              name = tags.operator || tags.brand
            }
            if (!name) {
              const type = tags.amenity || tags.healthcare || 'healthcare'
              name = `Unnamed ${type.charAt(0).toUpperCase() + type.slice(1)}`
            }

            return {
              id: `osm-${el.type}-${el.id}`,
              name,
              address,
              location: {
                lat: elLat,
                lng: elLon,
              },
              phone: tags.phone,
              website: tags.website,
              distance: this.calculateDistance(lat, lng, elLat, elLon),
              tags: this.extractTags(tags),
            }
          } catch (e) {
            console.error('[clinics] Map crash on element:', el, e)
            return null as any
          }
        })
        .filter((c) => c !== null)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20) // Limit to 20 results

      console.log(`[clinics] Returning ${clinics.length} clinics`)
      return clinics
    } catch (error) {
      console.error('[clinics] CRASH in findNearbyClinics:', error)
      return []
    }
  }

  private buildAddress(tags: OverpassElement['tags']): string {
    if (!tags) return 'Address not available'

    // Try full address first
    if (tags['addr:full']) return tags['addr:full']

    const parts = []

    // Street address
    const street = tags['addr:street'] || tags['contact:street'] || tags['addr:place']
    const number = tags['addr:housenumber'] || tags['contact:housenumber']

    if (number && street) {
      parts.push(`${number} ${street}`)
    } else if (street) {
      parts.push(street)
    }

    // City/District
    const city = tags['addr:city'] || tags['addr:district'] || tags['addr:suburb']
    if (city) {
      parts.push(city)
    }

    // Postcode
    const postcode = tags['addr:postcode'] || tags['contact:postcode']
    if (postcode) {
      parts.push(postcode)
    }

    // State/Province if available
    if (tags['addr:state']) {
      parts.push(tags['addr:state'])
    }

    return parts.length > 0 ? parts.join(', ') : 'Address not available'
  }

  private extractTags(tags: OverpassElement['tags']): string[] {
    if (!tags) return []

    const result: string[] = []

    if (tags.healthcare) {
      result.push(tags.healthcare === 'yes' ? 'Healthcare' : tags.healthcare)
    }
    if (tags.amenity) {
      result.push(tags.amenity)
    }
    if (tags['healthcare:speciality']) {
      result.push(...tags['healthcare:speciality'].split(';'))
    }
    if (tags.operator) {
      result.push(tags.operator)
    }

    return Array.from(new Set(result)) // Remove duplicates
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula
    const R = 6371e3 // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180
    const phi2 = (lat2 * Math.PI) / 180
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(R * c) // Distance in meters
  }
}

let clinicsService: ClinicsService | null = null

export function getClinicsService(): ClinicsService {
  if (!clinicsService) {
    clinicsService = new ClinicsService()
  }
  return clinicsService
}
