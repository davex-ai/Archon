import base64

import requests
import os
from dotenv import load_dotenv

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
    ".swift", ".m", ".mm", ".dart",
    # Documentation & Meta
    ".txt", ".rst", ".pdf", ".lock", ".gitignore", ".gitattributes"
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

    for file in prioritize_files(files)[:20]:  # LIMIT for now (important)
        content = get_file_content(owner, repo, file["path"])

        if content:
            results.append({
                "path": file["path"],
                "content": content[:5000]
            })


    return results
def score_file(path):
    score = 0

    if "README" in path:
        score += 3
    if any(key in path.lower() for key in IMPORTANT_FILES):
        score += 5
    if path.endswith((".js", ".ts", ".py")):
        score += 4

    return score


def prioritize_files(files):
    return sorted(files, key=lambda f: score_file(f["path"]), reverse=True)

def chunk_text(text, size=1000):
    return [text[i:i+size] for i in range(0, len(text), size)]

def process_files(files):
    processed = []

    for file in files:
        chunks = chunk_text(file["content"], size=1000)

        processed.append({
            "path": file["path"],
            "chunks": chunks
        })

    return processed

def summarize_chunks(processed_files):
    summaries = []

    for file in processed_files:
        chunk_summaries = []

        for chunk in file["chunks"]:
            # placeholder (LLM later)
            chunk_summaries.append(f"Summary of: {chunk[:100]}")

        file_summary = " ".join(chunk_summaries)

        summaries.append({
            "path": file["path"],
            "summary": file_summary
        })

    return summaries
def build_repo_summary(file_summaries):
    combined = "\n".join(
        f"{f['path']}:\n{f['summary']}"
        for f in file_summaries
    )

    return combined[:10000]