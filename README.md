# 🦀 BlueBlood.ai
**Multi-Agent Global Health Intelligence Platform**

> Just as horseshoe crab blood has protected human health for millions of years, BlueBlood.ai extends that legacy — an AI immune system for global public health.

---

## Architecture

```
News/WHO Feeds
      ↓
 Sentinel Agent     ← Detects health threats
      ↓
Verification Agent  ← Checks source credibility
      ↓
  Forecast Agent    ← Predicts risk escalation
      ↓
 Coordinator Agent  ← Synthesizes final report
      ↓
 FastAPI Backend    ← REST API
      ↓
 Next.js Dashboard  ← Real-time UI
```

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Azure OpenAI (GPT-4o) via Azure AI Foundry |
| Agents | Custom Python agents (Coordinator pattern) |
| Backend | Python FastAPI |
| Frontend | Next.js + Tailwind CSS |
| Data Sources | NewsAPI, WHO RSS, PubMed |

---

## Setup Instructions

### 1. Azure AI Foundry Setup

1. Go to [portal.azure.com](https://portal.azure.com)
2. Search **"Azure OpenAI"** → Create resource
3. Region: **East US** or **Southeast Asia**
4. Once created → Go to resource → **Keys and Endpoint**
5. Copy **KEY 1** and **Endpoint**
6. Click **"Go to Azure OpenAI Studio"** or [oai.azure.com](https://oai.azure.com)
7. Click **Deployments** → **+ Create new deployment**
8. Select **gpt-4o** → Name it `gpt-4o` → Deploy

### 2. Get Free API Keys

- **NewsAPI**: Sign up free at [newsapi.org](https://newsapi.org) → copy API key

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your keys (see below)

# Run backend
uvicorn main:app --reload --port 8000
```

### 4. Configure .env

```env
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com/
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01
NEWS_API_KEY=your_newsapi_key_here
```

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/scan` | Run full multi-agent scan |
| GET | `/latest` | Get latest scan results |
| GET | `/alerts` | Get active alerts |
| GET | `/risks` | Get country risk map |
| POST | `/analyze` | Analyze custom text |

### Example: Analyze custom report

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "300 dengue cases reported in Dhaka in 48 hours", "source": "WHO"}'
```

---

## Agent System

### Sentinel Agent
- Scans news articles for health threat signals
- Returns: threat detected, disease, location, severity, confidence

### Verification Agent
- Assesses source credibility (WHO/CDC = tier1, regional = tier2)
- Returns: credibility score, verified status, escalation recommendation

### Forecast Agent
- Predicts 7-day and 30-day risk escalation
- Returns: risk level (green/yellow/orange/red), at-risk regions, actions

### Coordinator Agent
- Orchestrates all agents in sequence
- Synthesizes final intelligence briefing
- Aggregates country risk levels across multiple articles

---

## Hackathon Track

**🧠 Reasoning Agents — Microsoft Foundry**

BlueBlood.ai demonstrates multi-step reasoning through:
1. Signal detection (Sentinel)
2. Source validation (Verification)
3. Risk forecasting (Forecast)
4. Intelligence synthesis (Coordinator)

All powered by **Azure OpenAI (GPT-4o)** via **Azure AI Foundry**.

---

## Demo Flow

1. Open dashboard
2. Click **RUN SCAN**
3. Watch agents activate in sequence
4. See country risk map populate
5. Click any alert for full intelligence report
6. Or paste custom text in the analyzer

---

## Team
Built for Microsoft IQ Hackathon 2025
