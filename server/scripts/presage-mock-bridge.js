#!/usr/bin/env node
/**
 * Mock Presage bridge for development/testing.
 *
 * Reads JSON lines from stdin: {"frame":"<base64>","timestamp":<ms>}
 * Outputs JSON lines to stdout: {"bpm":<n>,"hrv":<n>,"confidence":<0-1>}
 * On {"end":true} exits.
 *
 * Use with: PRESAGE_BRIDGE_PATH="server/scripts/presage-mock-bridge.js"
 * (The service prepends "node" for .js paths. Use an absolute path if needed.)
 */

const readline = require('readline')

let frameCount = 0
const baselineBpm = 70 + Math.random() * 12
const baselineHrv = 40 + Math.random() * 20

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })

rl.on('line', (line) => {
  let msg
  try {
    msg = JSON.parse(line)
  } catch {
    return
  }
  if (msg.end === true) {
    process.exit(0)
  }
  if (typeof msg.frame !== 'string' || typeof msg.timestamp !== 'number') {
    return
  }
  frameCount += 1
  const elapsed = (Date.now() - msg.timestamp) / 1000
  const breathingCycle = Math.sin(elapsed * 0.3) * 3
  const noise = (Math.random() - 0.5) * 4
  const bpm = Math.round(baselineBpm + breathingCycle + noise)
  const hrv = Math.round(baselineHrv + Math.sin(elapsed * 0.2) * 8 + (Math.random() - 0.5) * 6)
  const confidence = Math.min(0.6 + (elapsed / 30) * 0.3 + (Math.random() - 0.5) * 0.1, 0.98)
  const out = {
    bpm: Math.max(55, Math.min(110, bpm)),
    hrv: Math.max(15, Math.min(70, hrv)),
    confidence: Math.max(0.3, confidence),
  }
  console.log(JSON.stringify(out))
})

rl.on('close', () => process.exit(0))
