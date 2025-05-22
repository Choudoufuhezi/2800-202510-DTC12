import json
from typing import List
from openai import OpenAI
from pydantic import BaseModel
from config import settings
from fastapi import APIRouter
client = OpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com")

def translate_text(texts, target_language):
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {
                "role": "system",
                "content": """You are a professional translation system. Your task is to:
                1. Accurately translate each given text to the specified target language
                2. Maintain the original meaning, tone, and style
                3. Preserve any special terms, names, or technical vocabulary
                4. Return translations in exact same order as input
                5. For untranslatable texts, return "N/A" for that item

                Output must be a JSON list of translations only, with no additional commentary.
                Example input: ["Hello", "Goodbye"]
                Example output: ["Hola", "Adiós"]"""
            },
            {
                "role": "user",
                "content": f"""Texts to translate (as JSON list): {texts}
                Target Language: {target_language}
                Respond with ONLY a JSON list of translations:"""
            }
        ],
        temperature=0.7,  # Slightly lower temperature for more consistent results
        response_format={"type": "json_object"}  # Ensure JSON output
    )
    try:
        # Parse the JSON response
        translations = json.loads(response.choices[0].message.content)
        if isinstance(translations, dict):
            translations = translations.get("translations", ["N/A"] * len(texts))
        return translations
    except:
        return ["N/A"] * len(texts)

router = APIRouter(prefix="/translate")

class TranslationRequest(BaseModel):
    texts: List[str]
    target_language: str

@router.post("/")
async def translate(request: TranslationRequest):
    return translate_text(request.texts, request.target_language)

if __name__ == "__main__":
    test_texts = ["Hello world", "How are you?"]
    print(translate_text(test_texts, "Chinese"))