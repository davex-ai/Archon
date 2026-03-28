
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from github_client import  generate_questions_from_repo

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
        result = generate_questions_from_repo(
            data.repo_url,
            data.num_questions
        )

        return {
            "repo": data.repo_url,
            "questions_requested": data.num_questions,
            "result": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

