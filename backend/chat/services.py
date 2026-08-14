import json
from documents.services import get_groq_client


def classify_intent(question):
    prompt = f"""Classifie l'intention de cette question/demande d'un apprenant en UNE SEULE catégorie parmi :
- "QUESTION" : question factuelle ou demande d'explication sur le contenu
- "RESUME" : demande de résumé ou synthèse du document
- "QUIZ" : demande de générer un quiz ou des questions d'entraînement

Demande de l'apprenant: "{question}"

Réponds UNIQUEMENT en JSON: {{"intent": "QUESTION"}} (ou "RESUME" ou "QUIZ")

JSON:"""

    client = get_groq_client()
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )

    raw = response.choices[0].message.content
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        return "QUESTION"  # fallback

    try:
        result = json.loads(raw[start:end + 1])
        intent = result.get("intent", "QUESTION").upper()
        return intent if intent in ["QUESTION", "RESUME", "QUIZ"] else "QUESTION"
    except json.JSONDecodeError:
        return "QUESTION"