import json
from crewai import Crew, Task, Process
from .agents import (
    get_orchestrator_agent,
    get_rag_agent,
    get_pedagogical_agent,
    get_generator_agent,
    get_evaluation_agent,
    get_notification_agent,
)
from documents.services import retrieve_relevant_chunks, get_groq_client
from quiz.services import create_quiz_with_questions, submit_quiz
from django.core.mail import send_mail
from django.conf import settings


def prepare_pedagogical_prompt(document_id: int, question: str, level: str = "INTERMEDIAIRE"):
    """
    RAG Agent + Pedagogical Agent logic:
    Recherche le contexte vectoriel et prépare le prompt final pédagogique
    (avec le niveau choisi et les consignes de citations [Source X, page Y])
    pour le streaming SSE direct avec Groq.
    """
    chunks_text, metadatas = retrieve_relevant_chunks(document_id, question, top_k=3)

    context = "\n\n".join(
        f"[Source {i+1}, page {meta.get('page', 1)}]: {text}"
        for i, (text, meta) in enumerate(zip(chunks_text, metadatas))
    )

    level_instructions = {
        "DEBUTANT": "Explique les notions avec des mots simples, des analogies concrètes et sans jargon complexe.",
        "INTERMEDIAIRE": "Fournis une explication équilibrée, claire et rigoureuse avec les termes adaptés.",
        "EXPERT": "Rédige une analyse approfondie, technique et exhaustive du contenu.",
    }.get(level.upper(), "Fournis une explication claire et adaptée.")

    prompt = f"""Tu es un Agent Pédagogique expert sur EduMind. Réponds à la demande de l'apprenant en te basant UNIQUEMENT sur le contexte fourni ci-dessous.

CONSIGNES PÉDAGOGIQUES :
- Niveau de vulgarisation attendu : {level.upper()} -> {level_instructions}
- Cite TOUJOURS tes sources en utilisant le format exact [Source X, page Y] correspondant aux passages utilisés.
- Si le contexte ne contient pas l'information, indique-le clairement avec bienveillance.

Contexte extrait du document :
{context}

Demande de l'apprenant : {question}

Réponse pédagogique :"""

    return prompt, chunks_text, metadatas

