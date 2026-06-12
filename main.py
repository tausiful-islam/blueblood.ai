import asyncio
import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from agents.pipeline import run_single, run_full_scan
from data.feeds import fetch_all_sources

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("blueblood")

latest_scan_result = {}
scan_in_progress = False


async def _auto_scan():
    global latest_scan_result, scan_in_progress
    scan_in_progress = True
    try:
        logger.info("Auto-scan: fetching articles...")
        articles = await fetch_all_sources(max_per_source=5)
        logger.info(f"Auto-scan: got {len(articles)} articles, running pipeline...")
        if articles:
            result = await asyncio.to_thread(run_full_scan, articles)
            latest_scan_result = result
            logger.info(f"Auto-scan complete: {result['threats_found']} threats from {result['total_scanned']} articles")
        else:
            logger.warning("Auto-scan: no articles fetched")
    except Exception as e:
        logger.error(f"Auto-scan error: {e}", exc_info=True)
    finally:
        scan_in_progress = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(_auto_scan())
    yield


app = FastAPI(
    title="BlueBlood.ai API",
    description="Multi-agent global health intelligence platform powered by Azure AI Foundry",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    content: str
    source: Optional[str] = "Manual Input"
    title: Optional[str] = ""


@app.get("/")
def root():
    return {
        "status": "BlueBlood.ai is running",
        "version": "3.0.0",
        "platform": "Azure AI Foundry",
        "model": os.getenv("MODEL_DEPLOYMENT_NAME", "o4-mini"),
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_single(req: AnalyzeRequest):
    article = {
        "content": req.content,
        "source": req.source,
        "title": req.title,
        "description": req.content,
    }
    result = await asyncio.to_thread(run_single, article)
    return result


@app.get("/scan")
async def run_scan():
    global latest_scan_result, scan_in_progress

    if scan_in_progress:
        return {"status": "scan_in_progress", "message": "A scan is already running"}

    scan_in_progress = True
    try:
        articles = await fetch_all_sources(max_per_source=5)
        result = await asyncio.to_thread(run_full_scan, articles)
        latest_scan_result = result
        return result
    finally:
        scan_in_progress = False


@app.get("/latest")
def get_latest():
    if not latest_scan_result:
        return {
            "alerts": [],
            "country_risks": {},
            "total_scanned": 0,
            "threats_found": 0,
            "message": "No scan run yet. Call /scan to start.",
        }
    return latest_scan_result


@app.get("/alerts")
def get_alerts():
    alerts = latest_scan_result.get("alerts", [])
    return {"count": len(alerts), "alerts": alerts}


@app.get("/risks")
def get_risks():
    return {
        "country_risks": latest_scan_result.get("country_risks", {}),
        "timestamp": latest_scan_result.get("timestamp", None),
    }
