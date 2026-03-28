import base64
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import requests
import os
from dotenv import load_dotenv

from ai import call_llm
from fake_ai import generate_mock_questions

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

HEADERS = {
    "Accept": "application/vnd.github+json"
}

if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"



def get_repo_tree(owner, repo, branch):
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"

    res = requests.get(url, headers=HEADERS)

    if res.status_code != 200:
        raise Exception(f"GitHub API error: {res.json()}")

    return res.json()["tree"]


ALLOWED_EXTENSIONS = (
    ".py", ".js", ".ts", ".jsx", ".tsx", ".md", ".json",
    ".html", ".htm", ".css", ".scss", ".sass", ".less",
    ".csv", ".sql", ".xml", ".sh", ".bash", ".bat", ".ps1", ".ipynb",
    ".php", ".rb", ".java", ".go", ".cs", ".scala", ".kt", ".kts", ".ex", ".exs",
    ".swift", ".m", ".mm", ".dart", ".rst", ".gitattributes"
)

IMPORTANT_FILES = [
    "server/",
    "src/",
    "app/",
    "index",
    "main",
    "api",
]

def filter_files(tree):
    return [
        file for file in tree
        if file["type"] == "blob" and file["path"].endswith(ALLOWED_EXTENSIONS)
    ]


def get_file_content(owner, repo, path):
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

    res = requests.get(url, headers=HEADERS)

    if res.status_code != 200:
        return None

    data = res.json()

    content = base64.b64decode(data["content"]).decode("utf-8", errors="ignore")

    return content


from urllib.parse import urlparse


def parse_github_url(url: str):
    path = urlparse(url).path.strip("/")
    parts = path.split("/")

    if len(parts) < 2:
        raise ValueError("Invalid GitHub URL")

    owner, repo = parts[0], parts[1]
    return owner, repo

def get_default_branch(owner, repo):
    url = f"https://api.github.com/repos/{owner}/{repo}"
    res = requests.get(url, headers=HEADERS)
    if res.status_code != 200:
        raise Exception(f"GitHub API error: {res.json()}")
    return res.json()["default_branch"]

def fetch_repo_contents(repo_url):

    owner, repo = parse_github_url(repo_url)
    branch = get_default_branch(owner, repo)

    tree = get_repo_tree(owner, repo, branch)
    files = filter_files(tree)

    results = []

    for file in prioritize_files(files)[:20]:
        content = get_file_content(owner, repo, file["path"])

        if content:
            results.append({
                "path": file["path"],
                "content": content
            })


    return results
def score_file(path):
    score = 0

    if "README" in path:
        score += 3
    if any(key in path.lower() for key in IMPORTANT_FILES):
        score += 5
    if path.endswith((".js", ".ts", ".py", ".java", ".jsx", ".c")):
        score += 4

    return score


def prioritize_files(files):
    return sorted(files, key=lambda f: score_file(f["path"]), reverse=True)

def chunk_text(text, size=1000):
    lines = text.split("\n")
    chunks = []
    current = []

    current_len = 0

    for line in lines:
        current.append(line)
        current_len += len(line)

        if current_len >= size:
            chunks.append("\n".join(current))
            current = []
            current_len = 0

    if current:
        chunks.append("\n".join(current))
    return chunks

def process_files(files):
    processed = []

    for file in files:
        chunks = chunk_text(file["content"], size=1000)

        processed.append({
            "path": file["path"],
            "chunks": chunks
        })

    return processed

def classify_file(path):
    if "server" in path or path.endswith(".py") or path.endswith(".js"):
        return "backend"
    if "client" in path or path.endswith(".jsx"):
        return "frontend"
    if "config" in path or path.endswith(".json"):
        return "config"
    return "other"

def filter_chunks(chunks):
    return [
        c for c in chunks
        if len(c.strip()) > 50 and (
            "import" in c or "function" in c or "class" in c
        )
    ]
def build_retrieval_query():
    return """
core architecture system design scalability performance
state management data flow backend logic frontend interaction
real-time communication concurrency bottlenecks tradeoffs
"""

def build_question_prompt(repo_summary, signals, num_questions):
    return f"""
You are a senior software engineer conducting a deep technical interview.

Repository Summary:
{repo_summary}

Detected System Signals:
{signals}

Generate {num_questions} deep interview questions and strong answers.

Focus on:
- architecture decisions
- scalability challenges
- tradeoffs (e.g. WebSockets vs polling)
- real-world engineering issues

Avoid generic questions.
Format:
Q1:
A1:
"""
embeddings = [
    {
        "chunk": "...",
        "vector": [...]
    }
]

def retrieve(query_vector, embeddings, top_k=5):
    scored = []

    for item in embeddings:
        score = cosine_similarity(
            [query_vector],
            [item["vector"]]
        )[0][0]

        scored.append((score, item))

    scored = sorted(scored, key=lambda x: x[0], reverse=True)

    return [item for _, item in scored[:top_k]]

def build_embeddings(processed_files):
    index = []

    for file in processed_files:
        filtered = filter_chunks(file["chunks"])

        for chunk in filtered:
            vector = embed_text(chunk)

            index.append({
                "chunk": chunk,
                "vector": vector,
                "path": file["path"]
            })

    return index

def format_context(chunks):
    return "\n\n".join([
         f"[FILE: {c['path']}]\n{c['chunk'][:800]}"
        for c in chunks
    ])


def generatuestions_from_repo(repo_url, num_questions=5):
    # 1. Fetch
    files = fetch_repo_contents(repo_url)

    # 2. Process
    processed = process_files(files)

    # 3. Build embeddings
    embedding_index = build_embeddings(processed)

    # 4. Build query
    query = build_retrieval_query()
    query_vector = embed_text(query)

    # 5. Retrieve relevant chunks
    top_chunks = retrieve(query_vector, embedding_index, top_k=8)

    # 6. Build context
    context = format_context(top_chunks)

    # 7. Build final prompt
    prompt = f"""
You are a senior software engineer conducting a deep technical interview.

Analyze this code context:

{context}

Generate {num_questions} deep technical interview questions and answers.

Focus on:
- architecture
- scalability
- tradeoffs
- real-world engineering challenges

Format:
Q1:
A1:
"""
    try:
        result = call_llm(prompt)

        return {
            "mode": "llm",
            "data": result
        }

    except Exception as e:
        print("LLM failed, falling back to mock:", str(e))

        mock = generate_mock_questions(top_chunks, num_questions)

        return {
            "mode": "mock",
            "data": mock
        }

model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text):
    return model.encode(text)

repo_cache = {}

def get_or_create_embeddings(repo_url, processed):
    if repo_url in repo_cache:
        return repo_cache[repo_url]

    embeddings = build_embeddings(processed)
    repo_cache[repo_url] = embeddings
    return embeddings