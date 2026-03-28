"use client"
import { useState } from "react";

type QA = {
  question: string;
  answer: string;
};

type ApiResponse = {
  repo: string;
  questions_requested: number;
  mode?: string;
  result: QA[];
};

export default function RepoInterviewer() {
  const [repoUrl, setRepoUrl] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const handleSubmit = async () => {
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError("");
    setResponse(null);
    setRevealed({});

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl, num_questions: numQuestions }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Something went wrong");
      }

      const data: ApiResponse = await res.json();
      setResponse(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (i: number) =>
    setRevealed((prev) => ({ ...prev, [i]: !prev[i] }));

  const revealAll = () => {
    if (!response) return;
    const all: Record<number, boolean> = {};
    response.result.forEach((_, i) => (all[i] = true));
    setRevealed(all);
  };

  const hideAll = () => setRevealed({});

  return (
    <>
      <div className="grid-bg" />
      <div className="glow-orb" />
      <div className="glow-orb-2" />

      <div className="container">
        <div className="badge">
          <span className="badge-dot" />
          AI-Powered
        </div>

        <h1>
          AR <span className="accent">CH</span>
          <br />
          <span className="accent-teal">ON</span>
        </h1>

        <p className="subtitle">
          Paste a GitHub repository URL and generate targeted technical interview questions based on the codebase.
        </p>

        <div className="form-card">
          <div className="input-wrap">
            <label className="label">Repository URL</label>
            <span className="input-icon">gh/</span>
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="row">
            <div>
              <label className="label">Questions</label>
              <input
                type="number"
                min={1}
                max={20}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
              />
            </div>
            <button className="btn" onClick={handleSubmit} disabled={loading || !repoUrl.trim()}>
              {loading ? (
                <>
                  <span className="spinner" /> Analyzing…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-box">
            ✗ {error}
          </div>
        )}

        {response && (
          <div className="fade-in">
            <div className="meta-bar">
              <div className="meta-info">
                <span className="meta-repo">{response.repo}</span>
                <span className="meta-count">
                  {response.result.length} question{response.result.length !== 1 ? "s" : ""} generated
                  {response.mode && ` · ${response.mode} mode`}
                </span>
              </div>
              <div className="meta-actions">
                <button className="btn btn-ghost" onClick={revealAll}>Reveal all</button>
                <button className="btn btn-ghost" onClick={hideAll}>Hide all</button>
              </div>
            </div>

            {response.result.map((qa, i) => (
              <div
                key={i}
                className={`question-card fade-in stagger-${Math.min(i, 9)}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="q-header">
                  <div className="q-number">Q{i + 1}</div>
                  <div className="q-text">{qa.question}</div>
                  <button
                    className={`toggle-btn ${revealed[i] ? "revealed" : ""}`}
                    onClick={() => toggleReveal(i)}
                  >
                    {revealed[i] ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                        Hide
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Answer
                      </>
                    )}
                  </button>
                </div>

                <div className={`answer-panel ${revealed[i] ? "visible" : "hidden"}`}>
                  <div className="answer-inner">
                    <div className="answer-label">Answer</div>
                    <div className="answer-text">{qa.answer}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
