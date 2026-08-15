import os
import litellm
from django.conf import settings
from crewai import Agent, LLM
from .tools import (
    retrieve_chunks_tool,
    generate_quiz_tool,
    evaluate_open_answer_tool,
    send_email_notification_tool,
)

# Configuration litellm pour compatibilité avec Groq
litellm.drop_params = True
litellm.modify_params = True


def get_llm():
    api_key = getattr(settings, "GROQ_API_KEY", os.getenv("GROQ_API_KEY"))
    return LLM(
        model="openai/llama-3.1-8b-instant",
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
        temperature=0.2,
    )


def get_orchestrator_agent() -> Agent:
    return Agent(
        role="Orchestrateur d'Intention Pédagogique",
        goal="Analyser la demande de l'apprenant et classifier précisément son intention en UNE catégorie parmi QUESTION, RESUME, ou QUIZ.",
        backstory="""Tu es le premier point de contact intelligent de la plateforme EduMind. 
Ta tâche est de déterminer l'objectif de l'utilisateur (poser une question factuelle/explication, demander une synthèse/résumé du cours, ou demander un quiz d'entraînement).""",
        llm=get_llm(),
        verbose=False,
    )

