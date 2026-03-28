
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from github_client import fetch_repo_contents

app = FastAPI()

class RepoRequest(BaseModel):
    repo_url: str
    num_questions: int = 5


@app.get("/")
def home():
    return {"message": "Repo Interview Generator API"}


@app.post("/analyze")
def analyze_repo(data: RepoRequest):
    try:
        files = fetch_repo_contents(data.repo_url)
        return {
            "files fetched": len(files),
            "sample": files[:2],
            "repo": data.repo_url,
            "branch": data.repo_url.split("/")[-1],
            "questions_requested": data.num_questions,
            "status": "coming soon"
        }
    except Exception as e:
        if "GitHub API error" in str(e):
            raise HTTPException(status_code=404, detail="Repository not found or inaccessible")

    # Catch-all for other errors (like connection issues)
    raise HTTPException(status_code=500, detail=str(e))