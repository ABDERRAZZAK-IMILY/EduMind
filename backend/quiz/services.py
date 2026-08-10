import json
from documents.services import get_groq_client, get_chroma_client, get_embedding_model

from .models import Quiz, Question


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
des QCM (avec 4 options), des questions Vrai/Faux, et 1 à 2 questions ouvertes
(type "OUVERTE") qui demandent une réponse rédigée courte.

IMPORTANT:
- Réponds UNIQUEMENT avec le tableau JSON, sans aucun texte avant ou après.
- Le champ "type" doit être EXACTEMENT "QCM" ou "VRAI_FAUX" (jamais "Vrai/Faux").

Format exact:
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
  }},
  {{
    "type": "OUVERTE",
    "text": "...",
    "options": null,
    "correct_answer": "Éléments de réponse attendus, sous forme de critères clés",
    "explanation": "...",
    "source_page": 3
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

    start = raw_content.find("[")
    end = raw_content.rfind("]")
    if start == -1 or end == -1:
        raise ValueError(f"Impossible d'extraire le JSON. Réponse brute: {raw_content}")

    json_str = raw_content[start:end + 1]
    questions = json.loads(json_str)

    type_mapping = {
        "vrai/faux": "VRAI_FAUX",
        "vrai_faux": "VRAI_FAUX",
        "qcm": "QCM",
        "ouverte": "OUVERTE",
    }
    for q in questions:
        normalized = type_mapping.get(q["type"].lower().strip(), q["type"].upper())
        q["type"] = normalized

    return questions




def create_quiz_with_questions(user, document_id, num_questions=5, difficulty="MOYEN"):
    from documents.models import Document
    document = Document.objects.get(id=document_id, owner=user)

    questions_data = generate_quiz_questions(document_id, num_questions, difficulty)

    quiz = Quiz.objects.create(
        owner=user,
        document=document,
        difficulty=difficulty,
        num_questions=len(questions_data),
    )

    for q in questions_data:
        Question.objects.create(
            quiz=quiz,
            type=q["type"],
            text=q["text"],
            options=q.get("options"),
            correct_answer=q["correct_answer"],
            explanation=q.get("explanation", ""),
            source_page=q.get("source_page"),
        )

    return quiz    



def submit_quiz(quiz, answers_data):
    answers_map = {a["question_id"]: a["answer"] for a in answers_data}
    correct_count = 0
    total = quiz.questions.count()

    for question in quiz.questions.all():
        submitted = answers_map.get(question.id, "").strip()
        question.submitted_answer = submitted

        if question.type in ["QCM", "VRAI_FAUX"]:
            is_correct = submitted.strip().lower() == question.correct_answer.strip().lower()
            question.is_correct = is_correct
            if is_correct:
                correct_count += 1
        else:
            question.is_correct = None

        question.save()

    from django.utils import timezone
    quiz.score = round((correct_count / total) * 100, 1) if total > 0 else 0
    quiz.completed_at = timezone.now()
    quiz.save()

    return quiz