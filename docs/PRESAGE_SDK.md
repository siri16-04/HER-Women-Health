# Presage Vitals: Mock vs Real

The app supports **Presage-style** vitals (heart rate, HRV from camera). By default it uses **simulated** vitals so it works out of the box. To use **real** Presage, you need either a Presage-compatible HTTP API or the Presage C++ SDK (via a bridge).

**In the UI:** The diagnostic screen shows **"Vitals: Presage"** when real Presage is in use, and **"Vitals: Simulated"** when using the mock or in-process simulation.

**For outside users (end users):** Real Presage works for anyone visiting your site **if** the server is deployed with Presage configured (Docker engine, per-frame API, or C++ bridge). End users do not install anything; they just use the app and get real vitals when the server is set up for it. See [PRESAGE_DOCKER.md](PRESAGE_DOCKER.md#will-it-work-for-outside-users-end-users) for the Docker case.

---

## 1. Default: Simulated (mock)

- **No env vars** → server uses the **mock bridge** (simulated BPM/HRV). The UI shows "Vitals: Simulated."
- **Presage does not publish a public REST API** for "upload image → get vitals"; their C++/Android/iOS SDKs run on the device and talk to their backend internally. So the app cannot call Presage directly from Node unless you have a Presage-compatible endpoint or run the C++ SDK via a bridge.

```bash
# From HER (project root) – no env vars required
npm run dev
```

---

## 2. Real Presage: Three options

### Option A: Presage Engine (Docker) – recommended

Run the [deltahacks-12 presage-engine](https://github.com/seifotefa/deltahacks-12/tree/main/presage-engine) in Docker. HER collects frames during the scan, builds a video, and POSTs it to the engine for real BPM/HRV. Works on any OS (macOS, Windows, Linux); on Apple Silicon the container uses `linux/amd64` emulation.

**→ Full steps:** [**PRESAGE_DOCKER.md**](PRESAGE_DOCKER.md)

1. Add `PRESAGE_API_KEY` to `.env`.
2. From HER root: `docker-compose -f docker-compose.presage.yml up -d`.
3. Set `PRESAGE_VIDEO_API_URL=http://localhost:8080/process-video` and run `npm run dev`.
4. Install **ffmpeg** on the machine where the HER server runs (used to build the video from frames).

### Option B: Presage API (per-frame, direct from Node)

If you have a **Presage-compatible HTTP endpoint** (e.g. your own proxy or a future Presage API) that accepts `POST` with `{ frame: "<base64 JPEG>", timestamp: <ms> }` and returns `{ bpm, hrv, confidence }`:

```bash
export PRESAGE_API_URL=https://your-presage-api.com/v1/frame
export PRESAGE_API_KEY=your_key   # optional, sent as Bearer token
npm run dev
```

The server will POST each frame to that URL and use the response. The UI will show **"Vitals: Presage"**.

### Option C: Presage C++ SDK (bridge)

Presage’s **SmartSpectra C++ SDK** is not an npm package; you install it on the **machine** (e.g. Ubuntu 22.04) and run a **bridge** binary that reads frames from stdin and writes BPM/HRV to stdout. The server spawns that bridge when `PRESAGE_BRIDGE_PATH` points to the binary.

**→ Step-by-step:** [**PRESAGE_CPP_BRIDGE_STEPS.md**](PRESAGE_CPP_BRIDGE_STEPS.md) – install SDK, build bridge, set env, verify.

1. Install the C++ SDK (see below).
2. Build a bridge that uses the SDK and speaks the [bridge contract](#bridge-contract).
3. Set:

```bash
export PRESAGE_API_KEY=your_key_from_physiology.presagetech.com
export PRESAGE_BRIDGE_PATH=/path/to/your/presage-bridge
npm run dev
```

The UI will show **"Vitals: Presage"** when the bridge is not the bundled mock.

---

## 3. Install the C++ SDK (for Option C: bridge)

The SmartSpectra C++ SDK is installed **on the system** (e.g. Ubuntu 22.04), not via npm.

### 3.1 Supported systems

- **Public packages**: Ubuntu 22.04 / Linux Mint 21, amd64.
- Other OS/arch: see [Presage C++ docs](https://docs.physiology.presagetech.com/cpp/index.html).

### 3.2 Install on Ubuntu 22.04 / Mint 21

**From the project (recommended):**

```bash
# From HER (project root)
./scripts/install-presage-sdk.sh
```

**Or manually:**

```bash
# Add Presage PPA
curl -s "https://presage-security.github.io/PPA/KEY.gpg" | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/presage-technologies.gpg >/dev/null
sudo curl -s --compressed -o /etc/apt/sources.list.d/presage-technologies.list \
  "https://presage-security.github.io/PPA/presage-technologies.list"

# Install SDK and build tools
sudo apt update
sudo apt install -y libsmartspectra-dev build-essential cmake
```

### 3.3 Build tools (for building your bridge)

To compile a C++ bridge that uses the SDK:

```bash
sudo apt install -y build-essential git libcurl4-openssl-dev libssl-dev pkg-config \
  libv4l-dev libgles2-mesa-dev libunwind-dev
# CMake 3.27+ required – install from https://cmake.org/download if needed
```

---

## 4. Bridge contract

For Option C (C++ bridge), the server spawns one process per scan and talks to it over stdin/stdout:

- **Stdin** (JSON lines, one per frame): `{"frame":"<base64 JPEG>","timestamp":<ms>}`. Session end: `{"end":true}` then stdin is closed.
- **Stdout** (JSON lines, one per frame): `{"bpm":<n>,"hrv":<n>,"confidence":<0-1>}`. One line per frame sent.

---

## 5. Using real Presage after SDK install

1. **Build a bridge binary** that:
   - Reads JSON lines from stdin: `{"frame":"<base64>","timestamp":<ms>}`.
   - Decodes frames, feeds them into the SmartSpectra SDK.
   - Writes one JSON line per frame to stdout: `{"bpm":<n>,"hrv":<n>,"confidence":<0-1>}`.
   - Exits on `{"end":true}`.

   Use the [SmartSpectra C++ samples](https://github.com/Presage-Security/SmartSpectra/tree/main/cpp/samples) (e.g. `minimal_rest_spot_example`) as a starting point.

2. **Point the server at the bridge:**

   ```bash
   export PRESAGE_API_KEY=your_key
   export PRESAGE_BRIDGE_PATH=/absolute/path/to/your/presage-bridge
   npm run dev
   ```

The server will spawn this binary per scan session and use its stdout for BPM/HRV. No changes to the website or REST API are needed.

---

## 6. Summary

| Goal                         | What to do |
|-----------------------------|------------|
| Use vitals (default)        | Do nothing—mock bridge runs; UI shows "Vitals: Simulated" |
| **Real Presage via Docker** | See [PRESAGE_DOCKER.md](PRESAGE_DOCKER.md): start Presage Engine container, set `PRESAGE_VIDEO_API_URL`, install ffmpeg |
| Real Presage via per-frame API | Set `PRESAGE_API_URL` (and optionally `PRESAGE_API_KEY`); UI shows "Vitals: Presage" |
| Real Presage via C++ bridge | Install SDK, build bridge, set `PRESAGE_BRIDGE_PATH` and `PRESAGE_API_KEY`; UI shows "Vitals: Presage" |
| Disable bridge (simulation only) | Set `PRESAGE_BRIDGE_PATH=""` |
| Install SDK on Linux        | Run `./scripts/install-presage-sdk.sh` or the manual `apt` steps above |

- API key: [physiology.presagetech.com](https://physiology.presagetech.com)  
- C++ SDK docs: [docs.physiology.presagetech.com/cpp](https://docs.physiology.presagetech.com/cpp/index.html)
