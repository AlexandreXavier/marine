# MarineTraffic Site Capture

Captured 2026-07-11 via Firecrawl. Starting point: the MADMAX vessel detail page
(`https://www.marinetraffic.com/en/ais/details/ships/shipid:6349012/mmsi:232028203/imo:0/vessel:MADMAX`).

## What the site does

MarineTraffic (owned by **Kpler**) is a live AIS ship-tracking platform. It aggregates
Automatic Identification System (AIS) transponder signals from vessels worldwide
(~313,000 vessels visible on the live map at capture time) and layers commercial
services on top:

- **Live map** — real-time positions of every AIS-broadcasting vessel, color-coded by ship type (Leaflet + Mapbox/OpenStreetMap tiles).
- **Vessel detail pages** — per-ship profile: current voyage, port call log, characteristics, ownership, performance insights, compliance status, photos, news. Much of the detail (lat/long, draught, port of registry, year built) is paywalled behind "Upgrade" prompts.
- **Directories** — searchable databases of vessels, ports, lighthouses, and maritime companies.
- **Maritime news** — editorial/news feed.
- **Paid plans** — subscription tiers unlock historical tracks, route forecasts, notifications, fleet dashboards, and API/data services (cross-sold to Kpler products).

The MADMAX page itself: a UK-flagged 12 m sailing vessel (MMSI 232028203, call sign MHNU5),
captured mid-voyage Figueira da Foz → Aveiro, Portugal.

## Brand & design system (see `vessel-madmax/branding.json`)

| Token | Value |
|---|---|
| Primary color | `#00ADEE` (MarineTraffic cyan) |
| Secondary | `#1B252E` (dark navy — sidebar/header) |
| Accent / links / CTA | `#136FD5` (blue) |
| Background | `#FFFFFF` |
| Font | Roboto (fallback Helvetica/Arial), Open Sans secondary |
| Sizes | h1 20px, h2 14px, body 13px |
| Spacing | 4px base unit, 4px border radius |
| Primary button | filled `#136FD5`, white text, pill (40px radius), soft blue shadow |
| Secondary button | outlined `#136FD5`, transparent, 4px radius |
| Tone | professional, maritime professionals & enthusiasts |

## Tech stack / components observed

- **React SPA with MUI (Material UI) + Emotion** — `css-*` hashed class names throughout; branding detector classified the framework as "material".
- **Leaflet** map library with **Mapbox** / **OpenStreetMap** tiles (attribution visible on map embeds).
- Left icon-rail navigation, top search bar, card-based content layout, tabbed vessel pages (Overview / Port call log / Characteristics / Ownership / Performance / Compliance / News).
- Auth is delegated to **Kpler's Auth0-style SSO** ("Log in to Kpler to continue to MarineTraffic" — LinkedIn / Google / Apple / email).
- Freemium gating: locked-content cards with "Upgrade" CTAs inline in the page.

## Folder contents

```
marinetraffic-capture/
├── README.md                  ← this file
├── discovered-urls.txt        ← 100 URLs found by site mapping (mostly vessel detail pages)
├── vessel-madmax/             ← the target page
│   ├── page.md                ← clean markdown content
│   ├── page.html              ← rendered HTML (code)
│   ├── links.txt              ← all outbound links on the page
│   ├── metadata.json          ← title, description, OG tags
│   ├── branding.json          ← extracted design system (colors, type, components)
│   └── screenshot-fullpage.png← full-page screenshot, top to bottom
└── pages/                     ← other key site sections (each: page.md + links.txt + screenshot-fullpage.png)
    ├── live-map/              ← /en/ais/home — the live world map (313K vessels)
    ├── vessels-directory/     ← /en/data/?asset_type=vessels — LOGIN-WALLED (Kpler SSO page captured)
    ├── ports-directory/       ← /en/data/?asset_type=ports — LOGIN-WALLED
    ├── companies-search/      ← /en/maritime-companies/search
    ├── maritime-news/         ← /en/maritime-news
    └── plans-pricing/         ← /en/online-services/plans
```

## Notes & limitations

- The vessels/ports **data directories redirect to a Kpler login** for anonymous
  visitors, so their captures show the SSO welcome screen instead of data tables.
- Site mapping surfaced mostly other `/en/ais/details/ships/...` vessel pages —
  the site is essentially one detail-page template instantiated per vessel/port/company,
  plus the live map and a handful of marketing/news pages.
- Screenshots are single stitched full-page PNGs (rendered at 1920px width).
