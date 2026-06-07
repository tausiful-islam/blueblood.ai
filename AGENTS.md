# BlueBlood.ai - Project Brain / Memory File

## WHO WE ARE
- **Name**: BlueBlood.ai
- **Hackathon**: Microsoft Agent Building Hackathon — Reasoning Agents Track (Microsoft Foundry)
- **Tagline**: Multi-Agent Global Health Intelligence Platform
- **Story**: Horseshoe crab blood protects human health → BlueBlood.ai extends that legacy as an AI immune system for global public health
- **Team**: Tausif Islam (tausiful-islam on GitHub, tausif.islam@hotmail.com, student at IUB Bangladesh)

## AZURE RESOURCES
- **Azure Account**: Student account, $200 credits
- **Project Name**: blueblood-ai
- **Project Endpoint**: https://blueblood-ai-resource.services.ai.azure.com/api/projects/blueblood-ai
- **Azure OpenAI Endpoint**: https://blueblood-ai-resource.openai.azure.com/
- **Model**: o4-mini (deployment name: o4-mini)
- **API Version**: 2025-04-01-preview
- **Resource Group**: AI
- **Old resource (bluebood)**: https://bluebood.services.ai.azure.com/ (may be deprecated, old project)

## CREDENTIALS (ALL COMPROMISED — SHARED IN CHAT)
- **Azure OpenAI Key**: Stored in .env (starts with LLTv...)
- **Azure Portal Key 1**: Stored in .env (starts with ybCr...)
- **NewsAPI Key**: 33d4fe25e998432c9e621a83bd850d71
- **MUST ROTATE ALL KEYS AFTER HACKATHON**

## GITHUB & DEPLOYMENT
- **Repo**: https://github.com/tausiful-islam/blueblood.ai
- **SSH Key**: Already set up at ~/.ssh/id_ed25519 (tausif.islam@hotmail.com)
- **Vercel**: Frontend deployed via GitHub auto-deploy, Root Directory = "frontend"
- **Vercel Env Var**: NEXT_PUBLIC_API_URL = https://crazy-insects-act.loca.lt (tunnel URL)
- **Backend**: Runs locally on port 8000, exposed via localtunnel

## TECH STACK
| Layer | Technology |
|---|---|
| AI Platform | Azure AI Foundry |
| LLM | o4-mini on Azure OpenAI |
| Backend | Python FastAPI (venv at ~/blueblood.ai/venv) |
| Frontend | Next.js 16 + Tailwind CSS 4 |
| Map | react-simple-maps (world choropleth) |
| Data Sources | NewsAPI, ReliefWeb API, ECDC RSS |
| Tunnel | localtunnel (`lt --port 8000`) |

## ARCHITECTURE
```
Data Sources (NewsAPI + ReliefWeb + ECDC RSS)
       ↓
  Sentinel Agent       ← Detects health threats from reports
       ↓
  Verification Agent   ← Checks source credibility & cross-references
       ↓
  Forecast Agent       ← Predicts 7d/30d risk + at-risk countries
       ↓
  Policy Agent         ← Generates actionable recommendations
       ↓
  Explainability Agent ← Explains WHY alert was generated (reasoning chain)
       ↓
  Coordinator Agent    ← Synthesizes final intelligence briefing
       ↓
  FastAPI Backend      ← REST API (auto-scans on startup)
       ↓
  Next.js Dashboard    ← Interactive world map + alerts + agent activity
```

## PROJECT STRUCTURE
```
blueblood.ai/
  main.py                    ← FastAPI app (v3.0)
  .env                       ← API keys (GITIGNORED)
  requirements.txt
  start-backend.sh           ← ./start-backend.sh
  start-frontend.sh          ← ./start-frontend.sh
  start-tunnel.sh            ← ./start-tunnel.sh
  agents/
    __init__.py
    foundry_client.py         ← Azure OpenAI client (AzureOpenAI + API key auth)
    pipeline.py               ← 6-agent pipeline with all system prompts
  data/
    __init__.py
    feeds.py                  ← NewsAPI + ReliefWeb + ECDC + country ISO mapping
  frontend/
    app/
      page.tsx                ← Main dashboard (v3.0 - map + alerts + agents + analyze)
      components/
        WorldMap.tsx           ← react-simple-maps choropleth component
      layout.tsx
      globals.css
    types/
      react-simple-maps.d.ts  ← Type declarations
    .npmrc                    ← legacy-peer-deps=true (for react-simple-maps)
    .env.local                ← NEXT_PUBLIC_API_URL=http://localhost:8000
```

## HOW TO RUN (3 TERMINALS)
```bash
# Terminal 1 — Backend
cd ~/blueblood.ai
./start-backend.sh
# Wait ~30s for auto-scan to complete

# Terminal 2 — Tunnel (for Vercel to reach backend)
cd ~/blueblood.ai
./start-tunnel.sh
# Copy the URL shown, update Vercel env var if changed

# Terminal 3 — Frontend (optional, Vercel handles this)
cd ~/blueblood.ai
./start-frontend.sh
```

## API ENDPOINTS
| Method | Endpoint | Description |
|---|---|---|
| GET | / | Health check (shows version + model) |
| POST | /analyze | Analyze custom text through all 6 agents |
| GET | /scan | Run full multi-agent scan of live feeds (takes 30-90s) |
| GET | /latest | Get latest scan results (used by frontend auto-load) |
| GET | /alerts | Get active alerts |
| GET | /risks | Get country risk map with ISO codes |

## KEY TECHNICAL DECISIONS
1. **o4-mini not gpt-4o** — gpt-4o had "insufficient quota" on student account. o4-mini deployed fine.
2. **API key auth not DefaultAzureCredential** — No `az` CLI installed, no sudo access. AzureKeyCredential doesn't work for Agent Service management API. So we use `AzureOpenAI` client directly with API key.
3. **No PromptAgentDefinition agents on Foundry** — Creating agents via SDK requires TokenCredential (az login). Our agents run as Python functions with system prompts, calling Azure OpenAI directly. Still uses Azure AI Foundry as the platform (model + endpoint).
4. **react-simple-maps not react-leaflet** — Simpler SVG-based choropleth, no SSR issues, works with TopoJSON directly.
5. **localtunnel not ngrok** — ngrok requires account signup. localtunnel is free, no signup.
6. **max_completion_tokens not max_tokens** — o4-mini doesn't support max_tokens parameter.

## BUILD PROGRESS LOG

### v1.0 (Claude's code) — BROKEN
- [x] Initial code structure from Claude
- [x] Agent logic (Sentinel, Verification, Forecast, Coordinator)
- [x] Dashboard UI (dark theme)
- [ ] Broken imports (files at root, not in packages)
- [ ] Old SDK (azure-ai-projects==1.0.0b3)
- [ ] Used raw AzureOpenAI calls, not Foundry Agent Service
- [ ] No real data sources

### v2.0 (First fix)
- [x] Restructured into proper packages (agents/, data/)
- [x] Fixed Azure OpenAI connection (endpoint format, o4-mini compat)
- [x] Tested full pipeline with mock data — WORKS
- [x] FastAPI backend running
- [x] Next.js frontend builds
- [x] Deployed to Vercel (Root Directory = "frontend")
- [x] GitHub repo set up with SSH key
- [x] Added NewsAPI key — real health news working
- [x] Tunnel via localtunnel working
- [ ] Demo mode was still present
- [ ] Only 4 hardcoded mock countries
- [ ] No world map

### v3.0 (Major redesign — current)
- [x] Interactive world choropleth map (react-simple-maps)
- [x] Real data sources: NewsAPI + ReliefWeb API + ECDC RSS
- [x] Auto-scan on backend startup
- [x] Agent Activity Panel (shows multi-agent reasoning)
- [x] Outbreak details with predicted at-risk countries
- [x] Removed demo mode
- [x] Country ISO codes for map coloring
- [x] 3 tabs: THREATS / AGENTS / ANALYZE
- [x] Fixed data/__init__.py import error
- [x] Fixed .npmrc for react-simple-maps peer dep conflict

### CURRENT ISSUES (AS OF NOW)
- [ ] **CRITICAL: Map shows no colored countries** — agents may not be returning proper country_iso codes, or the scan data isn't reaching the frontend
- [ ] **CRITICAL: 0 threats detected after scan** — possible issues:
  1. Backend auto-scan might be failing silently (ReliefWeb API format issues)
  2. Agent responses may not parse correctly (JSON parsing errors)
  3. Country ISO mapping may not match world-atlas TopoJSON IDs (3-digit numeric)
  4. Frontend may not be fetching /latest on load correctly
- [ ] **Tunnel keeps dying** — localtunnel is unreliable, URL changes each restart
- [ ] Need to verify: run backend locally → curl localhost:8000/scan → check what comes back
- [ ] Need to verify: check that agent output includes country_iso matching 3-digit codes

## DEBUGGING CHECKLIST
When resuming work, check these:
1. Is backend running? → `curl localhost:8000/`
2. Is tunnel alive? → `curl https://crazy-insects-act.loca.lt/`
3. Does scan return data? → `curl localhost:8000/scan` (wait 60-90s)
4. Do agents return country_iso? → Check scan response for country_iso fields
5. Do ISO codes match map? → world-atlas uses 3-digit numeric (e.g. "050" for Bangladesh)
6. Is Vercel pointing to correct tunnel URL? → Check Vercel settings → Environment Variables

## COST ESTIMATE
- o4-mini: ~$1.10/M input tokens, ~$4.40/M output tokens
- Each full article analysis: 6 agent calls × ~300-500 tokens = ~$0.01-0.03
- Full scan (5-10 articles): ~$0.05-0.20 per scan
- Hackathon demo: ~$2-5 total
- **Student credits ($200) should last well beyond the hackathon**

## REMINDERS
1. **ROTATE ALL API KEYS** after hackathon — they were shared in this chat
2. Keys compromised: Azure OpenAI key, Azure Portal key, NewsAPI key
3. To add real agents in Azure Foundry portal: go to ai.azure.com → Agents → Create 6 agents with prompts from pipeline.py
4. For demo: backend MUST be running locally + tunnel MUST be alive
5. Vercel frontend is static — it only shows live data when backend is reachable through tunnel
