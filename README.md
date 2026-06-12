# BlueBlood.ai
**Multi-Agent Global Health Intelligence Platform**

> Just as horseshoe crab blood has protected human health for millions of years, BlueBlood.ai extends that legacy — building an AI immune system for global public health.

Built for the **Microsoft AI Agents League Hackathon** — **Reasoning Agents Track**.

---

## What It Does

BlueBlood.ai monitors global health data sources in real-time using a 6-agent reasoning pipeline powered by **Azure AI Foundry** and the **o4-mini** reasoning model. It detects disease outbreaks, verifies source credibility, forecasts geographic spread, generates policy recommendations, explains its reasoning, and delivers actionable intelligence briefings — all through an interactive world map dashboard.

**Real-world use case**: Public health authorities, NGOs, and epidemiologists can use BlueBlood.ai to get early warning signals about disease outbreaks before they escalate, with full transparency into why each alert was generated.

---

## Architecture

```
Data Sources (NewsAPI + WHO RSS + ECDC RSS)
       |
  +-----------+
  | Sentinel  |  Detects health threats from reports
  +-----------+
       |
  +--------------+
  | Verification |  Checks source credibility & cross-references
  +--------------+
       |
  +-----------+
  | Forecast  |  Predicts 7d/30d risk + at-risk countries
  +-----------+
       |
  +--------+
  | Policy |  Generates actionable recommendations
  +--------+
       |
  +----------------+
  | Explainability |  Explains WHY alert was generated
  +----------------+
       |
  +------------+
  | Coordinator|  Synthesizes final intelligence briefing
  +------------+
       |
  FastAPI Backend (REST API)
       |
  Next.js Dashboard (Interactive world map + alerts)
```

Each agent calls **Azure OpenAI o4-mini** via the Azure AI Foundry endpoint with specialized system prompts. The Coordinator pattern orchestrates all agents sequentially, passing structured context between them.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Platform | **Azure AI Foundry** |
| LLM | **o4-mini** (reasoning model) on Azure OpenAI |
| Agent Pattern | Custom Python Coordinator (6 sequential agents) |
| Backend | Python **FastAPI** with async support |
| Frontend | **Next.js 16** + **Tailwind CSS 4** |
| Map | **react-simple-maps** (SVG choropleth with TopoJSON) |
| Data Sources | **NewsAPI**, **WHO RSS**, **ECDC RSS** |
| Deployment | Vercel (frontend) + localtunnel (backend) |

---

## Project Structure

```
blueblood.ai/
  main.py                      FastAPI app (v3.0) with async auto-scan
  .env                         API keys (gitignored)
  requirements.txt             Python dependencies
  start-backend.sh             Start FastAPI server
  start-frontend.sh            Start Next.js dev server
  start-tunnel.sh              Expose backend via localtunnel
  AGENTS.md                    Project brain / memory file
  agents/
    __init__.py
    foundry_client.py          Azure OpenAI client (API key auth)
    pipeline.py                6-agent pipeline with system prompts
  data/
    __init__.py
    feeds.py                   NewsAPI + WHO RSS + ECDC + ISO mapping
  frontend/
    app/
      page.tsx                 Main dashboard (map + alerts + agents + analyze)
      components/
        WorldMap.tsx           react-simple-maps choropleth component
      layout.tsx
      globals.css
    types/
      react-simple-maps.d.ts   Type declarations
    .env.local                 NEXT_PUBLIC_API_URL
```

---

## The 6 Agents

### 1. Sentinel Agent
Scans news articles and health reports for signals of disease outbreaks, healthcare system stress, environmental health threats, and unusual health patterns. Returns structured threat data including disease name, location with ISO 3166-1 numeric code, severity, confidence score, and key signals found.

### 2. Verification Agent
Assesses source credibility using a tiered system (WHO/CDC/Reuters = tier1, established outlets = tier2, unknown = tier3). Evaluates specificity of claims, official confirmation language, and whether the threat matches known disease patterns. Returns credibility score and verification status.

### 3. Forecast Agent
Predicts 7-day and 30-day risk escalation probability using knowledge of historical outbreak patterns, regional climate, population density, and healthcare capacity. Returns risk level (green/yellow/orange/red), at-risk neighboring countries with ISO codes, and recommended public health actions.

### 4. Policy Agent
Generates actionable policy recommendations for public health decision-makers. Each recommendation includes the specific action, responsible party, timeline, and rationale. Also identifies resource needs and communication advisory.

### 5. Explainability Agent
Provides transparent reasoning for why each alert was generated, including evidence chain, confidence explanation, historical context, and known limitations. This makes the system auditable and trustworthy for health authorities.

### 6. Coordinator Agent
Synthesizes outputs from all preceding agents into a concise, professional intelligence briefing. First paragraph covers what is happening and why it matters, second covers recommended actions, and third covers what to watch for next.

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Azure account with AI Foundry access
- NewsAPI key (free at [newsapi.org](https://newsapi.org))

### 1. Clone the repo
```bash
git clone https://github.com/tausiful-islam/blueblood.ai.git
cd blueblood.ai
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env` with your keys:
```env
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_API_VERSION=2025-04-01-preview
MODEL_DEPLOYMENT_NAME=o4-mini
NEWS_API_KEY=your_newsapi_key
```

### 3. Backend setup
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Frontend setup
```bash
cd frontend
npm install
```

### 5. Run (3 terminals)

**Terminal 1 — Backend**
```bash
./start-backend.sh
```
Server starts immediately on `http://localhost:8000`. Auto-scan runs in background.

**Terminal 2 — Frontend**
```bash
./start-frontend.sh
```
Dashboard at `http://localhost:3000`.

**Terminal 3 — Tunnel** (for Vercel-deployed frontend)
```bash
./start-tunnel.sh
```
Update Vercel env var `NEXT_PUBLIC_API_URL` with the tunnel URL.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check (version + model info) |
| `GET` | `/health` | Simple health check |
| `POST` | `/analyze` | Analyze custom text through all 6 agents |
| `GET` | `/scan` | Run full multi-agent scan of live feeds (2-5 min) |
| `GET` | `/latest` | Get latest scan results (used by frontend) |
| `GET` | `/alerts` | Get active alerts |
| `GET` | `/risks` | Get country risk map with ISO codes |

### Example: Analyze a custom report
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "WHO reports 300 new Ebola cases in Democratic Republic of Congo this week. Health systems overwhelmed.",
    "source": "WHO Alert System"
  }'
```

---

## Key Technical Decisions

| Decision | Why |
|---|---|
| **o4-mini instead of GPT-4o** | GPT-4o had insufficient quota on Azure student account. o4-mini deployed successfully and provides strong reasoning capability. |
| **API key auth** | Student account has no `az` CLI, no sudo access. AzureKeyCredential doesn't work for Agent Service management API. Using `AzureOpenAI` Python client directly. |
| **Python function agents** | Creating agents via Foundry SDK requires TokenCredential (`az login`). Agents run as Python functions with system prompts calling Azure OpenAI directly — still uses Foundry as the AI platform. |
| **react-simple-maps** | Simpler SVG-based choropleth, no SSR issues with Next.js, works with TopoJSON directly. |
| **Sequential coordinator pattern** | Each agent's output feeds into the next, building cumulative context. This mirrors how epidemiologists actually analyze outbreaks. |
| **Non-blocking auto-scan** | Server starts immediately via `asyncio.create_task()`, auto-scan runs in background. Frontend polls `/latest` until results are ready. |
| **Credibility-adjusted filtering** | All detected threats are shown, but low-credibility ones get risk level downgraded (red -> orange -> yellow). Users see everything, with appropriate confidence signals. |
| **ISO 3166-1 numeric codes** | world-atlas TopoJSON uses 3-digit numeric country IDs. Agents return these codes for accurate map rendering. |

---

## Hackathon Track: Reasoning Agents

BlueBlood.ai demonstrates multi-step reasoning through its 6-agent pipeline:

1. **Signal Detection** (Sentinel) — extracts structured health threat data from unstructured news
2. **Source Validation** (Verification) — applies credibility scoring with strict assessment criteria
3. **Risk Forecasting** (Forecast) — predicts escalation probability and geographic spread
4. **Action Synthesis** (Policy) — generates concrete, actionable recommendations
5. **Explainability** (Explainability) — provides full reasoning chain for auditability
6. **Intelligence Briefing** (Coordinator) — synthesizes all outputs into human-readable report

Each step involves the o4-mini reasoning model analyzing cumulative context from previous agents, demonstrating true multi-step agentic reasoning rather than simple prompt-response patterns.

---

## Demo Flow

1. Open dashboard at `http://localhost:3000`
2. Click **RUN SCAN** — watch 6 agents activate
3. See the world map populate with color-coded risk countries
4. Click any alert on the right panel for full intelligence report
5. View forecast reasoning, at-risk regions, recommended actions
6. Check the **AGENTS** tab to see each agent's step-by-step output
7. Use the **ANALYZE** tab to paste custom text through all 6 agents

---

## Cost Estimate

| Component | Cost |
|---|---|
| o4-mini | ~$1.10/M input, ~$4.40/M output tokens |
| Per article analysis | 6 agent calls ~$0.01-0.03 |
| Full scan (10-15 articles) | ~$0.05-0.20 |
| Hackathon demo total | ~$2-5 |
| Azure student credits | $200 (well within budget) |

---

## Team

**Tausif Islam** — Student at IUB Bangladesh  
GitHub: [tausiful-islam](https://github.com/tausiful-islam)  
Email: tausif.islam@hotmail.com

Built for the **Microsoft AI Agents League Hackathon** — Reasoning Agents Track.
