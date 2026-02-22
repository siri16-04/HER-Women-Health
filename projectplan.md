# HER Implementation Plan

## Overview
A minimal, clean medical web app for Women's Health AI-driven triage. Validates symptoms using biometric data to prevent medical dismissal and provides documentation for doctor visits.

---

## Tech Stack
- **Frontend**: React + Vite, Tailwind CSS (clinical UI)
- **Backend**: Node.js (Express)
- **AI**: Gemini API (diagnostic logic with female-specific prompts)
- **Voice**: ElevenLabs (calming therapeutic voice)
- **Biometrics**: Presage C++ SDK (via Node.js bridge) for BPM/HRV
- **Maps**: OpenStreetMap + Leaflet.js (free, no API key)
- **State**: React Context (no database for MVP)

---

## Project Structure

```
HER/
├── client/                          # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Button, Card, Modal, Spinner
│   │   │   ├── intake/              # BodyMap, LifeStageSelector
│   │   │   ├── diagnostic/          # CameraView, BiometricOverlay, VoicePlayer
│   │   │   └── report/              # BiometricProof, TriageExplanation, ClinicMap
│   │   ├── pages/
│   │   │   ├── IntakePage.tsx
│   │   │   ├── DiagnosticSessionPage.tsx
│   │   │   └── ValidationReportPage.tsx
│   │   ├── context/                 # AppContext, BiometricContext, SessionContext
│   │   ├── hooks/                   # useCamera, useBiometrics, useVoice
│   │   └── services/                # API client
│   └── package.json
│
├── server/                          # Node.js Express Backend
│   ├── src/
│   │   ├── routes/                  # biometrics, diagnosis, voice, clinics
│   │   ├── services/                # Presage, Gemini, ElevenLabs, OpenStreetMap
│   │   └── prompts/                 # Female health triage system prompts
│   └── package.json
│
└── package.json                     # Root workspace config
```

---

## App Flow (3 Pages)

### Page 1: Intake Page
- Female anatomical SVG body map with clickable regions
- Life stage selector: Menstruating, Pregnant, Postpartum, Perimenopause, Menopause, Postmenopause
- Body regions: Head, Thyroid, Chest, Breast, Abdomen, Pelvic, Back, Extremities
- Symptom details with severity (1-10)
- "Start Scan" button to proceed

### Page 2: Diagnostic Session Page
- Camera access via MediaDevices API with face guide overlay
- Presage scan runs for 30-60 seconds
- Real-time BPM/HRV display overlay
- ElevenLabs voice-over phases: welcome → positioning → scanning → midway → completing → complete
- Sends to Gemini: body parts + life stage + biometric summary

### Page 3: Validation Report Page
- Biometric proof card (avg BPM, HRV range, scan confidence)
- AI triage explanation with urgency level (Emergency/Urgent/Moderate/Low)
- Recommendations and potential conditions
- Leaflet.js map with nearby Women's Health Clinics
- Download/print report option

---

## Backend API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/biometrics/start` | Initialize scan session |
| POST | `/api/biometrics/frame` | Process video frame → return BPM/HRV |
| POST | `/api/biometrics/stop` | End scan, get summary |
| POST | `/api/diagnosis/analyze` | Send intake + biometrics to Gemini |
| POST | `/api/voice/stream` | Get ElevenLabs audio for phase |
| GET | `/api/clinics/nearby` | Find clinics via OpenStreetMap Overpass API |

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your API keys:
```
GEMINI_API_KEY=your_key
ELEVENLABS_API_KEY=your_key
PRESAGE_API_KEY=your_key
```

### 3. Run Development Servers
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## Environment Variables Required

```
# Server
GEMINI_API_KEY=AIzaSyDf6ca8ohYWpw1b8VVELtg_KwmKrkTCAGk
ELEVENLABS_API_KEY=sk_bb694e0a45159511a58bcfda67dd75818ba690f188ca25d7
PRESAGE_API_KEY=soccnkJ9DJ71jJa3OMME10jUQLn7FOr71cb8QsUd

# Client (VITE_ prefix)
VITE_API_BASE_URL=http://localhost:3001
```

**Note**: OpenStreetMap/Leaflet.js require NO API keys - completely free to use.

---

## Supabase Authentication & Database

### Overview
Users can sign up, log in, save diagnostic sessions, and view historical data with graphs to share with their doctor.

### Database Schema

**Tables:**
- `profiles` - User profiles (linked to Supabase auth.users)
- `sessions` - Diagnostic sessions with intake data
- `symptoms` - Symptoms per session
- `biometric_summaries` - BPM/HRV summary per session
- `diagnosis_results` - AI triage results per session

### New Routes
```
/auth     - Login/Signup page (public)
/         - IntakePage (protected)
/diagnostic - DiagnosticSessionPage (protected)
/report   - ValidationReportPage (protected)
/history  - HistoryPage with charts (protected)
```

### Key Files Added
- `client/src/lib/supabase.ts` - Supabase client
- `client/src/context/AuthContext.tsx` - Auth state management
- `client/src/components/common/ProtectedRoute.tsx` - Route guard
- `client/src/pages/AuthPage.tsx` - Login/signup UI
- `client/src/pages/HistoryPage.tsx` - View past sessions with charts
- `client/src/services/supabaseApi.ts` - Database CRUD operations
- `client/src/components/history/BiometricTrendChart.tsx` - Recharts line chart

### Environment Variables (Client)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### SQL Schema (Run in Supabase SQL Editor)
See `.claude/plans/resilient-juggling-graham.md` for full SQL schema with RLS policies.
