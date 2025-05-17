from openai import OpenAI
from pydantic import BaseModel
from config import settings
from fastapi import APIRouter
client = OpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com")

def translate_text(text, target_language):
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "system", "content": f"You are a translator. You will be given a text and a target language. You will translate the text to the target language. Do not include any other text in your response. Translate it as it is without interpretation or explanation. If you cannot translate the text, return only 'N/A' and nothing else."},
                  {"role": "user", "content": f"Text: {text}\nTarget Language: {target_language}"}],
        temperature=1.3
    )
    return response.choices[0].message.content

router = APIRouter(prefix="/translate")

class TranslationRequest(BaseModel):
    text: str
    target_language: str

@router.post("/")
async def translate(request: TranslationRequest):
    return translate_text(request.text, request.target_language)

if __name__ == "__main__":
    print(translate_text("无法翻译", "English"))