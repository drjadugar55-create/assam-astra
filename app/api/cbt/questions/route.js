
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request) {
  try {
    // 1. Authenticate the student
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const studentId = authData.user.id;

    // 2. Get test ID and attempt ID
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("testId");
    const attemptId = searchParams.get("attemptId");

    if (!testId || !attemptId) {
      return NextResponse.json(
        { error: "Test ID and attempt ID are required" },
        { status: 400 }
      );
    }

    // 3. Verify this attempt belongs to this student and test
    const { data: attempt, error: attemptError } =
      await supabaseAdmin
        .from("test_attempts")
        .select("id, student_id, mock_test_id, status")
        .eq("id", attemptId)
        .eq("student_id", studentId)
        .eq("mock_test_id", testId)
        .eq("status", "in_progress")
        .maybeSingle();

    if (attemptError) {
      console.error("CBT attempt verification error:", attemptError);

      return NextResponse.json(
        { error: "Unable to verify test attempt" },
        { status: 500 }
      );
    }

    if (!attempt) {
      return NextResponse.json(
        { error: "Valid active test attempt not found" },
        { status: 403 }
      );
    }

    // 4. Verify the test is published
    const { data: test, error: testError } = await supabaseAdmin
      .from("mock_tests")
      .select("id, title, description, duration_minutes, total_marks, status")
      .eq("id", testId)
      .eq("status", "published")
      .maybeSingle();

    if (testError) {
      console.error("CBT test lookup error:", testError);

      return NextResponse.json(
        { error: "Unable to retrieve test" },
        { status: 500 }
      );
    }

    if (!test) {
      return NextResponse.json(
        { error: "Test not found or not published" },
        { status: 404 }
      );
    }

    // 5. Retrieve question IDs in test order
    const { data: testQuestions, error: orderError } =
      await supabaseAdmin
        .from("mock_test_questions")
        .select("question_id, question_order")
        .eq("mock_test_id", testId)
        .order("question_order", { ascending: true });

    if (orderError) {
      console.error("CBT question-order error:", orderError);

      return NextResponse.json(
        { error: "Unable to retrieve test questions" },
        { status: 500 }
      );
    }

    if (!testQuestions || testQuestions.length === 0) {
      return NextResponse.json(
        { error: "This test has no questions yet" },
        { status: 404 }
      );
    }

    // 6. Retrieve student-safe question content
    const questionIds = testQuestions.map(
      (item) => item.question_id
    );

    const { data: questions, error: questionsError } =
      await supabaseAdmin
        .from("questions")
        .select(
          "id, subject_id, question_text, question_assamese, option_a, option_b, option_c, option_d, difficulty"
        )
        .in("id", questionIds);

    if (questionsError) {
      console.error("CBT question-content error:", questionsError);

      return NextResponse.json(
        { error: "Unable to retrieve question content" },
        { status: 500 }
      );
    }

    // 7. Restore original question order
    const questionMap = new Map(
      questions.map((question) => [question.id, question])
    );

    const orderedQuestions = testQuestions
      .map((item) => questionMap.get(item.question_id))
      .filter(Boolean);

    // 8. Return only safe information
    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        duration_minutes: test.duration_minutes,
        total_marks: test.total_marks,
      },
      attempt: {
        id: attempt.id,
        status: attempt.status,
      },
      questions: orderedQuestions,
    });
  } catch (error) {
    console.error("CBT questions API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
