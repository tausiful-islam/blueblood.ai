import os
import json
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()

ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2025-04-01-preview")
MODEL = os.getenv("MODEL_DEPLOYMENT_NAME", "o4-mini")

_client = None


def get_client() -> AzureOpenAI:
    global _client
    if _client is None:
        _client = AzureOpenAI(
            azure_endpoint=ENDPOINT,
            api_key=API_KEY,
            api_version=API_VERSION,
        )
    return _client


def call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 4000) -> str:
    client = get_client()
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_completion_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


def call_llm_json(system_prompt: str, user_prompt: str, max_tokens: int = 4000) -> dict:
    raw = call_llm(system_prompt, user_prompt, max_tokens)
    clean = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)
