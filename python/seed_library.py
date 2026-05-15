import os
import json
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError
from supabase import create_client, Client
import httpx

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CLAUDE_API_KEY = os.environ["CLAUDE_API_KEY"]
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")

class Prompt(BaseModel):
  text: str
  type: str
  category: str
  tone: str
  difficulty: int = Field(ge=1, le=3)
  metadata: dict = Field(default_factory=dict)

def get_supabase() -> Client:
  return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async def generate_batch(client: httpx.AsyncClient, category: str, type_: str, count: int) -> List[Prompt]:
  system_prompt = f"""
You are generating relationship prompts for a couples app.

Return ONLY a JSON array of {count} objects, each like:
{{
  "text": string,
  "type": "{type_}",
  "category": "{category}",
  "tone": "light" | "medium" | "deep",
  "difficulty": 1 | 2 | 3,
  "metadata": {{}}
}}
"""

  resp = await client.post(
    "https://api.anthropic.com/v1/messages",
    headers={
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    json={
      "model": CLAUDE_MODEL,
      "max_tokens": 2048,
      "messages": [{"role": "user", "content": system_prompt}]
    }
  )
  resp.raise_for_status()
  data = resp.json()
  text = data["content"][0]["text"]

  try:
    raw = json.loads(text)
  except json.JSONDecodeError:
    raise RuntimeError("Claude returned invalid JSON")

  prompts: List[Prompt] = []
  for item in raw:
    try:
      prompts.append(Prompt(**item))
    except ValidationError as e:
      print("Skipping invalid prompt:", e)
  return prompts

async def main():
  supabase = get_supabase()
  categories = ["communication", "intimacy", "fun", "conflict", "gratitude", "future", "childhood", "travel"]
  types = ["daily_question", "couple_question", "quiz", "game"]

  async with httpx.AsyncClient(timeout=60.0) as client:
    for category in categories:
      for type_ in types:
        print(f"Generating prompts for {category} / {type_}...")
        prompts = await generate_batch(client, category, type_, count=20)
        rows = [
          {
            "text": p.text,
            "type": p.type,
            "category": p.category,
            "tone": p.tone,
            "difficulty": p.difficulty,
            "metadata": p.metadata
          }
          for p in prompts
        ]
        if rows:
          res = supabase.table("content").insert(rows).execute()
          print(f"Inserted {len(rows)} prompts, status: {res.status_code}")

if __name__ == "__main__":
  import asyncio
  asyncio.run(main())
