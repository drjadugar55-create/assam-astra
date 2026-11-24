"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CBTTestPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function testSaveAndSubmit() {
    setLoading(true);
    setResult(null);

    try {
      const supabase = createClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setResult({ error: "No logged-in session found." });
        return;
      }

      const token = session.access_token;

      // STEP 1: Start a fresh attempt
      const startResponse = await fetch("/api/cbt/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testId: 1 }),
      });

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        setResult({
          step: "Start API failed",
          status: startResponse.status,
          response: startData,
        });
        return;
      }

      const attemptId = startData.attempt.id;

      // STEP 2: Fetch questions
      const questionsResponse = await fetch(
        `/api/cbt/questions?testId=1&attemptId=${attemptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const questionsData = await questionsResponse.json();

      if (!questionsResponse.ok) {
        setResult({
          step: "Questions API failed",
          status: questionsResponse.status,
          response: questionsData,
        });
        return;
      }

      const questionId = questionsData.questions[0].id;

      // STEP 3: Save answer B for Question 1
      const saveResponse = await fetch("/api/cbt/save-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attemptId,
          questionId,
          selectedOption: "B",
          isFlagged: false,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        setResult({
          startAPI: {
            status: startResponse.status,
            response: startData,
          },
          questionsAPI: {
            status: questionsResponse.status,
            questionCount: questionsData.questions.length,
          },
          saveAnswerAPI: {
            status: saveResponse.status,
            response: saveData,
          },
          message: "Submission stopped because answer saving failed.",
        });
        return;
      }

      // STEP 4: Submit immediately
      const submitResponse = await fetch("/api/cbt/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attemptId }),
      });

      const submitData = await submitResponse.json();

      setResult({
        startAPI: {
          status: startResponse.status,
          response: startData,
        },
        questionsAPI: {
          status: questionsResponse.status,
          questionCount: questionsData.questions.length,
        },
        saveAnswerAPI: {
          status: saveResponse.status,
          response: saveData,
        },
        submitAPI: {
          status: submitResponse.status,
          response: submitData,
        },
      });
    } catch (error) {
      setResult({
        error: error.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <h1>CBT Integration Test</h1>

      <p>Test ID: 1</p>
      <p>Test: CBT Integration Test - Temporary</p>

      <p>
        This test creates an attempt, saves answer B for Question 1, and submits
        the test for scoring.
      </p>

      <button
        onClick={testSaveAndSubmit}
        disabled={loading}
        style={{
          padding: "12px 20px",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Testing Save + Submit..." : "Test Save + Submit"}
      </button>

      {result && (
        <pre
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f1f1f1",
            color: "#111",
            borderRadius: "8px",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}