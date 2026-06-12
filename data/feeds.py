import httpx
import os
import re
import json
from typing import List, Dict

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")

COUNTRY_ISO_MAP = {
    "afghanistan": "004", "albania": "008", "algeria": "012", "angola": "024",
    "argentina": "032", "armenia": "051", "australia": "036", "austria": "040",
    "azerbaijan": "031", "bahamas": "044", "bahrain": "048", "bangladesh": "050",
    "barbados": "052", "belarus": "112", "belgium": "056", "belize": "084",
    "benin": "204", "bhutan": "064", "bolivia": "068", "bosnia": "070",
    "botswana": "072", "brazil": "076", "brunei": "096", "bulgaria": "100",
    "burkina faso": "854", "burundi": "108", "cambodia": "116", "cameroon": "120",
    "canada": "124", "cape verde": "132", "central african republic": "140",
    "chad": "148", "chile": "152", "china": "156", "colombia": "170",
    "comoros": "174", "congo": "178", "democratic republic of congo": "180",
    "dr congo": "180", "drc": "180", "costa rica": "188", "croatia": "191",
    "cuba": "192", "cyprus": "196", "czech republic": "203", "czechia": "203",
    "denmark": "208", "djibouti": "262", "dominica": "212", "dominican republic": "214",
    "ecuador": "218", "egypt": "818", "el salvador": "222", "equatorial guinea": "226",
    "eritrea": "232", "estonia": "233", "ethiopia": "231", "fiji": "242",
    "finland": "246", "france": "250", "gabon": "266", "gambia": "270",
    "georgia": "268", "germany": "276", "ghana": "288", "greece": "300",
    "grenada": "308", "guatemala": "320", "guinea": "324", "guinea-bissau": "624",
    "guyana": "328", "haiti": "332", "honduras": "340", "hungary": "348",
    "iceland": "352", "india": "356", "indonesia": "360", "iran": "364",
    "iraq": "368", "ireland": "372", "israel": "376", "italy": "380",
    "ivory coast": "384", "cote d'ivoire": "384", "jamaica": "388", "japan": "392",
    "jordan": "400", "kazakhstan": "398", "kenya": "404", "kiribati": "296",
    "kuwait": "414", "kyrgyzstan": "417", "laos": "418", "latvia": "428",
    "lebanon": "422", "lesotho": "426", "liberia": "430", "libya": "434",
    "liechtenstein": "438", "lithuania": "440", "luxembourg": "442", "madagascar": "450",
    "malawi": "454", "malaysia": "458", "maldives": "462", "mali": "466",
    "malta": "470", "marshall islands": "584", "mauritania": "478", "mauritius": "480",
    "mexico": "484", "micronesia": "583", "moldova": "498", "monaco": "492",
    "mongolia": "496", "montenegro": "499", "morocco": "504", "mozambique": "508",
    "myanmar": "104", "namibia": "516", "nauru": "520", "nepal": "524",
    "netherlands": "528", "new zealand": "554", "nicaragua": "558", "niger": "562",
    "nigeria": "566", "north korea": "408", "north macedonia": "807",
    "norway": "578", "oman": "512", "pakistan": "586", "palau": "585",
    "palestine": "275", "panama": "591", "papua new guinea": "598", "paraguay": "600",
    "peru": "604", "philippines": "608", "poland": "616", "portugal": "620",
    "qatar": "634", "romania": "642", "russia": "643", "rwanda": "646",
    "saint kitts": "659", "saint lucia": "662", "saint vincent": "670",
    "samoa": "882", "san marino": "674", "sao tome": "678", "saudi arabia": "682",
    "senegal": "686", "serbia": "688", "seychelles": "690", "sierra leone": "694",
    "singapore": "702", "slovakia": "703", "slovenia": "705", "solomon islands": "090",
    "somalia": "706", "south africa": "710", "south korea": "410", "south sudan": "728",
    "spain": "724", "sri lanka": "144", "sudan": "729", "suriname": "740",
    "sweden": "752", "switzerland": "756", "syria": "760", "taiwan": "158",
    "tajikistan": "762", "tanzania": "834", "thailand": "764", "togo": "768",
    "tonga": "776", "trinidad": "780", "tunisia": "788", "turkey": "792",
    "turkmenistan": "795", "tuvalu": "798", "uganda": "800", "ukraine": "804",
    "united arab emirates": "784", "uae": "784", "united kingdom": "826",
    "uk": "826", "united states": "840", "usa": "840", "uruguay": "858",
    "uzbekistan": "860", "vanuatu": "548", "vatican": "336", "venezuela": "862",
    "vietnam": "704", "yemen": "887", "zambia": "894", "zimbabwe": "716",
}


def get_country_iso(location: str) -> str:
    if not location:
        return ""
    loc_lower = location.lower().strip()
    for name, code in COUNTRY_ISO_MAP.items():
        if name in loc_lower or loc_lower in name:
            return code
    return ""


async def fetch_health_news(max_articles: int = 10) -> List[Dict]:
    if not NEWS_API_KEY:
        return await _fetch_reliefweb(max_articles)

    params = {
        "q": "ebola OR dengue OR cholera OR measles OR outbreak OR pandemic OR \"disease outbreak\" OR \"health emergency\"",
        "language": "en",
        "sortBy": "relevancy",
        "pageSize": max_articles,
        "apiKey": NEWS_API_KEY,
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get("https://newsapi.org/v2/everything", params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            articles = data.get("articles", [])
            results = []
            for a in articles:
                if not a.get("title"):
                    continue
                title = a.get("title", "")
                desc = a.get("description", "")
                source_name = a.get("source", {}).get("name", "Unknown")
                content = f"{title}. {desc}"
                location_iso = ""
                for name, code in COUNTRY_ISO_MAP.items():
                    if name in content.lower():
                        location_iso = code
                        break
                results.append({
                    "title": title,
                    "description": desc,
                    "source": source_name,
                    "url": a.get("url", ""),
                    "published_at": a.get("publishedAt", ""),
                    "content": content,
                    "country_iso": location_iso,
                })
            return results
        except Exception as e:
            print(f"NewsAPI error: {e}")
            return await _fetch_reliefweb(max_articles)


async def fetch_reliefweb_reports(max_reports: int = 10) -> List[Dict]:
    return await _fetch_reliefweb(max_reports)


async def _fetch_reliefweb(max_reports: int = 10) -> List[Dict]:
    results = []
    results.extend(await _fetch_who_don(max_reports))
    if len(results) < max_reports:
        results.extend(await _fetch_reliefweb_v0(max_reports - len(results)))
    return results[:max_reports]


async def _fetch_who_don(max_reports: int = 10) -> List[Dict]:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://www.who.int/rss-feeds/news-english.xml",
                timeout=10,
            )
            items = re.findall(r"<item>(.*?)</item>", resp.text, re.DOTALL)
            results = []
            health_kw = ["outbreak", "disease", "ebola", "cholera", "dengue", "measles",
                         "malaria", "epidemic", "pandemic", "health emergency", "who"]
            for item in items[:max_reports * 2]:
                title_m = re.search(r"<!\[CDATA\[(.*?)\]\]|<title>(.*?)</title>", item)
                desc_m = re.search(r"<!\[CDATA\[(.*?)\]\]|<description>(.*?)</description>", item)
                link_m = re.search(r"<link>(.*?)</link>", item)
                title_text = (title_m.group(1) or title_m.group(2) or "").strip() if title_m else ""
                desc_text = (desc_m.group(1) or desc_m.group(2) or "").strip() if desc_m else ""
                text_lower = (title_text + " " + desc_text).lower()
                if not any(kw in text_lower for kw in health_kw):
                    continue
                country_iso = ""
                for name, code in COUNTRY_ISO_MAP.items():
                    if name in text_lower:
                        country_iso = code
                        break
                results.append({
                    "title": title_text,
                    "description": desc_text[:200],
                    "source": "WHO",
                    "url": link_m.group(1).strip() if link_m else "",
                    "published_at": "",
                    "content": f"{title_text}. {desc_text[:300]}",
                    "country_iso": country_iso,
                    "country_name": "",
                })
                if len(results) >= max_reports:
                    break
            return results
        except Exception as e:
            print(f"WHO RSS error: {e}")
            return []


async def _fetch_reliefweb_v0(max_reports: int = 10) -> List[Dict]:
    url = "https://api.reliefweb.int/v1/reports"
    params = {
        "appname": "blueblood-ai",
        "query[value]": json.dumps({
            "operator": "AND",
            "conditions": [
                {"field": "theme.name", "value": "Health"},
            ]
        }),
        "fields": {"include": ["title", "body", "date", "country", "source"]},
        "limit": max_reports,
        "sort": ["date:desc"],
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            results = []
            for item in data.get("data", []):
                fields = item.get("fields", {})
                title = fields.get("title", "")
                body = fields.get("body", "")
                if isinstance(body, list):
                    body = " ".join(b.get("value", "") if isinstance(b, dict) else str(b) for b in body)
                body = re.sub(r'<[^>]+>', '', body)[:500]
                countries = fields.get("country", [])
                country_name = countries[0].get("name", "") if countries else ""
                country_iso = get_country_iso(country_name)
                source = fields.get("source", [])
                source_name = source[0].get("name", "ReliefWeb") if source else "ReliefWeb"
                results.append({
                    "title": title,
                    "description": body[:200],
                    "source": source_name,
                    "url": f"https://reliefweb.int/report/{item.get('id', '')}",
                    "published_at": fields.get("date", {}).get("created", ""),
                    "content": f"{title}. {body[:300]}",
                    "country_iso": country_iso,
                    "country_name": country_name,
                })
            return results
        except Exception as e:
            print(f"ReliefWeb error: {e}")
            return []


async def fetch_ecdc_threats() -> List[Dict]:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://www.ecdc.europa.eu/en/taxonomy/term/1505/feed",
                timeout=10,
            )
            items = re.findall(r"<item>(.*?)</item>", resp.text, re.DOTALL)
            results = []
            for item in items[:5]:
                title = re.search(r"<title><!\[CDATA\[(.*?)\]\]|<title>(.*?)</title>", item)
                desc = re.search(r"<description><!\[CDATA\[(.*?)\]\]|<description>(.*?)</description>", item)
                link = re.search(r"<link>(.*?)</link>", item)
                title_text = ""
                if title:
                    title_text = (title.group(1) or title.group(2) or "").strip()
                desc_text = ""
                if desc:
                    desc_text = (desc.group(1) or desc.group(2) or "").strip()
                desc_text = re.sub(r'<[^>]+>', '', desc_text)
                content = f"{title_text}. {desc_text[:400]}"
                country_iso = ""
                text_lower = content.lower()
                for name, code in COUNTRY_ISO_MAP.items():
                    if name in text_lower:
                        country_iso = code
                        break
                results.append({
                    "title": title_text,
                    "description": desc_text[:200],
                    "source": "ECDC",
                    "url": link.group(1).strip() if link else "",
                    "published_at": "",
                    "content": content,
                    "country_iso": country_iso,
                    "country_name": "",
                })
            return results
        except Exception as e:
            print(f"ECDC error: {e}")
            return []


async def fetch_all_sources(max_per_source: int = 5) -> List[Dict]:
    import asyncio
    tasks = [
        fetch_health_news(max_per_source),
        _fetch_reliefweb(max_per_source),
        fetch_ecdc_threats(),
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    all_articles = []
    for result in results:
        if isinstance(result, list):
            all_articles.extend(result)
    seen = set()
    unique = []
    health_keywords = [
        "ebola", "dengue", "cholera", "measles", "outbreak", "pandemic", "epidemic",
        "who", "health", "disease", "virus", "fever", "malaria", "influenza", "flu",
        "cases", "infection", "contagious", "vaccine", "hospital", "emergency",
        "contaminated", "syndrome", "pathogen", "transmission", "mortality",
    ]
    for a in all_articles:
        key = a.get("title", "").lower()[:50]
        if key not in seen:
            seen.add(key)
            text = (a.get("title", "") + " " + a.get("content", "")).lower()
            if any(kw in text for kw in health_keywords):
                unique.append(a)
    return unique
