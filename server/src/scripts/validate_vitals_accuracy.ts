/**
 * Validate Presage vitals accuracy vs wearable ground truth.
 *
 * Usage:
 *   npx tsx src/scripts/validate_vitals_accuracy.ts <path-to-csv>
 *
 * CSV columns (headers required):
 *   timestamp, presage_bpm, wearable_bpm, presage_hrv, wearable_hrv
 *
 * HRV columns are optional; if missing, HRV metrics are skipped.
 */
import fs from 'fs'
import path from 'path'

const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, 'vitals_accuracy_template.csv')

const BPM_THRESHOLD = 5
const HRV_THRESHOLD = 10

function parseCsv(content: string) {
  const lines = content.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) throw new Error('CSV must include header and at least one row.')

  const headers = lines[0]!.split(',').map(h => h.trim())
  const idx = (name: string) => headers.findIndex(h => h === name)

  const iTime = idx('timestamp')
  const iPBpm = idx('presage_bpm')
  const iWBpm = idx('wearable_bpm')
  const iPHrv = idx('presage_hrv')
  const iWHrv = idx('wearable_hrv')

  if (iPBpm < 0 || iWBpm < 0) {
    throw new Error('CSV must include presage_bpm and wearable_bpm columns.')
  }

  const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()))
  return { rows, iTime, iPBpm, iWBpm, iPHrv, iWHrv }
}

function mean(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

function run() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`CSV not found: ${inputPath}`)
  }

  const csv = fs.readFileSync(inputPath, 'utf8')
  const { rows, iTime, iPBpm, iWBpm, iPHrv, iWHrv } = parseCsv(csv)

  const bpmErrors: number[] = []
  const hrvErrors: number[] = []
  let bpmWithin = 0
  let hrvWithin = 0

  rows.forEach((cols, index) => {
    const pb = Number(cols[iPBpm])
    const wb = Number(cols[iWBpm])
    if (!isNaN(pb) && !isNaN(wb)) {
      const err = Math.abs(pb - wb)
      bpmErrors.push(err)
      if (err <= BPM_THRESHOLD) bpmWithin++
    }

    if (iPHrv >= 0 && iWHrv >= 0) {
      const ph = Number(cols[iPHrv])
      const wh = Number(cols[iWHrv])
      if (!isNaN(ph) && !isNaN(wh)) {
        const err = Math.abs(ph - wh)
        hrvErrors.push(err)
        if (err <= HRV_THRESHOLD) hrvWithin++
      }
    }
  })

  const bpmMae = mean(bpmErrors)
  const bpmPct = bpmErrors.length ? (bpmWithin / bpmErrors.length) * 100 : 0
  const hrvMae = mean(hrvErrors)
  const hrvPct = hrvErrors.length ? (hrvWithin / hrvErrors.length) * 100 : 0

  console.log('=== Presage Vitals Accuracy Report ===')
  console.log(`Samples (BPM): ${bpmErrors.length}`)
  console.log(`BPM MAE: ${bpmMae.toFixed(2)} | % within ±${BPM_THRESHOLD} BPM: ${bpmPct.toFixed(1)}%`)

  if (hrvErrors.length > 0) {
    console.log(`Samples (HRV): ${hrvErrors.length}`)
    console.log(`HRV MAE: ${hrvMae.toFixed(2)} | % within ±${HRV_THRESHOLD} ms: ${hrvPct.toFixed(1)}%`)
  } else {
    console.log('HRV columns missing or empty — HRV accuracy not evaluated.')
  }
}

run()
