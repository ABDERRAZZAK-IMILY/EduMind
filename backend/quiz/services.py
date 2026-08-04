import json
from documents.services import get_groq_client, get_chroma_client, get_embedding_model


def get_document_chunks(document_id, limit=20):
    # get chunks from docment to use it in quation
    client = get_chroma_client()
    collection = client.get_or_create_collection(name="documents")

    results = collection.get(
        where={"document_id": document_id},
        limit=limit,
    )
    return results["documents"], results["metadatas"]


def generate_quiz_questions(document_id, num_questions=5, difficulty="MOYEN"):
    texts, metadatas = get_document_chunks(document_id)

    if not texts:
        raise ValueError("Aucun contenu disponible pour ce document.")

    context = "\n\n".join(
        f"[page {meta['page']}]: {text}" for text, meta in zip(texts, metadatas)
    )

    prompt = f"""Tu es un générateur de quiz pédagogique. À partir du contenu ci-dessous,
génère exactement {num_questions} questions de niveau {difficulty}, en mélangeant
des QCM (avec 4 options) et des questions Vrai/Faux.

Réponds UNIQUEMENT en JSON valide, sous cette forme exacte (un tableau d'objets) :
[
  {{
    "type": "QCM",
    "text": "...",
    "options": ["...", "...", "...", "..."],
    "correct_answer": "B",
    "explanation": "...",
    "source_page": 1
  }},
  {{
    "type": "VRAI_FAUX",
    "text": "...",
    "options": null,
    "correct_answer": "Vrai",
    "explanation": "...",
    "source_page": 2
  }}
]

Contenu:
{context}

JSON:"""

    client = get_groq_client()
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    raw_content = response.choices[0].message.content

    # clean the llm response 
    cleaned = raw_content.strip().removeprefix("```json").removesuffix("```").strip()

    return json.loads(cleaned)