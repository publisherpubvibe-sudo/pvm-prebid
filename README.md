# PubVibe SSP – Prebid Server Stack

A complete, self-hosted programmatic advertising stack built around
[Prebid Server (Go)](https://github.com/prebid/prebid-server) with the
**PubVibe SSP custom adapter**, a Node.js management API, a React
Admin Panel, and a React Publisher Dashboard.

---

## Architecture

```
Browser
  ├── Admin Panel        :80  (admin.pubvibe.com)
  └── Publisher Portal   :80  (pub.pubvibe.com)
             │
       [Nginx proxy]
             │
     ┌───────┴────────┐
     │  Node.js API   │  :4000   – Auth / Publisher / Log / Stats
     └───────┬────────┘
             │
    ┌────────┴──────────────────────┐
    │  MongoDB  :27017              │
    └───────────────────────────────┘

Publisher page (Prebid.js)
  └──► Prebid Server (Go)  :8000
            └──► PubVibe SSP Adapter
                    ├── US East   rtb-useast.trackifyy.com/rtb?zone=…
                    ├── US West   rtb-uswest.trackifyy.com/rtb?zone=…
                    ├── EU        rtb-eu.trackifyy.com/rtb?zone=…
                    └── APAC      rtb-apac.trackifyy.com/rtb?zone=…
```

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Docker | ≥ 24 |
| Docker Compose | ≥ 2.20 |

### 1 – Clone / extract the project

```bash
cd pubvibe-prebid-stack
```

### 2 – Run setup (Linux / macOS)

```bash
bash scripts/setup.sh
```

### 2 – Run setup (Windows PowerShell)

```powershell
.\scripts\setup.ps1
```

The script will:
- Generate a `.env` with random JWT secrets
- Build all Docker images
- Start all services
- Seed the default superadmin account

### 3 – Open the dashboards

| URL | Service |
|-----|---------|
| http://localhost | Admin Panel |
| http://pub.pubvibe.com | Publisher Portal |
| http://localhost:8000/status | Prebid Server health |
| http://localhost:4000/health | API health |

**Default admin credentials**
```
Email:    admin@pubvibe.com
Password: Admin@12345
```
> ⚠ Change the password immediately after first login via Settings.

---

## Services

### Prebid Server (Go)
- oRTB 2.5 auction endpoint: `POST /openrtb2/auction`
- PubVibe SSP adapter supports banner, video, and native
- 4 regional endpoints auto-selected per impression
- Prometheus metrics at `:8080/metrics`

### Backend API (`/api/…`)

| Route | Description |
|-------|-------------|
| `POST /auth/login` | Login (returns JWT) |
| `GET  /auth/me` | Current user |
| `GET  /publishers` | List publishers |
| `POST /publishers` | Create publisher account |
| `GET  /publishers/:id` | Publisher detail + ad units |
| `POST /publishers/:id/websites` | Add website |
| `POST /publishers/:id/adunits` | Add ad unit |
| `GET  /admins` | List admin users (superadmin only) |
| `POST /admins` | Create admin |
| `GET  /logs/auction` | Paginated auction logs |
| `GET  /logs/server` | Server log tail |
| `GET  /logs/errors` | Error log tail |
| `GET  /stats/overview` | KPI summary |
| `GET  /stats/timeseries` | Hourly chart data |
| `POST /test/bid` | Fire test bid to one region |
| `POST /test/bid-all` | Fire test bid to all 4 regions |

### Admin Panel
- Login / role-based access (superadmin → admin → publisher)
- Dashboard with KPI cards and charts
- Publisher CRUD (create, view, deactivate)
- Website approval queue
- Admin user CRUD (superadmin only)
- Auction log viewer with filters
- Server log viewer with auto-refresh
- **Bid Tester** – fire live oRTB 2.5 requests to any region and inspect full request/response
- Settings / password change

### Publisher Dashboard
- Dedicated portal per publisher (separate login)
- Overview: requests, wins, win rate, estimated earnings, region breakdown, charts
- My Websites: add domains, view approval status, ads.txt helper
- Ad Units: configure zones, sizes, regions
- Auction Logs: filtered view of own data only
- Integration: auto-generated Prebid.js snippet (basic + GPT + video)
- Settings: profile info, password change

---

## Prebid.js Integration

Copy `scripts/prebid-integration-example.html` as a starting point.

Minimum snippet:

```html
<script async src="https://cdn.jsdelivr.net/npm/prebid.js@latest/dist/not-for-prod/prebid.js"></script>
<div id="div-banner-1"></div>
<script>
  var pbjs = pbjs || {}; pbjs.que = pbjs.que || [];
  pbjs.que.push(function () {
    pbjs.addAdUnits([{
      code: 'div-banner-1',
      mediaTypes: { banner: { sizes: [[300, 250]] } },
      bids: [{
        bidder: 'pubvibe',
        params: { pubId: 'YOUR-PUB-ID', zoneId: '362093', region: 'useast' }
      }]
    }]);
    pbjs.requestBids({
      bidsBackHandler: function () {
        var bid = pbjs.getHighestCpmBids('div-banner-1')[0];
        if (bid) pbjs.renderAd(document, bid.adId);
      }
    });
  });
</script>
```

**ads.txt** – place at `https://yoursite.com/ads.txt`:
```
trackifyy.com, YOUR-PUB-ID, DIRECT
```

---

## PubVibe Regional Endpoints

| Region | Endpoint |
|--------|----------|
| US East (New York) | `https://rtb-useast.trackifyy.com/rtb?zone=362093` |
| US West (Phoenix)  | `https://rtb-uswest.trackifyy.com/rtb?zone=362093` |
| EU (Amsterdam)     | `https://rtb-eu.trackifyy.com/rtb?zone=362093` |
| APAC (Singapore)   | `https://rtb-apac.trackifyy.com/rtb?zone=362093` |

---

## Production Checklist

- [ ] Replace JWT secrets in `.env` with `openssl rand -hex 32` output
- [ ] Point DNS: `admin.pubvibe.com` and `pub.pubvibe.com` → server IP
- [ ] Add SSL certs to `nginx/certs/` and uncomment HTTPS blocks in `nginx/nginx.conf`
- [ ] Change default admin password after first login
- [ ] Set `debug: false` in Prebid.js snippets
- [ ] Replace `not-for-prod` Prebid.js CDN URL with your own build
- [ ] Add `ads.txt` to all publisher domains
- [ ] Configure firewall: only ports 80 and 443 should be public

---

## Directory Structure

```
pubvibe-prebid-stack/
├── prebid-server/               Prebid Server (Go) + PubVibe adapter
│   ├── adapters/pubvibe/        pubvibe.go – oRTB 2.5 adapter
│   ├── static/bidder-info/      pubvibe.yaml
│   ├── static/bidder-params/    pubvibe.json (JSON schema)
│   ├── config/prebid-config.yaml
│   └── Dockerfile
├── backend/                     Node.js REST API
│   └── src/
│       ├── routes/              auth, publishers, admins, logs, stats, test…
│       ├── models/              User, Publisher, AuctionLog
│       ├── middleware/          JWT auth, RBAC
│       └── services/            logger, seedAdmin
├── admin-panel/                 React Admin Panel
│   └── src/pages/               Login, Dashboard, Publishers, Admins,
│                                Websites, AuctionLogs, ServerLogs,
│                                BidTester, Settings
├── publisher-dashboard/         React Publisher Portal
│   └── src/pages/               Login, Overview, MyWebsites, AdUnits,
│                                AuctionLogs, Integration, Settings
├── nginx/                       Reverse proxy config
├── scripts/
│   ├── setup.sh                 Linux/macOS setup
│   ├── setup.ps1                Windows PowerShell setup
│   └── prebid-integration-example.html
├── docker-compose.yml
└── .env                         Secrets (never commit)
```
