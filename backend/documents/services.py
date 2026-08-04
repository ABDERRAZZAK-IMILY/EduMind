import pdfplumber
import io
from .storage import get_s3_client
from django.conf import settings


from groq import Groq
from django.conf import settings

from sentence_transformers import SentenceTransformer
import chromadb

_model = None
_chroma_client = None


def download_file_from_minio(file_key):
    client = get_s3_client()
    response = client.get_object(Bucket=settings.MINIO_BUCKET_NAME, Key=file_key)
    return response["Body"].read()


def extract_text_from_pdf(file_bytes):
    text_by_page = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_by_page.append(page_text)
    return text_by_page


def chunk_text(pages, chunk_size=800, overlap=100):
    chunks = []
    for page_num, page_text in enumerate(pages, start=1):
        start = 0
        while start < len(page_text):
            end = start + chunk_size
            chunk = page_text[start:end]
            if chunk.strip():
                chunks.append({"page": page_num, "text": chunk})
            start += chunk_size - overlap
    return chunks






def get_embedding_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.HttpClient(host="localhost", port=8001)
    return _chroma_client


def embed_and_store_chunks(document_id, chunks):
    model = get_embedding_model()
    client = get_chroma_client()
    collection = client.get_or_create_collection(name="documents")

    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts).tolist()

    ids = [f"{document_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": document_id, "page": c["page"]} for c in chunks]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )
    return len(chunks)









def get_groq_client():
    return Groq(api_key=settings.GROQ_API_KEY)


def retrieve_relevant_chunks(document_id, question, top_k=3):
    model = get_embedding_model()
    client = get_chroma_client()
    collection = client.get_or_create_collection(name="documents")

    query_embedding = model.encode([question]).tolist()[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"document_id": document_id},
    )
    return results["documents"][0], results["metadatas"][0]


def answer_question(document_id, question):
    chunks_text, metadatas = retrieve_relevant_chunks(document_id, question)

    context = "\n\n".join(
        f"[Source {i+1}, page {meta['page']}]: {text}"
        for i, (text, meta) in enumerate(zip(chunks_text, metadatas))
    )

    prompt = f"""Tu es un assistant pédagogique. Réponds à la question de l'apprenant
en te basant UNIQUEMENT sur le contexte fourni ci-dessous. Cite tes sources
en utilisant [Source X] dans ta réponse.

Contexte:
{context}

Question: {question}

Réponse:"""

    groq_client = get_groq_client()
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content






def answer_question_stream(document_id, question):
    chunks_text, metadatas = retrieve_relevant_chunks(document_id, question)

    context = "\n\n".join(
        f"[Source {i+1}, page {meta['page']}]: {text}"
        for i, (text, meta) in enumerate(zip(chunks_text, metadatas))
    )

    prompt = f"""Tu es un assistant pédagogique. Réponds à la question de l'apprenant
en te basant UNIQUEMENT sur le contexte fourni ci-dessous. Cite tes sources
en utilisant [Source X] dans ta réponse. Utilise UNIQUEMENT le numéro de page
donné, sans inventer de description de la source.

Contexte:
{context}

Question: {question}

Réponse:"""

    groq_client = get_groq_client()
    stream = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta