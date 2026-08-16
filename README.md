# 🧠 EduMind - Plateforme d'Apprentissage Intelligent (EdTech)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-FF6F00?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-Llama_3-f54242?style=for-the-badge)

EduMind est une application web innovante conçue pour transformer l'apprentissage passif (lecture de PDF) en une expérience interactive et personnalisée. Propulsée par l'Intelligence Artificielle (RAG, Embeddings, LLM) et une **architecture Multi-Agents**, la plateforme permet aux apprenants d'interagir avec leurs documents, de générer des quiz sur mesure et de recevoir un accompagnement pédagogique intelligent.

---

## ✨ Fonctionnalités Principales

*   **Gestion Documentaire Intelligente :** Téléversement de fichiers PDF vers un stockage MinIO (compatible S3), extraction du texte, découpage (chunking) et vectorisation.
*   **Chat IA Contextuel (RAG) :** Échangez avec un Agent Pédagogique qui base ses réponses *uniquement* sur vos documents. Supporte le streaming (SSE) et inclut des **citations cliquables** renvoyant à la page exacte du PDF.
*   **Génération de Quiz par IA :** Création automatique de QCM, Vrai/Faux et questions ouvertes adaptés au niveau de difficulté choisi.
*   **Correction Sémantique :** Évaluation automatique des réponses ouvertes grâce à un Agent Correcteur (LLM) fournissant un feedback constructif.
*   **Système Multi-Agents (CrewAI) :** 
    *   *Orchestrateur* : Classification des intentions.
    *   *Agent RAG* : Recherche vectorielle.
    *   *Agent Pédagogique* : Rédaction adaptée au niveau (Débutant, Intermédiaire, Expert).
    *   *Agent Générateur* : Création des quiz.
    *   *Agent d'Évaluation* : Correction sémantique.
    *   *Agent de Notification* : Envoi d'e-mails récapitulatifs.

---

## 🛠️ Stack Technique

### Backend (API & IA)
*   **Framework :** Python 3.12, Django, Django REST Framework
*   **Multi-Agents :** CrewAI
*   **LLM & Embeddings :** Llama-3.1-8b-instant (via API Groq), `sentence-transformers` (all-MiniLM-L6-v2)
*   **Base Vectorielle :** ChromaDB
*   **Extraction PDF :** `pdfplumber`

### Frontend
*   **Framework :** React 18, Vite
*   **Styling :** Tailwind CSS, Lucide Icons
*   **Architecture :** Single Page Application (SPA), Requêtes Axios avec Interceptors (JWT)

### Infrastructure & Données
*   **Base de données relationnelle :** PostgreSQL
*   **Stockage de fichiers (Object Storage) :** MinIO

---

## 🚀 Installation et Démarrage

### Prérequis
*   Node.js (v18+)
*   Python (3.11 ou 3.12)
*   Docker & Docker Compose (Recommandé pour PostgreSQL, MinIO et ChromaDB)

### 1. Clonage du dépôt
```bash
git clone https://github.com/ABDERRAZZAK-IMILY/edumind.git
cd edumind
```

### 2. Configuration de l'environnement Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate
pip install -r requirements.txt
```

Créez un fichier `.env` dans le dossier `backend/` :
```env
# Django
SECRET_KEY=votre_secret_key_django
DEBUG=True

# Base de données PostgreSQL
DB_NAME=edumind_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# MinIO (Stockage PDF)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password
MINIO_BUCKET_NAME=documents

# IA (Groq & Chroma)
GROQ_API_KEY=votre_cle_api_groq
CHROMA_HOST=localhost
CHROMA_PORT=8001
```

Appliquez les migrations et lancez le serveur :
```bash
python manage.py migrate
python manage.py runserver
```

### 3. Configuration de l'environnement Frontend
```bash
cd ../frontend
npm install
```

Créez un fichier `.env` dans le dossier `frontend/` (si nécessaire pour configurer l'URL de l'API) ou utilisez le proxy Vite par défaut configuré vers `http://localhost:8000`.

Lancez le serveur de développement :
```bash
npm run dev
```

---

## 💡 Utilisation (Workflow type)

1.  **Connexion :** Connectez-vous avec un compte Apprenant.
2.  **Upload :** Dans la barre latérale gauche, uploadez un cours au format PDF. Attendez la fin du traitement (Vectorisation).
3.  **Apprentissage :** Sélectionnez le document. Posez des questions dans le chat central. Cliquez sur les étiquettes de source pour visualiser la page exacte du PDF à droite.
4.  **Évaluation :** Dans le panneau de droite, choisissez "Quiz & Synthèse", paramétrez la difficulté et générez un quiz pour tester vos connaissances.

---

## 👨‍💻 Auteur
Développé par **Abderrazzak Imily** dans le cadre du BRIEF EdTech pour le renforcement des compétences en Intelligence Artificielle.