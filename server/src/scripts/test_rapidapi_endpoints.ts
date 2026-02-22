/**
 * Diagnostic: try many possible RapidAPI paths to find which one works.
 * Run: npx tsx src/scripts/test_rapidapi_endpoints.ts
 * Then check server/src/scripts/test_output.txt
 */
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../../.env') })

const apiKey = process.env.RAPID_API_KEY
const apiHost = process.env.RAPID_API_HOST
const logFile = path.join(__dirname, 'test_output.txt')

function log(msg: string) {
    console.log(msg)
    fs.appendFileSync(logFile, msg + '\n')
}

const lastPeriod = '2024-01-15'
const avgCycle = '28'
const q = `last_period_date=${lastPeriod}&avg_cycle_length=${avgCycle}`
const postBody = JSON.stringify({ last_period_date: lastPeriod, avg_cycle_length: Number(avgCycle) })

const pathsToTry = [
    '/',
    '/get-phase',
    '/get-phase-predictions',
    '/phase',
    '/phase-predictions',
    '/predict',
    '/predictions',
    '/insights',
    '/get-insights',
    '/menstrual-cycle',
    '/cycle',
    '/cycle-predictions',
    '/get-cycle',
    '/get-predictions',
    '/ovulation',
    '/fertile-window',
]

async function tryOne(method: string, path: string, withBody = false): Promise<{ status: number; body: string }> {
    const base = `https://${apiHost}${path}`
    const url = withBody ? base : `${base}?${q}`
    const opts: RequestInit = {
        method,
        headers: {
            'x-rapidapi-key': apiKey!,
            'x-rapidapi-host': apiHost!,
        },
    }
    if (withBody) {
        (opts.headers as Record<string, string>)['Content-Type'] = 'application/json'
        opts.body = postBody
    }
    const res = await fetch(url, opts)
    const body = await res.text()
    return { status: res.status, body: body.slice(0, 500) }
}

async function main() {
    fs.writeFileSync(logFile, '')
    log('RapidAPI endpoint diagnostic')
    log(`Host: ${apiHost}`)
    log(`Key: ${apiKey ? apiKey.slice(0, 8) + '...' : 'NOT SET'}`)
    log('')

    if (!apiKey || apiKey === 'your_rapidapi_key_here' || !apiHost) {
        log('ERROR: Set RAPID_API_KEY and RAPID_API_HOST in .env')
        return
    }

    for (const p of pathsToTry) {
        const pathStr = p || '/'
        const getUrl = `https://${apiHost}${pathStr}?${q}`
        try {
            const getResult = await tryOne('GET', pathStr, false)
            if (getResult.status === 200) {
                log(`OK GET  ${pathStr || '/'} -> ${getResult.status}`)
                log(`Body: ${getResult.body}`)
                log('')
                continue
            }
            const postResult = await tryOne('POST', pathStr, true)
            if (postResult.status === 200) {
                log(`OK POST ${pathStr || '/'} -> ${postResult.status}`)
                log(`Body: ${postResult.body}`)
                log('')
                continue
            }
            const errMsg = getResult.body.includes('"message"') ? getResult.body : postResult.body
            log(`-- ${pathStr || '/'} GET=${getResult.status} POST=${postResult.status} | ${errMsg.slice(0, 80)}`)
        } catch (e: any) {
            log(`-- ${pathStr || '/'} Error: ${e.message}`)
        }
    }

    log('')
    log('If no OK above: open this API on rapidapi.com, go to Endpoints, and copy the exact path from the code snippet into .env as RAPID_API_PATH=/that-path')
}

main()
