# Presage via Docker (Presage Engine)

You can run **real Presage vitals** using the [deltahacks-12 presage-engine](https://github.com/seifotefa/deltahacks-12/tree/main/presage-engine): a Docker container that runs the Presage SmartSpectra C++ SDK and exposes an HTTP API. HER collects camera frames during the scan, builds a video, and sends it to the Presage Engine for real BPM/HRV.

This works on **any host OS** (macOS, Windows, Linux) because the SDK runs inside an Ubuntu 22.04 container. On Apple Silicon Macs, the image uses `linux/amd64` with emulation.

---

## Will it work for outside users (end users)?

**Yes.** Once the **server** is deployed with Presage Engine and env vars set up:

- **End users** (anyone visiting your HER site) do **not** need to install anything or configure anything. They open the app, grant camera access, and run a vitals scan. If your server is configured for Presage (Docker engine + `PRESAGE_VIDEO_API_URL`), they get **real** Presage vitals and the UI shows **"Vitals: Presage"**.
- **You (the deployer)** must:
  1. Run the Presage Engine container where the HER server can reach it (e.g. same host or same network).
  2. Set `PRESAGE_VIDEO_API_URL` (and `PRESAGE_API_KEY` in `.env`) on the HER server.
  3. Install **ffmpeg** on the machine where the HER server runs.

So: **outside users get real Presage vitals as long as your deployment has Presage configured.** They only need a browser and camera access.

---

## Prerequisites

- **Docker** and **Docker Compose**
- **ffmpeg** installed on the machine where the HER **server** runs (used to build the video from frames). Install: `apt install ffmpeg` (Linux), `brew install ffmpeg` (macOS), or [ffmpeg.org](https://ffmpeg.org/download.html).
- A **Presage API key** from [physiology.presagetech.com](https://physiology.presagetech.com)

---

## Step 1: Add your API key

In the **HER project root**, ensure `.env` contains:

```bash
PRESAGE_API_KEY=your_key_from_physiology.presagetech.com
```

The Presage Engine container reads this via `env_file: .env`.

---

## Step 2: Start the Presage Engine container

From the **HER project root**:

```bash
docker-compose -f docker-compose.presage.yml up -d
```

This builds the image (clones [deltahacks-12/presage-engine](https://github.com/seifotefa/deltahacks-12/tree/main/presage-engine) and installs the Presage SDK inside the container) and runs the engine on port **8080**.

**Check that it’s running:**

```bash
curl http://localhost:8080/health
# Should return: OK

curl http://localhost:8080/status
# Returns JSON with SDK status
```

**Logs:**

```bash
docker-compose -f docker-compose.presage.yml logs -f
```

---

## Step 3: Point HER at the Presage Engine

Add to your **`.env`** (so you don’t have to set it every time):

```bash
PRESAGE_VIDEO_API_URL=http://localhost:8080/process-video
```

Then start HER:

```bash
npm run dev
```

**Do I have to run Docker every time?** No. Two options:

- **Start the Presage Engine once and leave it running.** The container uses `restart: unless-stopped`, so it stays up. Then you only run `npm run dev` when you work on the app; the engine is already there.
- **One command for “Presage + app”:** Run `npm run dev:presage` from the project root. It brings up the Presage Engine container (if not already running) and then starts the app. Ensure `PRESAGE_VIDEO_API_URL` is in `.env` as above.

If the server runs in another environment (e.g. another host or Docker), use that host/port instead of `localhost` (e.g. `http://presage_engine:8080/process-video` if the server is in the same Docker network).

---

## Step 4: Run a scan

1. Open the app (e.g. http://localhost:5173).
2. Complete intake and go to the diagnostic session.
3. Start a vitals scan (camera on). **Scan for at least 3–5 seconds** so enough frames are collected (the server needs at least 15 frames for the Presage Engine). The overlay may show simulated values during the scan.
4. When the scan finishes, the server builds a short video from the frames, sends it to the Presage Engine, and uses the returned vitals for the summary and diagnosis.
5. The UI should show **“Vitals: Presage”** when the engine is used.

---

## How it works

- **During the scan:** The client sends each frame (base64 JPEG) to the HER server. When `PRESAGE_VIDEO_API_URL` is set, the server **stores** these frames and returns mock readings for the live overlay.
- **When the scan ends:** The server builds an MP4 from the stored frames (using **ffmpeg**), POSTs it to `PRESAGE_VIDEO_API_URL` (Presage Engine’s `/process-video`). The Presage Engine runs the SmartSpectra SDK on the video and returns a vitals summary (heart rate, breathing rate). The server maps that to `BiometricSummary` and uses it for the diagnosis.

So Presage runs **inside Docker**; HER only needs Docker, ffmpeg, and the env var.

---

## Troubleshooting

### “Unauthorized access” / 401 / Usage verification failed: UNAUTHENTICATED

The Presage Engine calls Presage’s **Physiology API** (cloud) to verify your API key. A **401** or **“Usage verification failed: UNAUTHENTICATED”** means that call is failing.

**1. Use the correct API key**

- Get the key from **[physiology.presagetech.com](https://physiology.presagetech.com)** (sign in → API keys / developer settings).
- Use the **Physiology API** key, not a different product key.
- Ensure the key is active and not revoked; check that your account has credits if required.

**2. Put the key in `.env` in the project root**

From the **HER project root** (where `docker-compose.presage.yml` lives), create or edit `.env`:

```bash
PRESAGE_API_KEY=your_actual_key_here
```

- No spaces around `=`.
- No quotes unless your key contains spaces (usually it doesn’t).
- No trailing spaces or newlines after the key.
- **Do not commit real keys to git** (`.env` should be in `.gitignore`).

**3. Confirm the key reaches the container**

Restart the stack so the container gets the latest env:

```bash
docker-compose -f docker-compose.presage.yml down
docker-compose -f docker-compose.presage.yml up -d
```

Then check that the key is set inside the container (value will be visible; do this only on your own machine):

```bash
docker-compose -f docker-compose.presage.yml exec presage_engine env | grep -E 'SMARTSPECTRA_API_KEY|PRESAGE_API_KEY'
```

You should see `SMARTSPECTRA_API_KEY` and/or `PRESAGE_API_KEY` with your key. If they are empty, `.env` is not in the right place or not being loaded (run `docker-compose` from the project root).

**4. If you use a separate env file**

If you use another file (e.g. `.env.presage`), pass it explicitly:

```bash
docker-compose -f docker-compose.presage.yml --env-file .env.presage up -d
```

**5. Still 401?**

- Regenerate the key in the [Physiology dashboard](https://physiology.presagetech.com) and update `.env`.
- Confirm account/contract allows API usage (e.g. credits, plan).
- Contact Presage: **support@presagetech.com**.

---

### “ffmpeg not found” or build fails

Install ffmpeg where the **HER server** runs:

- Ubuntu/Debian: `sudo apt install ffmpeg`
- macOS: `brew install ffmpeg`

### Presage Engine container won’t start

- Check logs: `docker-compose -f docker-compose.presage.yml logs`
- Ensure `PRESAGE_API_KEY` is set in `.env`.
- On Apple Silicon: the compose file uses `platform: linux/amd64`; first build can be slow due to emulation.

### “Presage Video API 500” or no vitals

- Ensure the container is up: `curl http://localhost:8080/health`
- Check engine logs for SDK errors.
- Use a video where the face is clearly visible and well lit; Presage needs a visible face to compute vitals.

### Port 8080 in use

Change the host port in `docker-compose.presage.yml`, e.g.:

```yaml
ports:
  - "9080:8080"
```

Then set `PRESAGE_VIDEO_API_URL=http://localhost:9080/process-video`.

---

## Reference

- [deltahacks-12 presage-engine](https://github.com/seifotefa/deltahacks-12/tree/main/presage-engine) – Docker setup and Presage SDK usage
- [Presage SmartSpectra SDK](https://docs.physiology.presagetech.com/cpp/index.html) – C++ SDK docs
- [PRESAGE_SDK.md](PRESAGE_SDK.md) – Other Presage integration options (per-frame API, C++ bridge)
