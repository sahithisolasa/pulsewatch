# PulseWatch: What Changed While You Were Away?

PulseWatch is a calm, signal-dense market digest for active investors tracking Indian equities on the **National Stock Exchange (NSE)**. Instead of bombarding users with noisy ticks, PulseWatch calculates a mathematical **Attention Score (0–100)** to surface what truly changed while you were away from the market.

---

## Market Data Modes

PulseWatch supports two data modes configured via the `MARKET_DATA_MODE` environment variable:

1. **`demo` (Default)**: Uses `DemoMarketDataProvider` with deterministic price paths, realistic volume anomalies, news catalysts, and simulation tools. Ideal for hackathons, automated tests, and offline evaluation.
2. **`live`**: Uses `UpstoxMarketDataProvider` connecting directly to the **Upstox API v2** for live/delayed NSE quotes, OHLC, volume, and intraday candles.

---

## Upstox API v2 Integration

PulseWatch connects to the Upstox API v2 (`https://api.upstox.com/v2/`) using server-side proxies to ensure all API secrets and tokens are never exposed to the client browser.

### Supported Equities & Instrument Key Mapping

Upstox requires explicit instrument keys formatted as `NSE_EQ|<ISIN>` for equities and `NSE_INDEX|<Name>` for indices. PulseWatch maps existing ticker symbols automatically:

| PulseWatch Ticker | Company Name | ISIN | Upstox Instrument Key |
|---|---|---|---|
| `TATAMOTORS` | Tata Motors Limited | `INE155A01022` | `NSE_EQ\|INE155A01022` |
| `INFY` | Infosys Limited | `INE009A01021` | `NSE_EQ\|INE009A01021` |
| `HDFCBANK` | HDFC Bank Limited | `INE040A01034` | `NSE_EQ\|INE040A01034` |
| `ITC` | ITC Limited | `INE154A01025` | `NSE_EQ\|INE154A01025` |
| `TCS` | Tata Consultancy Services | `INE467B01029` | `NSE_EQ\|INE467B01029` |
| `SBIN` | State Bank of India | `INE062A01020` | `NSE_EQ\|INE062A01020` |
| `ICICIBANK` | ICICI Bank Limited | `INE090A01021` | `NSE_EQ\|INE090A01021` |
| `RELIANCE` | Reliance Industries Limited | `INE002A01018` | `NSE_EQ\|INE002A01018` |
| `BHARTIARTL` | Bharti Airtel Limited | `INE397D01024` | `NSE_EQ\|INE397D01024` |
| `LT` | Larsen & Toubro Limited | `INE018A01030` | `NSE_EQ\|INE018A01030` |
| `NIFTY 50` | NIFTY 50 Benchmark Index | — | `NSE_INDEX\|Nifty 50` |
| `BANK NIFTY` | NIFTY Bank Index | — | `NSE_INDEX\|Nifty Bank` |
| `SENSEX` | BSE SENSEX 30 | — | `BSE_INDEX\|SENSEX` |

---

## Upstox Setup Instructions

### Option A: Direct Access Token (Fastest Setup)
Every trading day, Upstox generates a daily access token for your developer app. If you already have an access token:

1. Copy your Upstox access token from the [Upstox Developer Console](https://developer.upstox.com).
2. Set the environment variables in your environment or Google AI Studio Secrets:
   ```bash
   MARKET_DATA_MODE="live"
   UPSTOX_ACCESS_TOKEN="your_access_token_here"
   ```
3. Start or reload the application. The status indicator will turn green (`UPSTOX LIVE NSE`).

---

### Option B: Full OAuth 2.0 Authorization Code Flow
To enable automated login and token generation:

1. Create a developer app at [Upstox Developer Console](https://developer.upstox.com).
2. Set the **Redirect URL** in your Upstox App to:
   ```
   https://<your-app-url>/api/auth/upstox/callback
   ```
   (For local development: `http://localhost:3000/api/auth/upstox/callback`)
3. Configure your server environment variables:
   ```bash
   MARKET_DATA_MODE="live"
   UPSTOX_API_KEY="your_upstox_api_key"
   UPSTOX_API_SECRET="your_upstox_api_secret"
   UPSTOX_REDIRECT_URI="https://<your-app-url>/api/auth/upstox/callback"
   ```
4. Navigate to `/api/auth/upstox/login?redirect=true` in your browser.
5. Log in with your Upstox credentials and grant access.
6. The app exchanges the authorization code for an `access_token` automatically, activates live mode, and redirects back to the dashboard.

---

## Data Freshness States

PulseWatch classifies market data into four clear freshness states:

- **`LIVE`**: Active market session (09:15 to 15:30 IST, Monday–Friday) with fresh live ticks received from Upstox.
- **`DELAYED`**: Outside active trading hours, weekend, or post-market quotes.
- **`STALE`**: Network interruption or rate-limiting encountered; last known ticks served with warning details.
- **`DEMO`**: Demo provider active or resilient fallback engaged when credentials are not configured.

---

## Resilient Fallback Architecture

If `MARKET_DATA_MODE="live"` is configured but:
- No token has been supplied yet,
- The daily token has expired, or
- Upstox API returns an HTTP 401 / 500 error,

PulseWatch **never crashes or displays blank screens**. Instead, `UpstoxMarketDataProvider` automatically engages the resilient fallback mechanism, logs a server warning, and serves calibrated baseline quotes with status `STALE` or `DEMO`.

---

## API Endpoints

### Market Data Endpoints
- `GET /api/market/status` — Returns server mode, data freshness, benchmark, and token readiness.
- `POST /api/market/mode` — Dynamically switches mode: `{ "mode": "demo" | "live" }`.
- `POST /api/market/simulate` — Simulates market ticks on demo provider: `{ "scenario": "rally" | "selloff" | "jitter" }`.
- `GET /api/market/overview` — Retrieves indices (NIFTY 50, SENSEX, BANK NIFTY) and market trend.
- `GET /api/market/quote/:symbol` — Quote for a specific symbol.
- `GET /api/market/history/:symbol?timeframe=1D|1W|1M|3M` — Intraday and daily candlestick history.
- `GET /api/market/news/:symbol` — Factual catalysts and news.
- `POST /api/market/pulse` — Watchlist pulse calculation comparing prices against user checkpoints.

### Authentication & OAuth Endpoints
- `GET /api/auth/upstox/status` — Checks Upstox credentials and connection status.
- `GET /api/auth/upstox/login` — Initiates Upstox OAuth 2.0 flow.
- `GET /api/auth/upstox/callback` — Handles Upstox OAuth redirect and token exchange.

---

## Core Algorithm: Attention Score

PulseWatch calculates an Attention Score (0–100) using a 5-factor weighted statistical model:
1. **Price Movement vs. Checkpoint (35%)**: Sigmoid-scaled return relative to the last time the user checked.
2. **Volume Anomaly (25%)**: Ratio of current session volume against the 20-day average.
3. **Relative Performance vs. NIFTY 50 (20%)**: Excess alpha/beta divergence from the benchmark.
4. **Volatility Acceleration (10%)**: Shift in intraday trading range.
5. **Factual Catalysts (10%)**: Verified earnings, block deals, or management announcements.

Stocks are categorized into:
- **Needs Your Attention** (Score ≥ 61)
- **Worth Watching** (Score 31–60)
- **Stable** (Score 0–30)
