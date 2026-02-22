# RapidAPI – Get Cycle Insights to Respond

To have **RapidAPI** supply AI cycle insights (phase, ovulation, fertile window, etc.), do the following.

---

## 1. Pick an API on RapidAPI

1. Go to **https://rapidapi.com**
2. Sign in or create an account.
3. In the search bar, search for **"menstrual cycle"** or **"women's health"** or **"period prediction"**.
4. Open an API that offers cycle/period/ovulation predictions (e.g. **"Menstrual Cycle Phase Predictions and Insights"** or similar).
5. Open the API’s main page and go to the **"Endpoints"** or **"Code Snippets"** tab.

---

## 2. Subscribe and get your key

1. On the API page, click **"Subscribe to Test"** (or similar).
2. Choose a plan (often a **free** tier with a limited number of requests).
3. After subscribing, go to the **"Endpoints"** section.
4. Copy:
   - **API Key** (often shown as `x-rapidapi-key` in the snippet).
   - **Host** (e.g. `something.p.rapidapi.com`).
   - **Path** (e.g. `/predict`, `/insights`, or just `/`).  
   The path is the part after the host in the request URL (e.g. `https://HOST/predict` → path is `/predict`).

---

## 3. Configure your app

1. In the project root, open your **`.env`** file (copy from `.env.example` if you don’t have one).
2. Set:

```env
RAPID_API_KEY=paste_your_actual_key_here
RAPID_API_HOST=the-host-from-rapidapi.p.rapidapi.com
```

3. If the API’s code snippet uses a **path other than `/`** (e.g. `/predict` or `/get-insights`), add:

```env
RAPID_API_PATH=/predict
```

Use the exact path shown in the RapidAPI “Code Snippets” for that endpoint.

4. Save `.env` and **restart the server** (`cd server` then `npm run dev`).

---

## 4. Check that it works

1. Open the app and go to **Period Tracker**.
2. Open the **AI Cycle Insights** card and use **Refresh** if needed.
3. In the **server terminal**, look for:
   - `[RapidCycle] API data received and normalized` → RapidAPI is responding.
   - `[RapidCycle] RapidAPI returned no usable data` → key/host/path may be wrong or the API returned an error.
   - `[RapidCycle] RapidAPI not configured` → key/host missing or still set to placeholder in `.env`.

---

## 5. Find the correct endpoint path (if key works but insights don’t)

Your **key and host are valid** if you see a JSON response (e.g. `"Endpoint '/' does not exist"`). That means the **path** is wrong.

1. **Run the endpoint diagnostic** (from the `server` folder):
   ```bash
   npm run test:rapidapi:endpoints
   ```
2. Open **`server/src/scripts/test_output.txt`**. Look for a line like **`OK GET /get-phase`** or **`OK POST /predict`**.
3. If you see one, add to `.env`:
   ```env
   RAPID_API_PATH=/get-phase
   ```
   (use the path that showed **OK**).
4. **Get the path from RapidAPI** if the diagnostic finds no OK:
   - On rapidapi.com, open your API → **Endpoints** (or **Code Snippets**).
   - In the request URL you’ll see something like:  
     `https://womens-health-....p.rapidapi.com/XXXX`  
   - The part after the host (e.g. `/get-phase` or `/predict`) is **RAPID_API_PATH**. Set it in `.env`, restart the server, and try again.

## 6. If it still doesn’t respond

- **Confirm on RapidAPI**  
  In the API’s “Endpoints” tab, use **“Test Endpoint”** with the same parameters (e.g. `last_period_date`, `avg_cycle_length`). If it fails there, the issue is with the API or your subscription, not the app.

- **Server log**  
  When no path works, the server logs:  
  `[RapidCycle] RapidAPI did not return 200. Last response: 404 {"message":"Endpoint '...' does not exist"}`  
  That confirms the key is accepted and the path is wrong.

- **Run the simple test**  
  ```bash
  npm run test:rapidapi
  ```
  Then check `server/src/scripts/test_output.txt` for status and body.

- **Different API**  
  If you use another “menstrual cycle” or “period” API on RapidAPI, set:
  - `RAPID_API_HOST` to that API’s host.
  - `RAPID_API_PATH` to that API’s path (if it’s not `/`).

---

## Summary

| Step | Action |
|------|--------|
| 1 | Go to rapidapi.com → search “menstrual cycle” → open an API. |
| 2 | Subscribe (e.g. free tier) → copy **Key**, **Host**, and **Path** from Endpoints / Code Snippets. |
| 3 | In `.env`: set `RAPID_API_KEY`, `RAPID_API_HOST`, and `RAPID_API_PATH` (if path is not `/`). |
| 4 | Restart server, open Period Tracker, refresh insights. |
| 5 | If needed: Test Endpoint on RapidAPI, run `npm run test:rapidapi`, and check `test_output.txt`. |

Once RapidAPI responds, the app will merge that data with the built-in fallback so the AI insights card shows both API and local insights.
