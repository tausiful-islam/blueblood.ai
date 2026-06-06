import httpx
import os
from typing import List, Dict

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")

WHO_RSS_URL = "https://www.who.int/rss-feeds/news-english.xml"
NEWS_API_URL = "https://newsapi.org/v2/everything"

HEALTH_KEYWORDS = [
    "disease outbreak", "epidemic", "pandemic",
    "dengue", "cholera", "mpox", "influenza", "virus",
    "health emergency", "WHO alert", "hospital surge",
]


async def fetch_health_news(max_articles: int = 10) -> List[Dict]:
    if not NEWS_API_KEY:
        return _mock_news()

    query = " OR ".join(HEALTH_KEYWORDS[:5])
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": max_articles,
        "apiKey": NEWS_API_KEY,
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(NEWS_API_URL, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            articles = data.get("articles", [])
            return [
                {
                    "title": a.get("title", ""),
                    "description": a.get("description", ""),
                    "source": a.get("source", {}).get("name", "Unknown"),
                    "url": a.get("url", ""),
                    "published_at": a.get("publishedAt", ""),
                    "content": f"{a.get('title', '')}. {a.get('description', '')}",
                }
                for a in articles
                if a.get("title")
            ]
        except Exception as e:
            print(f"NewsAPI error: {e}")
            return _mock_news()


async def fetch_who_alerts() -> List[Dict]:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(WHO_RSS_URL, timeout=10)
            import re
            items = re.findall(r"<item>(.*?)</item>", resp.text, re.DOTALL)
            results = []
            for item in items[:5]:
                title = re.search(r"<title>(.*?)</title>", item)
                desc = re.search(r"<description>(.*?)</description>", item)
                results.append(
                    {
                        "title": title.group(1) if title else "",
                        "description": desc.group(1) if desc else "",
                        "source": "WHO",
                        "content": f"{title.group(1) if title else ''}. {desc.group(1) if desc else ''}",
                    }
                )
            return results
        except Exception as e:
            print(f"WHO RSS error: {e}")
            return []


def _mock_news() -> List[Dict]:
    return [
        {
            "title": "Dengue fever cases spike in Bangladesh",
            "description": "Health officials report 300 new dengue cases in Dhaka in 48 hours, double the normal rate.",
            "source": "Reuters",
            "url": "",
            "published_at": "2025-01-01T00:00:00Z",
            "content": "Dengue fever cases spike in Bangladesh. Health officials report 300 new dengue cases in Dhaka in 48 hours, double the normal rate.",
        },
        {
            "title": "Indonesia monitors unusual influenza cluster",
            "description": "Three provinces in Java report elevated influenza-like illness, authorities are investigating.",
            "source": "BBC",
            "url": "",
            "published_at": "2025-01-01T00:00:00Z",
            "content": "Indonesia monitors unusual influenza cluster. Three provinces in Java report elevated influenza-like illness, authorities are investigating.",
        },
        {
            "title": "Singapore health ministry issues advisory",
            "description": "Routine advisory on hand foot mouth disease with slight increase in cases among children.",
            "source": "Channel News Asia",
            "url": "",
            "published_at": "2025-01-01T00:00:00Z",
            "content": "Singapore health ministry issues advisory. Routine advisory on hand foot mouth disease with slight increase in cases among children.",
        },
        {
            "title": "Cholera outbreak suspected in Bihar India after monsoon floods",
            "description": "Waterborne illness reports emerging from flood-affected districts in Bihar. Health teams deployed.",
            "source": "Times of India",
            "url": "",
            "published_at": "2025-01-01T00:00:00Z",
            "content": "Cholera outbreak suspected in Bihar India after monsoon floods. Waterborne illness reports emerging from flood-affected districts in Bihar. Health teams deployed.",
        },
    ]
