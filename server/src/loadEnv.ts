/**
 * Load .env before any other app code so process.env is set when presageService etc. load.
 * Must be the first import in index.ts.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
