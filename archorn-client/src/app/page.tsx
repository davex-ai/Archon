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
  fallback_reason?: string | null;
  result: QA[];
};

type Batch = {
  mode?: string;
  items: QA[];
};

const API_URL = "https://davex-ai-archon-backend.hf.space/analyze";
const MAX_QUESTIONS = 10;

class ApiError extends Error {}

const clamp = (n: number) => Math.min(MAX_QUESTIONS, Math.max(1, Math.floor(n) || 1));

export default function RepoInterviewer() {
  const [repoUrl, setRepoUrl] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeRepo, setActiveRepo] = useState(""); // repo the current session was generated for
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const allQuestions = batches.flatMap((b) => b.items);

  const requestBatch = async (url: string, count: number, exclude: string[]): Promise<ApiResponse> => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: url, num_questions: count, exclude }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(err.detail || "Something went wrong");
    }

    const data: ApiResponse = await res.json();
    if (data.mode === "mock") {
      console.warn(`[Archon] Mock questions used. Reason: ${data.fallback_reason ?? "unknown"}`);
    }
    return data;
  };

  const showError = (e: unknown) => {
    console.error(e);
    setError(
      e instanceof ApiError
        ? e.message
        : "Something went wrong generating questions. Please try again in a moment."
    );
  };

  // Fresh session: new repo / new Generate click.
  const handleSubmit = async () => {
    const url = repoUrl.trim();
    if (!url || loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    setBatches([]);
    setRevealed({});

    try {
      const data = await requestBatch(url, clamp(numQuestions), []);
      setActiveRepo(url);
      setBatches([{ mode: data.mode, items: data.result }]);
    } catch (e: unknown) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  // Follow-up set: same repo, tells the backend what was already asked.
  const handleMore = async () => {
    if (!activeRepo || loading) return;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const asked = allQuestions.map((q) => q.question);
      const data = await requestBatch(activeRepo, clamp(numQuestions), asked);

      // Safety net: drop anything the user has already seen.
      const seen = new Set(asked.map((q) => q.trim().toLowerCase()));
      const fresh = data.result.filter((q) => !seen.has(q.question.trim().toLowerCase()));

      if (fresh.length === 0) {
        setNotice("No new questions are available for this repo right now. Try again in a moment, or start with a different repo.");
      } else {
        setBatches((prev) => [...prev, { mode: data.mode, items: fresh }]);
        if (fresh.length < clamp(numQuestions)) {
          setNotice(`Only ${fresh.length} new question${fresh.length !== 1 ? "s were" : " was"} available this time.`);
        }
      }
    } catch (e: unknown) {
      showError(e); // keeps the questions already on screen
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (i: number) =>
    setRevealed((prev) => ({ ...prev, [i]: !prev[i] }));

  const revealAll = () => {
    const all: Record<number, boolean> = {};
    allQuestions.forEach((_, i) => (all[i] = true));
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
          AR<span className="accent">CH</span>
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
                max={MAX_QUESTIONS}
                value={numQuestions}
                onChange={(e) => setNumQuestions(clamp(Number(e.target.value)))}
              />
            </div>
            <button data-track="ask_questions" className="btn" onClick={handleSubmit} disabled={loading || !repoUrl.trim()}>
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

        {notice && (
          <div className="meta-count" style={{ margin: "12px 0", textAlign: "center" }}>
            {notice}
          </div>
        )}

        {batches.length > 0 && (
          <div className="fade-in">
            <div className="meta-bar">
              <div className="meta-info">
                <span className="meta-repo">{activeRepo}</span>
                <span className="meta-count">
                  {allQuestions.length} question{allQuestions.length !== 1 ? "s" : ""} generated
                  {batches.length > 1 && ` · ${batches.length} sets`}
                  {batches.some((b) => b.mode === "mock") && " · includes mock questions"}
                </span>
              </div>
              <div className="meta-actions">
                <button className="btn btn-ghost" onClick={revealAll}>Reveal all</button>
                <button className="btn btn-ghost" onClick={hideAll}>Hide all</button>
              </div>
            </div>

            {batches.map((batch, b) => {
              const offset = batches.slice(0, b).reduce((n, x) => n + x.items.length, 0);
              return (
                <div key={b}>
                  {b > 0 && (
                    <div className="meta-count" style={{ margin: "24px 0 12px", textAlign: "center" }}>
                      Set {b + 1}{batch.mode ? ` · ${batch.mode} mode` : ""}
                    </div>
                  )}

                  {batch.items.map((qa, j) => {
                    const i = offset + j;
                    return (
                      <div
                        key={i}
                        className={`question-card fade-in stagger-${Math.min(j, 9)}`}
                        style={{ animationDelay: `${j * 60}ms` }}
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
                    );
                  })}
                </div>
              );
            })}

            <div className="form-card" style={{ marginTop: "24px", textAlign: "center" }}>
              <p className="meta-count" style={{ marginBottom: "14px" }}>
                Done with these? Get {clamp(numQuestions)} new questions on the same repo. Ones you&apos;ve already seen won&apos;t repeat.
              </p>
              <button className="btn" onClick={handleMore} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" /> Generating…
                  </>
                ) : (
                  <>Generate {clamp(numQuestions)} more</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      <footer style={{
      marginTop: "40px",
      padding: "20px",
      textAlign: "center",
      color: "#CBC3E3", // Subtle gray to match dark mode
      fontSize: "0.85rem",
    }}>
      <p>
        © 2026 Archon • Built by <a href="https://davex-ai.vercel.app"> Dave</a>
      </p>
    </footer>
    </>
  );
}
