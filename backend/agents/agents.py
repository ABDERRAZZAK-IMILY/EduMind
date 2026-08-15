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
