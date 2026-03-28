from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class RepoRequest(BaseModel):
    repo_url: str
    num_questions: int = 5


@app.get("/")
def home():
    return {"message": "Repo Interview Generator API"}


@app.post("/analyze")
def analyze_repo(data: RepoRequest):
    return {
        "repo": data.repo_url,
        "questions_requested": data.num_questions,
        "status": "coming soon"
    }