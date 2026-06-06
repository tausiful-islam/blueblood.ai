# BlueBlood.ai - Project Memory & Build Log

## Project Overview
- **Name**: BlueBlood.ai
- **Track**: Reasoning Agents - Microsoft Foundry (Hackathon)
- **Tagline**: Multi-Agent Global Health Intelligence Platform
- **Story**: Horseshoe crab blood protects human health -> BlueBlood.ai extends that legacy as an AI immune system for global public health

## Azure Resources
- **Project Name**: blueblood-ai
- **Project Endpoint**: https://blueblood-ai-resource.services.ai.azure.com/api/projects/blueblood-ai
- **Azure OpenAI Endpoint**: https://blueblood-ai-resource.openai.azure.com/
- **Model**: o4-mini (deployment name: o4-mini)
- **API Version**: 2025-04-01-preview
- **Resource Group**: AI

## Credentials (ROTATE AFTER HACKATHON)
- Stored in .env file
- Keys were shared publicly - MUST rotate after submission

## Architecture
```
Data Sources (WHO RSS, NewsAPI)
       |
  Sentinel Agent       <- Detects health threats
       |
  Verification Agent   <- Checks source credibility
       |
  Forecast Agent       <- Predicts risk escalation
       |
  Policy Agent         <- Generates recommendations
       |
  Explainability Agent <- Explains reasoning chain
       |
  Coordinator Agent    <- Synthesizes intelligence report
       |
  FastAPI Backend      <- REST API
       |
  Next.js Dashboard    <- Real-time UI
```

## Tech Stack
| Layer | Technology |
|---|---|
| AI Platform | Azure AI Foundry |
| LLM | o4-mini on Azure OpenAI |
| Backend | Python FastAPI |
| Frontend | Next.js + Tailwind CSS |
| Data Sources | WHO RSS, NewsAPI (mock fallback) |

## Project Structure
```
blueblood.ai/
  main.py              <- FastAPI app
  agents/
    __init__.py
    foundry_client.py   <- Azure OpenAI client
    pipeline.py         <- Multi-agent orchestration
  data/
    __init__.py
    feeds.py            <- WHO RSS + NewsAPI + mock data
  frontend/             <- Next.js dashboard
  .env                  <- API keys
  AGENTS.md             <- This file
```

## How to Run
```bash
# Backend
source venv/bin/activate
PYTHONPATH=. uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

## API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | / | Health check |
| POST | /analyze | Analyze custom text through agent pipeline |
| GET | /scan | Run full multi-agent scan of live feeds |
| GET | /latest | Get latest scan results |
| GET | /alerts | Get active alerts |
| GET | /risks | Get country risk map |

## Cost Estimate
- o4-mini: ~$1.10/M input tokens, ~$4.40/M output tokens
- Each full article analysis: 6 agent calls x ~300-500 tokens = ~$0.01-0.03
- Full scan (4 articles): ~$0.04-0.12 per scan
- Hackathon demo (20 scans): ~$1-3 total
- VERY affordable - should stay well under $5

## IMPORTANT REMINDERS
1. ROTATE API KEYS after hackathon submission
2. Keys were shared in chat - they are compromised
3. Frontend has demo mode (mock data) - works without backend
4. To use real data, get NewsAPI key from newsapi.org (free)

## Build Progress
- [x] Claude initial code (broken imports, old SDK)
- [x] Restructure into proper packages
- [x] Fix Azure OpenAI connection (endpoint format, max_completion_tokens)
- [x] Test full pipeline with mock data - WORKS
- [x] FastAPI backend running - WORKS
- [x] Next.js frontend builds - WORKS
- [x] Dashboard UI with 6 agents (Sentinel, Verification, Forecast, Policy, Explainability, Coordinator)
- [ ] Get NewsAPI key for real data
- [ ] Create agents in Azure Foundry portal UI (for judges to see)
- [ ] Record demo video
- [ ] Deploy
