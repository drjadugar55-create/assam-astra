
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CBTExamPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const getToken = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error("Please log in to start the test.");
    }

    return session.access_token;
  }, []);

  const loadExam = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const startResponse = await fetch("/api/cbt/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testId: Number(testId) }),
      });

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        throw new Error(startData.error || "Unable to start test.");
      }

      let currentAttempt = startData.attempt;

      if (currentAttempt.status === "paused") {
        const resumeResponse = await fetch("/api/cbt/resume", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ attemptId: currentAttempt.id }),
        });

        const resumeData = await resumeResponse.json();

        if (!resumeResponse.ok) {
          throw new Error(resumeData.error || "Unable to resume test.");
        }

        currentAttempt = resumeData.attempt;
      }

      if (currentAttempt.status !== "in_progress") {
        throw new Error("This attempt is not currently active.");
      }

      setAttempt(currentAttempt);

      const questionsResponse = await fetch(
        `/api/cbt/questions?testId=${testId}&attemptId=${currentAttempt.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const questionsData = await questionsResponse.json();

      if (!questionsResponse.ok) {
        throw new Error(
          questionsData.error || "Unable to load questions."
        );
      }

      setTest(questionsData.test);
      setQuestions(questionsData.questions);

      const deadline = new Date(currentAttempt.deadline_at).getTime();

      const seconds = Math.max(
        0,
        Math.floor((deadline - Date.now()) / 1000)
      );

      setRemainingSeconds(seconds);
    } catch (err) {
      setError(err.message || "Unable to load exam.");
    } finally {
      setLoading(false);
    }
  }, [testId, getToken]);

  // Prevent browser-history restoration from silently creating
  // a new attempt after a previously submitted attempt.
  useEffect(() => {
    const submittedKey = `cbt-submitted-${testId}`;

    const navigationEntry = performance.getEntriesByType("navigation")[0];
    const isHistoryNavigation =
      navigationEntry?.type === "back_forward";

    if (
      isHistoryNavigation &&
      sessionStorage.getItem(submittedKey)
    ) {
      router.replace("/dashboard");
      return;
    }

    loadExam();

    // Handle pages restored from the browser's back-forward cache.
    const handlePageShow = (event) => {
      if (
        event.persisted &&
        sessionStorage.getItem(submittedKey)
      ) {
        router.replace("/dashboard");
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [loadExam, router, testId]);

  // Countdown timer
  useEffect(() => {
    if (loading || paused || result || !attempt) return;

    const timer = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, paused, result, attempt]);

  async function saveAnswer(questionId, selectedOption, isFlagged) {
    const token = await getToken();

    const body = {
      attemptId: attempt.id,
      questionId,
    };

    if (selectedOption !== undefined) {
      body.selectedOption = selectedOption;
    }

    if (isFlagged !== undefined) {
      body.isFlagged = isFlagged;
    }

    const response = await fetch("/api/cbt/save-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to save answer.");
    }

    return data;
  }

  async function selectOption(questionId, option) {
    try {
      setAnswers((previous) => ({
        ...previous,
        [questionId]: option,
      }));

      await saveAnswer(questionId, option, flags[questionId] || false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function clearAnswer(questionId) {
    try {
      setAnswers((previous) => {
        const updated = { ...previous };
        delete updated[questionId];
        return updated;
      });

      await saveAnswer(questionId, null, flags[questionId] || false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleFlag(questionId) {
    const newFlag = !(flags[questionId] || false);

    try {
      setFlags((previous) => ({
        ...previous,
        [questionId]: newFlag,
      }));

      await saveAnswer(
        questionId,
        answers[questionId],
        newFlag
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function pauseExam() {
    try {
      const token = await getToken();

      const response = await fetch("/api/cbt/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attemptId: attempt.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to pause exam.");
      }

      setAttempt(data.attempt);
      setRemainingSeconds(data.attempt.remaining_seconds || 0);
      setPaused(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function resumeExam() {
    try {
      const token = await getToken();

      const response = await fetch("/api/cbt/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attemptId: attempt.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to resume exam.");
      }

      setAttempt(data.attempt);

      const deadline = new Date(data.attempt.deadline_at).getTime();

      setRemainingSeconds(
        Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      );

      setPaused(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitExam(isAutomatic = false) {
    if (submitting || result) return;

    try {
      setSubmitting(true);
      setError("");

      const token = await getToken();

      const response = await fetch(
        isAutomatic ? "/api/cbt/auto-submit" : "/api/cbt/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ attemptId: attempt.id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit test.");
      }

      // Record successful submission for browser-history protection.
      sessionStorage.setItem(
        `cbt-submitted-${testId}`,
        attempt.id
      );

      setResult(data.result);
      setPaused(false);
      setShowSubmitConfirm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAutoSubmit() {
    await submitExam(true);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainder
    ).padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <main className="cbt-page">
        <div className="cbt-message">Loading examination...</div>
      </main>
    );
  }

  if (error && !test) {
    return (
      <main className="cbt-page">
        <div className="cbt-message cbt-error">
          {error}
        </div>

        <button onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </button>
      </main>
    );
  }

  if (result) {
    return (
      <main className="cbt-page">
        <div className="cbt-result-card">
          <h1>Test Submitted</h1>
          <p>Your examination has been completed.</p>

          <div className="cbt-score">
            {result.score} / {result.totalMarks}
          </div>

          <div className="cbt-result-grid">
            <div>
              <strong>{result.correct}</strong>
              <span>Correct</span>
            </div>

            <div>
              <strong>{result.wrong}</strong>
              <span>Wrong</span>
            </div>

            <div>
              <strong>{result.unanswered}</strong>
              <span>Unanswered</span>
            </div>
          </div>

          <p className="cbt-result-note">
            Your result has been recorded.
          </p>

          <button
            className="cbt-primary"
            onClick={() => router.push("/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!questions.length) {
    return (
      <main className="cbt-page">
        <div className="cbt-message">No questions found.</div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const questionId = currentQuestion.id;

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flags).filter(Boolean).length;

  return (
    <main className="cbt-page">
      <header className="cbt-header">
        <div>
          <h1>{test?.title || "Mock Test"}</h1>

          <p>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        <div
          className={`cbt-timer ${
            remainingSeconds <= 60 ? "cbt-timer-danger" : ""
          }`}
        >
          {formatTime(remainingSeconds)}
        </div>
      </header>

      {error && (
        <div className="cbt-error-banner">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {paused ? (
        <section className="cbt-paused-card">
          <h2>Exam Paused</h2>
          <p>Your remaining time has been saved.</p>

          <p className="cbt-timer">
            {formatTime(remainingSeconds)}
          </p>

          <button className="cbt-primary" onClick={resumeExam}>
            Resume Exam
          </button>
        </section>
      ) : (
        <>
          <div className="cbt-main-layout">
            <section className="cbt-question-card">
              <div className="cbt-question-top">
                <span>Question {currentIndex + 1}</span>

                {flags[questionId] && (
                  <span className="cbt-flag-label">
                    Marked for review
                  </span>
                )}
              </div>

              <h2>{currentQuestion.question_text}</h2>

              {currentQuestion.question_assamese && (
                <p className="cbt-assamese">
                  {currentQuestion.question_assamese}
                </p>
              )}

              <div className="cbt-options">
                {["A", "B", "C", "D"].map((option) => {
                  const optionText =
                    currentQuestion[`option_${option.toLowerCase()}`];

                  const selected = answers[questionId] === option;

                  return (
                    <button
                      key={option}
                      className={`cbt-option ${
                        selected ? "cbt-option-selected" : ""
                      }`}
                      onClick={() => selectOption(questionId, option)}
                    >
                      <span className="cbt-option-letter">
                        {option}
                      </span>

                      <span>{optionText}</span>
                    </button>
                  );
                })}
              </div>

              <div className="cbt-question-actions">
                <button
                  className="cbt-secondary"
                  onClick={() => clearAnswer(questionId)}
                  disabled={!answers[questionId]}
                >
                  Clear Response
                </button>

                <button
                  className={`cbt-secondary ${
                    flags[questionId] ? "cbt-flag-active" : ""
                  }`}
                  onClick={() => toggleFlag(questionId)}
                >
                  {flags[questionId]
                    ? "Remove Flag"
                    : "Mark for Review"}
                </button>
              </div>

              <div className="cbt-navigation">
                <button
                  className="cbt-secondary"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  Previous
                </button>

                <button
                  className="cbt-primary"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((i) => i + 1)}
                >
                  Save & Next
                </button>
              </div>
            </section>

            <aside className="cbt-palette-card">
              <h3>Question Palette</h3>

              <div className="cbt-palette">
                {questions.map((question, index) => {
                  const answered = !!answers[question.id];
                  const flagged = !!flags[question.id];

                  let className = "cbt-palette-button";

                  if (answered) className += " cbt-palette-answered";

                  if (flagged && !answered) {
                    className += " cbt-palette-flagged";
                  }

                  if (flagged && answered) {
                    className += " cbt-palette-answered-flagged";
                  }

                  if (index === currentIndex) {
                    className += " cbt-palette-current";
                  }

                  return (
                    <button
                      key={question.id}
                      className={className}
                      onClick={() => setCurrentIndex(index)}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="cbt-palette-legend">
                <div>
                  <span className="cbt-legend-box" />
                  Unanswered
                </div>

                <div>
                  <span className="cbt-legend-box cbt-legend-green" />
                  Answered
                </div>

                <div>
                  <span className="cbt-legend-box cbt-legend-orange" />
                  Flagged
                </div>
              </div>

              <div className="cbt-stats">
                <p>
                  Answered: <strong>{answeredCount}</strong>
                </p>

                <p>
                  Flagged: <strong>{flaggedCount}</strong>
                </p>

                <p>
                  Total: <strong>{questions.length}</strong>
                </p>
              </div>

              <button
                className="cbt-secondary cbt-pause-button"
                onClick={pauseExam}
              >
                Pause Exam
              </button>

              <button
                className="cbt-submit-button"
                onClick={() => setShowSubmitConfirm(true)}
              >
                Submit Test
              </button>
            </aside>
          </div>

          {showSubmitConfirm && (
            <div className="cbt-modal-overlay">
              <div className="cbt-modal">
                <h2>Submit your test?</h2>

                <p>
                  You answered {answeredCount} out of {questions.length}{" "}
                  questions.
                </p>

                <p>
                  {questions.length - answeredCount} questions remain
                  unanswered.
                </p>

                <p>Once submitted, you cannot change your answers.</p>

                <div className="cbt-modal-actions">
                  <button
                    className="cbt-secondary"
                    onClick={() => setShowSubmitConfirm(false)}
                  >
                    Continue Test
                  </button>

                  <button
                    className="cbt-submit-button"
                    disabled={submitting}
                    onClick={() => submitExam(false)}
                  >
                    {submitting ? "Submitting..." : "Confirm Submit"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
