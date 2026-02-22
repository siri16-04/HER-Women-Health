// ... (imports and setup same as before)
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../../.env') })

const apiKey = process.env.RAPID_API_KEY
const apiHost = process.env.RAPID_API_HOST
const logFile = path.join(__dirname, 'test_output.txt')

function log(msg: string) {
    console.log(msg)
    fs.appendFileSync(logFile, msg + '\n')
}
fs.writeFileSync(logFile, '')

async function testGet() {
    const params = new URLSearchParams({
        last_period_date: '2024-01-15',
        avg_cycle_length: '28'
    })
    const url = `https://${apiHost}/?${params.toString()}`
    log(`\nTesting GET to: ${url}`)

    if (!apiKey || apiKey === 'your_rapidapi_key_here') {
        log('ERROR: Set RAPID_API_KEY in .env (get key from RapidAPI subscription)')
        return
    }

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost!
            }
        })
        log(`Status: ${res.status}`)
        const txt = await res.text()
        log(`Body: ${txt.slice(0, 800)}`)

        if (res.ok) {
            log('\nRapidAPI is working.')
        } else {
            log('\nRapidAPI returned an error. Check your key and API subscription on rapidapi.com.')
        }
    } catch (e: any) {
        log(`Error: ${e.message}`)
    }
}

testGet()
