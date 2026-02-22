import { useApp } from '../../context/AppContext'
import type { LifeStage } from '../../types'

const lifeStages: { value: LifeStage; label: string; description: string }[] = [
  {
    value: 'menstruating',
    label: 'Menstruating',
    description: 'Regular menstrual cycles',
  },
  {
    value: 'pregnant',
    label: 'Pregnant',
    description: 'Currently expecting',
  },
  {
    value: 'postpartum',
    label: 'Postpartum',
    description: '0-12 months after birth',
  },
  {
    value: 'perimenopause',
    label: 'Perimenopause',
    description: 'Transitional phase (40-55)',
  },
  {
    value: 'menopause',
    label: 'Menopause',
    description: 'No period for 12+ months',
  },
  {
    value: 'postmenopause',
    label: 'Postmenopause',
    description: 'After menopause',
  },
]

export default function LifeStageSelector() {
  const { lifeStage, setLifeStage } = useApp()

  return (
    <div className="grid grid-cols-2 gap-3">
      {lifeStages.map((stage) => (
        <button
          key={stage.value}
          onClick={() => setLifeStage(stage.value)}
          className={`
            p-3 rounded-lg border-2 text-left transition-all duration-200
            ${lifeStage === stage.value
              ? 'border-healing-600 bg-healing-50'
              : 'border-neutral-200 hover:border-healing-300 bg-white'
            }
          `}
        >
          <span className={`
            block font-medium text-sm
            ${lifeStage === stage.value ? 'text-healing-700' : 'text-neutral-800'}
          `}>
            {stage.label}
          </span>
          <span className="block text-xs text-neutral-500 mt-0.5">
            {stage.description}
          </span>
        </button>
      ))}
    </div>
  )
}
