import json
from typing import Dict, List
from datetime import datetime
from agents.foundry_client import call_llm, call_llm_json


SENTINEL_PROMPT = """You are a global health surveillance sentinel agent for BlueBlood.ai.

Your job is to read news articles or health reports and detect signs of:
- Disease outbreaks (dengue, influenza, cholera, mpox, novel viruses, etc.)
- Healthcare system stress (hospital overload, drug shortages)
- Environmental health threats (heat waves, air quality crises)
- Unusual health patterns

Analyze the text and return ONLY a valid JSON object (no markdown, no backticks) with these fields:
{
  "threat_detected": true or false,
  "disease": "name of disease or threat, or null",
  "location": "country name, or null",
  "country_iso": "ISO 3166-1 numeric code (3 digits like 050 for Bangladesh, 840 for USA), or null",
  "severity": "low" or "medium" or "high" or "critical" or "none",
  "confidence": 0.0 to 1.0,
  "summary": "one sentence description of the threat",
  "signals": ["list", "of", "key", "signals", "found"]
}

Be conservative - only flag real threats, not routine health news."""


VERIFICATION_PROMPT = """You are a verification agent for BlueBlood.ai health intelligence platform.

Your job is to assess the credibility of a health threat report based on:
1. Source reliability (WHO, CDC, Reuters = high; unknown blogs = low)
2. Specificity of the claim (specific numbers, locations, dates = more credible)
3. Whether this matches known disease patterns for the region
4. Presence of official confirmation language

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "credibility_score": 0.0 to 1.0,
  "source_tier": "tier1" or "tier2" or "tier3",
  "verified": true or false,
  "reason": "brief explanation of credibility assessment",
  "recommend_escalate": true or false
}"""


FORECAST_PROMPT = """You are a forecast agent for BlueBlood.ai - a global health intelligence platform.

You receive verified threat data and must predict:
1. Risk escalation probability over the next 7-30 days
2. Potential geographic spread
3. Recommended alert level for public health authorities

Use your knowledge of historical outbreak patterns, regional climate, population density, seasonal factors, and healthcare system capacity.

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "risk_level": "green" or "yellow" or "orange" or "red",
  "escalation_probability_7d": 0.0 to 1.0,
  "escalation_probability_30d": 0.0 to 1.0,
  "at_risk_regions": ["list of nearby countries/regions at risk"],
  "at_risk_iso": ["ISO 3166-1 numeric codes for at-risk countries"],
  "peak_estimate_days": number or null,
  "reasoning": "2-3 sentence explanation of the forecast",
  "recommended_actions": ["list", "of", "recommended", "public health actions"]
}

Risk levels:
- green: Routine monitoring, no escalation expected
- yellow: Watch closely, possible escalation
- orange: High risk, prepare response
- red: Immediate action required"""


POLICY_PROMPT = """You are a policy recommendation agent for BlueBlood.ai.

Given a health threat assessment, verification, and forecast, generate actionable recommendations for public health decision-makers.

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "priority": "immediate" or "high" or "medium" or "low",
  "recommendations": [
    {
      "action": "specific action to take",
      "responsible": "who should do it",
      "timeline": "when it should be done",
      "rationale": "why this action is needed"
    }
  ],
  "resource_needs": ["list of resources needed"],
  "communication_advisory": "public communication recommendation"
}"""


EXPLAINABILITY_PROMPT = """You are an explainability agent for BlueBlood.ai.

Your job is to explain WHY a particular health alert was generated, in clear terms that a non-technical public health official can understand.

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "why_flagged": "clear explanation of what triggered the alert",
  "evidence_chain": ["step 1", "step 2", "step 3"],
  "confidence_explanation": "why we are confident or cautious about this alert",
  "historical_context": "relevant historical precedent if any",
  "limitations": ["what we don't know", "caveats"]
}"""


COORDINATOR_PROMPT = """You are the coordinator agent for BlueBlood.ai - a multi-agent health intelligence platform.

You synthesize the outputs from Sentinel, Verification, Forecast, Policy, and Explainability agents into a final intelligence briefing.

Write a concise, professional 2-3 paragraph briefing. First paragraph: what is happening and why it matters.
Second paragraph: recommended actions. Third paragraph: what to watch for next.

Be direct, factual, and actionable. Write for public health decision-makers."""


def run_single(article: Dict) -> Dict:
    steps = []
    timestamp = datetime.utcnow().isoformat()
    content = article.get("content", article.get("description", ""))

    steps.append({"agent": "Sentinel", "status": "running", "message": "Scanning for health signals..."})
    try:
        threat_data = call_llm_json(SENTINEL_PROMPT, f"Analyze this health report:\n\n{content}")
    except Exception as e:
        threat_data = {
            "threat_detected": False, "disease": None, "location": None,
            "severity": "none", "confidence": 0.0,
            "summary": f"Sentinel error: {str(e)}", "signals": [],
        }
    steps[-1]["status"] = "done"
    steps[-1]["result"] = threat_data

    if not threat_data.get("threat_detected"):
        return {
            "article": article, "threat_detected": False, "steps": steps,
            "timestamp": timestamp, "final_risk_level": "green",
            "summary": "No health threat detected in this report.",
        }

    steps.append({"agent": "Verification", "status": "running", "message": "Verifying source credibility..."})
    try:
        verification_data = call_llm_json(
            VERIFICATION_PROMPT,
            f"Source: {article.get('source', 'Unknown')}\n"
            f"Disease: {threat_data.get('disease')}\n"
            f"Location: {threat_data.get('location')}\n"
            f"Severity: {threat_data.get('severity')}\n"
            f"Summary: {threat_data.get('summary')}\n"
            f"Signals: {', '.join(threat_data.get('signals', []))}\n\n"
            f"Assess the credibility of this threat report.",
        )
    except Exception as e:
        verification_data = {
            "credibility_score": 0.5, "source_tier": "tier3",
            "verified": False, "reason": f"Error: {str(e)}",
            "recommend_escalate": False,
        }
    steps[-1]["status"] = "done"
    steps[-1]["result"] = verification_data

    steps.append({"agent": "Forecast", "status": "running", "message": "Generating risk forecast..."})
    try:
        forecast_data = call_llm_json(
            FORECAST_PROMPT,
            f"Disease: {threat_data.get('disease')}\n"
            f"Location: {threat_data.get('location')}\n"
            f"Severity: {threat_data.get('severity')}\n"
            f"Confidence: {threat_data.get('confidence')}\n"
            f"Credibility: {verification_data.get('credibility_score')}\n"
            f"Source Tier: {verification_data.get('source_tier')}\n"
            f"Verified: {verification_data.get('verified')}\n\n"
            f"Generate a 7-day and 30-day risk forecast.",
        )
    except Exception as e:
        forecast_data = {
            "risk_level": "yellow", "escalation_probability_7d": 0.3,
            "escalation_probability_30d": 0.5, "at_risk_regions": [],
            "peak_estimate_days": None,
            "reasoning": f"Forecast error: {str(e)}",
            "recommended_actions": ["Continue monitoring"],
        }
    steps[-1]["status"] = "done"
    steps[-1]["result"] = forecast_data

    steps.append({"agent": "Policy", "status": "running", "message": "Generating policy recommendations..."})
    try:
        policy_data = call_llm_json(
            POLICY_PROMPT,
            f"Disease: {threat_data.get('disease')}\n"
            f"Location: {threat_data.get('location')}\n"
            f"Risk Level: {forecast_data.get('risk_level')}\n"
            f"7-day escalation: {forecast_data.get('escalation_probability_7d')}\n"
            f"At-risk regions: {', '.join(forecast_data.get('at_risk_regions', []))}\n\n"
            f"Generate policy recommendations.",
        )
    except Exception as e:
        policy_data = {
            "priority": "medium", "recommendations": [],
            "resource_needs": [], "communication_advisory": str(e),
        }
    steps[-1]["status"] = "done"
    steps[-1]["result"] = policy_data

    steps.append({"agent": "Explainability", "status": "running", "message": "Explaining reasoning chain..."})
    try:
        explain_data = call_llm_json(
            EXPLAINABILITY_PROMPT,
            f"Disease: {threat_data.get('disease')}\n"
            f"Location: {threat_data.get('location')}\n"
            f"Severity: {threat_data.get('severity')}\n"
            f"Credibility: {verification_data.get('credibility_score')}\n"
            f"Risk Level: {forecast_data.get('risk_level')}\n"
            f"Forecast reasoning: {forecast_data.get('reasoning')}\n\n"
            f"Explain why this alert was generated.",
        )
    except Exception as e:
        explain_data = {
            "why_flagged": str(e), "evidence_chain": [],
            "confidence_explanation": "", "historical_context": "",
            "limitations": [],
        }
    steps[-1]["status"] = "done"
    steps[-1]["result"] = explain_data

    steps.append({"agent": "Coordinator", "status": "running", "message": "Synthesizing intelligence report..."})
    try:
        summary = call_llm(
            COORDINATOR_PROMPT,
            f"Synthesize a briefing:\n"
            f"Disease: {threat_data.get('disease')} in {threat_data.get('location')}\n"
            f"Severity: {threat_data.get('severity')}\n"
            f"Credibility: {verification_data.get('credibility_score')}\n"
            f"Risk Level: {forecast_data.get('risk_level')}\n"
            f"7-day risk: {forecast_data.get('escalation_probability_7d')}\n"
            f"At-risk: {', '.join(forecast_data.get('at_risk_regions', []))}\n"
            f"Actions: {', '.join(forecast_data.get('recommended_actions', []))}\n"
            f"Why flagged: {explain_data.get('why_flagged')}",
            max_tokens=400,
        )
    except Exception:
        summary = f"{threat_data.get('disease')} detected in {threat_data.get('location')} with {forecast_data.get('risk_level')} risk level."
    steps[-1]["status"] = "done"

    return {
        "article": {
            "title": article.get("title", ""),
            "source": article.get("source", "Unknown"),
            "url": article.get("url", ""),
            "published_at": article.get("published_at", ""),
        },
        "threat_detected": True,
        "threat": threat_data,
        "verification": verification_data,
        "forecast": forecast_data,
        "policy": policy_data,
        "explainability": explain_data,
        "final_risk_level": forecast_data.get("risk_level", "yellow"),
        "summary": summary,
        "steps": steps,
        "timestamp": timestamp,
    }


def run_full_scan(articles: List[Dict]) -> Dict:
    alerts = []
    country_risks = {}

    for article in articles:
        result = run_single(article)
        if result.get("threat_detected"):
            alerts.append(result)
            iso = result.get("threat", {}).get("country_iso", "") or article.get("country_iso", "")
            location = result.get("threat", {}).get("location", "Unknown")
            risk = result.get("final_risk_level", "green")
            risk_order = {"green": 0, "yellow": 1, "orange": 2, "red": 3}
            if location and location != "Unknown":
                key = iso if iso else location
                current = country_risks.get(key, {}).get("risk", "green")
                if risk_order.get(risk, 0) > risk_order.get(current, 0):
                    country_risks[key] = {
                        "risk": risk,
                        "name": location,
                        "iso": iso,
                        "disease": result.get("threat", {}).get("disease", ""),
                    }

    return {
        "alerts": alerts,
        "country_risks": country_risks,
        "total_scanned": len(articles),
        "threats_found": len(alerts),
        "timestamp": datetime.utcnow().isoformat(),
    }
