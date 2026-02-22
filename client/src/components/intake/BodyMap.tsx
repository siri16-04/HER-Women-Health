import { useApp } from '../../context/AppContext'
import type { BodyPart } from '../../types'

const bodyRegions: { id: BodyPart; label: string; path: string }[] = [
  {
    id: 'head',
    label: 'Head',
    path: 'M150,30 C170,30 185,45 185,70 C185,95 170,110 150,110 C130,110 115,95 115,70 C115,45 130,30 150,30',
  },
  {
    id: 'thyroid',
    label: 'Thyroid',
    path: 'M135,115 L165,115 L165,135 L135,135 Z',
  },
  {
    id: 'chest',
    label: 'Chest',
    path: 'M110,140 L190,140 L195,180 L105,180 Z',
  },
  {
    id: 'breast',
    label: 'Breast',
    path: 'M115,180 L185,180 L180,220 L120,220 Z',
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    path: 'M120,220 L180,220 L175,280 L125,280 Z',
  },
  {
    id: 'pelvic',
    label: 'Pelvic',
    path: 'M125,280 L175,280 L185,320 L115,320 Z',
  },
  {
    id: 'back',
    label: 'Back',
    path: 'M195,140 L210,140 L210,280 L195,280 Z M90,140 L105,140 L105,280 L90,280 Z',
  },
  {
    id: 'extremities',
    label: 'Arms & Legs',
    path: 'M80,150 L100,150 L95,250 L75,250 Z M200,150 L220,150 L225,250 L205,250 Z M120,320 L140,320 L135,420 L115,420 Z M160,320 L180,320 L185,420 L165,420 Z',
  },
]

export default function BodyMap() {
  const { selectedBodyParts, toggleBodyPart } = useApp()

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 300 450"
        className="w-full max-w-xs"
        role="img"
        aria-label="Female body map for symptom selection"
      >
        {/* Background silhouette */}
        <path
          d="M150,30 C175,30 190,50 190,75 C190,95 175,115 150,115 C125,115 110,95 110,75 C110,50 125,30 150,30
             M150,115 L150,120 C155,120 165,125 165,130 L165,135
             M150,115 L150,120 C145,120 135,125 135,130 L135,135
             M135,135 L105,140 L75,155 L70,250 L100,280 L105,280 L105,140 L135,135
             M165,135 L195,140 L225,155 L230,250 L200,280 L195,280 L195,140 L165,135
             M105,140 L195,140 L200,280 L185,320 L180,420 L160,420 L155,320 L145,320 L140,420 L120,420 L115,320 L100,280 L105,140"
          fill="#f0fdf4"
          stroke="#bbf7d0"
          strokeWidth="2"
        />

        {/* Clickable regions */}
        {bodyRegions.map((region) => {
          const isSelected = selectedBodyParts.includes(region.id)
          return (
            <g key={region.id}>
              <path
                d={region.path}
                fill={isSelected ? '#22c55e' : 'transparent'}
                fillOpacity={isSelected ? 0.4 : 0}
                stroke={isSelected ? '#15803d' : '#94a3b8'}
                strokeWidth={isSelected ? 2 : 1}
                strokeDasharray={isSelected ? 'none' : '4,2'}
                className="cursor-pointer transition-all duration-200 hover:fill-healing-200 hover:fill-opacity-50"
                onClick={() => toggleBodyPart(region.id)}
                role="button"
                aria-label={`Select ${region.label}`}
                aria-pressed={isSelected}
              />
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {bodyRegions.map((region) => {
          const isSelected = selectedBodyParts.includes(region.id)
          return (
            <button
              key={region.id}
              onClick={() => toggleBodyPart(region.id)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-healing-700 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-healing-100'
                }
              `}
            >
              {region.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
