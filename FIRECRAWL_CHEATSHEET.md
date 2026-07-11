# Firecrawl MCP Cheat Sheet

A reference for using the Firecrawl MCP server to gather data from websites. When you ask me to scrape, crawl, search, or extract from a site, I use the tools below.

> **Status note:** As of writing, the Firecrawl MCP server is **not currently connected** to this Claude Code session. To enable these tools, the `firecrawl-mcp` server must be added to the MCP config with a `FIRECRAWL_API_KEY` (see [Setup](#setup)). Once connected, the tools appear as `firecrawl_*`.

---

## Quick decision guide — which tool do I reach for?

| I want to... | Use |
|---|---|
| Get the content of **one page I know the URL of** | `firecrawl_scrape` |
| Get content of **several specific URLs** | `firecrawl_batch_scrape` |
| **Discover all URLs** on a site (sitemap-style) | `firecrawl_map` |
| **Search the web** and optionally scrape results | `firecrawl_search` |
| **Crawl a whole site/section** following links | `firecrawl_crawl` → `firecrawl_check_crawl_status` |
| Pull **structured data** (JSON to a schema) from page(s) | `firecrawl_extract` |
| Answer a **complex, multi-source research question** | `firecrawl_agent` → `firecrawl_agent_status` |
| **Watch a page for changes** over time | `firecrawl_monitor_*` |

**Rule of thumb:**
- Known single URL → **scrape**
- Known many URLs → **batch_scrape**
- Unknown URLs, one domain → **map** (just links) or **crawl** (links + content)
- Unknown URLs, open web → **search**
- Need typed fields, not prose → **extract**

---

## Core tools

### `firecrawl_scrape` — single page → content
The workhorse. Fetches one URL and returns it as markdown (default), HTML, JSON, screenshot, etc. Handles JS-rendered pages.

Key params:
- `url` (required)
- `formats` — e.g. `["markdown"]`, `["html"]`, or structured JSON: `[{"type": "json", "schema": {...}, "prompt": "..."}]`
- `onlyMainContent` — strip nav/footer/boilerplate (default true)
- `includeTags` / `excludeTags` — CSS selectors to keep/drop
- `waitFor` — ms to wait for JS to render
- `maxAge` — serve from cache if page was scraped within N ms (much faster/cheaper)
- `actions` — interact before scraping: click, scroll, type, wait (for dynamic content)
- `redactPII` — redact personal info

```json
{ "url": "https://example.com/article", "formats": ["markdown"], "onlyMainContent": true }
```

### `firecrawl_batch_scrape` + `firecrawl_check_batch_status`
Scrape many **known** URLs in parallel. Returns an operation `id`; poll status with `check_batch_status`.

```json
{ "urls": ["https://site.com/a", "https://site.com/b"], "options": { "formats": ["markdown"] } }
```

### `firecrawl_map` — discover URLs
Fast way to get **every indexed URL** on a domain. Returns a link list, not content. Great first step before a targeted scrape/crawl.

```json
{ "url": "https://example.com" }
```
Useful params: `search` (filter URLs by keyword), `limit`, `includeSubdomains`.

### `firecrawl_search` — web search (+ optional scrape)
Search the open web and optionally scrape each result in one call.

```json
{ "query": "circulo financing rounds 2025", "limit": 5,
  "scrapeOptions": { "formats": ["markdown"], "onlyMainContent": true } }
```
Params: `query`, `limit`, `lang`, `country`, `tbs` (time filter), `scrapeOptions`.

### `firecrawl_crawl` + `firecrawl_check_crawl_status`
Asynchronously crawl a site, following links. Returns a job `id`; poll with `check_crawl_status`.

```json
{ "url": "https://example.com/blog", "maxDepth": 2, "limit": 50,
  "allowExternalLinks": false, "deduplicateSimilarURLs": true,
  "scrapeOptions": { "formats": ["markdown"] } }
```
Key params: `maxDepth`, `limit` (max pages — **always set this** to control cost), `includePaths`/`excludePaths`, `allowExternalLinks`, `deduplicateSimilarURLs`.

> ⚠️ Crawl can be slow and credit-hungry. Prefer `map` + targeted `batch_scrape` when you only need specific pages.

### `firecrawl_extract` — structured data via schema
LLM-powered extraction into a JSON schema across one or more URLs. Best for pulling typed fields (prices, names, dates, tables) rather than raw text.

```json
{ "urls": ["https://shop.com/product/123"],
  "prompt": "Extract product name, price, and availability",
  "schema": { "type": "object",
    "properties": { "name": {"type":"string"}, "price": {"type":"number"}, "inStock": {"type":"boolean"} } },
  "enableWebSearch": false }
```
Params: `urls`, `prompt`, `schema`, `systemPrompt`, `allowExternalLinks`, `enableWebSearch`.

---

## Advanced / agentic tools

### `firecrawl_agent` + `firecrawl_agent_status`
Autonomous research agent for **complex, multi-source** questions (it decides what to search/scrape). Async — returns a job `id`, poll with `agent_status`. Optionally constrain with `urls` and shape output with `schema`.

```json
{ "prompt": "Find the top 5 competitors of Circulo and their pricing", "schema": {...} }
```

### Feedback (credit refunds / quality)
- `firecrawl_search_feedback` — rate a search result set (`searchId`); can refund a credit.
- `firecrawl_feedback` — per-job feedback for v2 scrape/parse/map/search jobs.

### Monitoring (watch pages over time)
Create recurring checks that detect meaningful changes and (optionally) fire a webhook.

- `firecrawl_monitor_create` — `{ "page": "https://site.com/pricing", "goal": "Alert on pricing changes" }`
- `firecrawl_monitor_list` / `firecrawl_monitor_get` / `firecrawl_monitor_update`
- `firecrawl_monitor_run` — trigger a check now
- `firecrawl_monitor_checks` — list past checks (filter by `status`)
- `firecrawl_monitor_check` — get a single check's diff/judgment

---

## Output formats reference (`formats`)
- `markdown` — clean text, default, best for feeding to an LLM
- `html` / `rawHtml` — page HTML (rendered / unprocessed)
- `links` — all links on the page
- `screenshot` — image of the page
- `{ "type": "json", "schema": {...}, "prompt": "..." }` — structured extraction inline with a scrape

---

## Practical playbooks

**"Get me the data on page X"** → `firecrawl_scrape` with `formats: ["markdown"]`.

**"Summarize this whole docs site"** → `firecrawl_map` to list URLs → `firecrawl_batch_scrape` the relevant ones.

**"Find companies/articles about Y"** → `firecrawl_search` with `scrapeOptions` to get content in one shot.

**"Build a table of products/prices from this catalog"** → `firecrawl_map` (or `crawl`) to find product URLs → `firecrawl_extract` with a schema.

**"Crawl the blog and give me every post"** → `firecrawl_crawl` with `includePaths: ["/blog/.*"]` and a `limit`, then `check_crawl_status`.

**"Tell me when their pricing changes"** → `firecrawl_monitor_create`.

---

## Cost & etiquette tips
- Set a `limit` on `crawl` and `search` — they consume credits per page.
- Use `maxAge` on `scrape` to hit the cache for pages that don't change often.
- Prefer `map` + `batch_scrape` over a full `crawl` when you only need known sections.
- Use `onlyMainContent: true` to cut noise and token usage.
- Async tools (`crawl`, `batch_scrape`, `agent`) return a job `id` — I poll the matching `*_status` tool until done.

---

## Setup

Add to the MCP config (e.g. `~/.claude.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": { "FIRECRAWL_API_KEY": "fc-YOUR_KEY" }
    }
  }
}
```

Get an API key at https://www.firecrawl.dev. There's a `.env` file in this project — if it holds `FIRECRAWL_API_KEY`, reference it there rather than hardcoding.

Reference: https://github.com/firecrawl/firecrawl-mcp-server
