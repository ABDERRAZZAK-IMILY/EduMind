import json
from crewai.tools import tool
from django.core.mail import send_mail
from django.conf import settings
from documents.services import retrieve_relevant_chunks
from quiz.services import generate_quiz_questions, evaluate_open_answer


@tool("Recherche Vectorielle Chroma")
def retrieve_chunks_tool(document_id: int, question: str, top_k: int = 3) -> str:
    """
    Recherche les passages les plus pertinents dans la base vectorielle Chroma
    pour un document donné et une question spécifique.
    Retourne le texte des chunks avec leurs métadonnées de page sous forme d'un tableau JSON.
    """
    try:
        chunks_text, metadatas = retrieve_relevant_chunks(document_id, question, top_k=top_k)
        results = [
            {"page": meta.get("page", 1), "text": text}
            for text, meta in zip(chunks_text, metadatas)
        ]
        return json.dumps(results, ensure_ascii=False)
    except Exception as e:
        return json.dumps([{"page": 1, "text": f"Erreur de recherche: {str(e)}"}])


@tool("Générateur de Questions de Quiz")
def generate_quiz_tool(document_id: int, num_questions: int = 5, difficulty: str = "MOYEN") -> str:
    """
    Génère un ensemble de questions de quiz (QCM, Vrai/Faux, Questions Ouvertes)
    à partir du contenu d'un document.
    """
    try:
        questions = generate_quiz_questions(document_id, num_questions=num_questions, difficulty=difficulty)
        return json.dumps(questions, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool("Évaluateur de Réponse Ouverte")
def evaluate_open_answer_tool(question_text: str, expected_criteria: str, submitted_answer: str) -> str:
    """
    Évalue sémantiquement la réponse d'un apprenant à une question ouverte par rapport aux critères attendus.
    """
    try:
        class DummyQuestion:
            def __init__(self, text, correct):
                self.text = text
                self.correct_answer = correct
        q = DummyQuestion(question_text, expected_criteria)
        is_correct, feedback = evaluate_open_answer(q, submitted_answer)
        return json.dumps({"is_correct": is_correct, "feedback": feedback}, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"is_correct": False, "feedback": f"Erreur d'évaluation: {str(e)}"})


@tool("Agent de Notification E-mail")
def send_email_notification_tool(recipient_email: str, subject: str, message_body: str) -> str:
    """
    Envoie un e-mail de notification (ex: résultats de quiz, rappels, recommandations) à l'apprenant.
    """
    try:
        send_mail(
            subject=subject,
            message=message_body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@edumind.edtech"),
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        return f"Notification e-mail envoyée avec succès à {recipient_email}"
    except Exception as e:
        return f"Erreur d'envoi e-mail: {str(e)}"
