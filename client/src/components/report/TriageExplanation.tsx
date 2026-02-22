import type { DiagnosisResult, UrgencyLevel } from '../../types'

interface TriageExplanationProps {
  diagnosis: DiagnosisResult
}

const urgencyStyles: Record<UrgencyLevel, { bg: string; text: string; border: string; label: string }> = {
  EMERGENCY: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    label: 'Seek Emergency Care',
  },
  URGENT: {
    bg: 'bg-warmth-100',
    text: 'text-warmth-800',
    border: 'border-warmth-200',
    label: 'See a Doctor Soon',
  },
  MODERATE: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    label: 'Schedule an Appointment',
  },
  LOW: {
    bg: 'bg-healing-100',
    text: 'text-healing-800',
    border: 'border-healing-200',
    label: 'Monitor at Home',
  },
}

export default function TriageExplanation({ diagnosis }: TriageExplanationProps) {
  const style = urgencyStyles[diagnosis.urgencyLevel]

  return (
    <div className="card">
      <h2 className="text-lg font-medium text-neutral-800 mb-4">
        AI Triage Assessment
      </h2>

      {/* Urgency Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${style.bg} ${style.border} border mb-6`}>
        {diagnosis.urgencyLevel === 'EMERGENCY' && (
          <svg className="w-5 h-5 text-red-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        <span className={`font-semibold ${style.text}`}>{style.label}</span>
      </div>

      {/* Urgency Reason */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">Why this urgency level?</h3>
        <p className="text-neutral-600">{diagnosis.urgencyReason}</p>
      </div>

      {/* Primary Assessment */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">Assessment</h3>
        <p className="text-neutral-800">{diagnosis.primaryAssessment}</p>
      </div>

      {/* Red Flags */}
      {diagnosis.redFlags.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Warning Signs to Watch
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {diagnosis.redFlags.map((flag, i) => (
              <li key={i} className="text-sm text-red-700">{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Differential Considerations */}
      {diagnosis.differentialConsiderations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Possible Considerations</h3>
          <div className="flex flex-wrap gap-2">
            {diagnosis.differentialConsiderations.map((condition, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">Recommendations</h3>
        <ul className="space-y-2">
          {diagnosis.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <svg className="w-5 h-5 text-healing-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-neutral-700">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Questions for Doctor */}
      {diagnosis.questionsForDoctor && diagnosis.questionsForDoctor.length > 0 && (
        <div className="mb-6 p-4 bg-healing-50 border border-healing-200 rounded-lg">
          <h3 className="text-sm font-medium text-healing-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Questions to Ask Your Doctor
          </h3>
          <ul className="space-y-2">
            {diagnosis.questionsForDoctor.map((question, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-healing-600 font-medium">{i + 1}.</span>
                <span className="text-healing-800">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Specialty Referral */}
      {diagnosis.specialtyReferral && (
        <div className="p-4 bg-clinical-50 border border-clinical-100 rounded-lg">
          <h3 className="text-sm font-medium text-clinical-800 mb-1">Suggested Specialist</h3>
          <p className="text-clinical-700">{diagnosis.specialtyReferral}</p>
        </div>
      )}
    </div>
  )
}
