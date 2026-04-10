#app/services/ai/ai_service.py

import os
from groq import Groq

# =========================
# CONFIG
# =========================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = os.getenv("GROQ_MODEL", "llama3-70b-8192")

client = Groq(api_key=GROQ_API_KEY)


# =========================
# AI FUNCTION
# =========================
def ask_ai(question: str, context: str) -> str:
    try:
        prompt = f"""
You are a clinical assistant AI.

STRICT RULES:
- Use ONLY the provided patient data
- Do NOT assume anything
- If data is missing, say: Not available in records

FORMATTING RULES:
- Use clear medical terminology (e.g., "appendectomy" instead of "appendix surgery")
- Format dates as YYYY-MM-DD (remove time)
- Keep answers structured and clean
- Do NOT include unnecessary explanations

Patient Data:
{context}

Doctor Question:
{question}

Answer:
"""

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a precise medical assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,   # low hallucination
            max_tokens=512
        )

        answer = response.choices[0].message.content.strip()

        return answer if answer else "Not available in records"

    except Exception as e:
        print("GROQ ERROR:", str(e))
        return "AI error: Unable to generate response"