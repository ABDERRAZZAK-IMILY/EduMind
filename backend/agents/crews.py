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


def run_chat_workflow(document_id: int, question: str, level: str = "INTERMEDIAIRE") -> str:
    """
    Exécution synchrone multi-agents pour /api/chat/ask/
    Orchestrateur -> Agent RAG -> Agent Pédagogique
    """
    prompt, _, _ = prepare_pedagogical_prompt(document_id, question, level)
    
    # Exécution via l'agent pédagogique CrewAI
    pedagogical_agent = get_pedagogical_agent()
    task = Task(
        description=f"Rédige la réponse pédagogique finale basée sur ce prompt pré-établi:\n\n{prompt}",
        expected_output="Une réponse pédagogique complète avec citations [Source X, page Y]",
        agent=pedagogical_agent,
    )
    crew = Crew(agents=[pedagogical_agent], tasks=[task], process=Process.sequential)
    result = crew.kickoff()
    return str(result)


def run_quiz_generation_workflow(user, document_id: int, num_questions: int = 5, difficulty: str = "MOYEN"):
    """
    Exécution multi-agents pour la génération de quiz.
    Utilise Generator Agent pour construire le quiz et sauvegarder en base.
    """
    return create_quiz_with_questions(
        user=user,
        document_id=document_id,
        num_questions=num_questions,
        difficulty=difficulty,
    )


def run_quiz_submission_workflow(quiz, answers_data, user_email: str = None):
    """
    Exécution multi-agents pour la correction de quiz et notification e-mail.
    Utilise Evaluation Agent pour évaluer les réponses et Notification Agent pour envoyer l'email.
    """
    updated_quiz = submit_quiz(quiz, answers_data)

    # Déclenchement de la notification email via Notification Agent / django.core.mail
    if user_email:
        subject = f"🎓 Vos résultats pour le Quiz : {quiz.document.name}"
        score = updated_quiz.score
        message_body = (
            f"Bonjour {quiz.owner.username},\n\n"
            f"Vous avez terminé le quiz sur le document '{quiz.document.name}'.\n"
            f"Score obtenu : {score}%\n\n"
            f"Détail de votre performance :\n"
            f"- Questions totales : {quiz.questions.count()}\n"
            f"- Niveau : {quiz.difficulty}\n\n"
        )
        if score >= 80:
            message_body += "Bravo ! Vous maîtrisez très bien ce sujet. Continuez ainsi !\n"
        elif score >= 50:
            message_body += "Bon travail ! Pensez à relire les passages cités dans le quiz pour consolider vos acquis.\n"
        else:
            message_body += "N'hésitez pas à relancer une session de révision et poser des questions au chat pédagogique pour vous améliorer !\n"

        message_body += "\nL'équipe EduMind"

        try:
            notification_agent = get_notification_agent()
            send_mail(
                subject=subject,
                message=message_body,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@edumind.edtech"),
                recipient_list=[user_email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Erreur d'envoi d'email notification: {e}")

    return updated_quiz
