import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request) {
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

    // 2. Read test ID
    const body = await request.json();
    const testId = body.testId;

    if (!testId) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // 3. Verify published test
    const { data: test, error: testError } = await supabaseAdmin
      .from("mock_tests")
      .select("id, title, duration_minutes, total_marks, status")
      .eq("id", testId)
      .eq("status", "published")
      .maybeSingle();

    if (testError) {
      console.error("CBT start test lookup error:", testError);

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

    // 4. Check for an existing active or paused attempt
    const { data: existingAttempt, error: existingError } =
      await supabaseAdmin
        .from("test_attempts")
        .select(
          "id, student_id, mock_test_id, status, started_at, deadline_at, paused_at, remaining_seconds"
        )
        .eq("student_id", studentId)
        .eq("mock_test_id", testId)
        .in("status", ["in_progress", "paused"])
        .maybeSingle();

    if (existingError) {
      console.error("CBT existing attempt lookup error:", existingError);

      return NextResponse.json(
        { error: "Unable to check existing attempts" },
        { status: 500 }
      );
    }

    // 5. Return existing attempt if found
    if (existingAttempt) {
      return NextResponse.json(
        {
          message: "Existing test attempt retrieved",
          resumed: true,
          test: {
            id: test.id,
            title: test.title,
            duration_minutes: test.duration_minutes,
            total_marks: test.total_marks,
          },
          attempt: existingAttempt,
        },
        { status: 200 }
      );
    }

    // 6. Verify that the test contains questions
    const { count, error: countError } = await supabaseAdmin
      .from("mock_test_questions")
      .select("*", { count: "exact", head: true })
      .eq("mock_test_id", testId);

    if (countError) {
      console.error("CBT question count error:", countError);

      return NextResponse.json(
        { error: "Unable to check test questions" },
        { status: 500 }
      );
    }

    if (!count || count < 1) {
      return NextResponse.json(
        { error: "This test has no questions yet" },
        { status: 400 }
      );
    }

    // 7. Calculate server-side deadline
    const startedAt = new Date();

    const deadlineAt = new Date(
      startedAt.getTime() + test.duration_minutes * 60 * 1000
    );

    // 8. Create new attempt
    const { data: attempt, error: insertError } = await supabaseAdmin
      .from("test_attempts")
      .insert({
        student_id: studentId,
        mock_test_id: test.id,
        status: "in_progress",
        started_at: startedAt.toISOString(),
        deadline_at: deadlineAt.toISOString(),
      })
      .select(
        "id, student_id, mock_test_id, status, started_at, deadline_at, paused_at, remaining_seconds"
      )
      .single();

    // 9. Handle concurrent start requests
    if (insertError) {
      if (insertError.code === "23505") {
        const { data: concurrentAttempt, error: retryError } =
          await supabaseAdmin
            .from("test_attempts")
            .select(
              "id, student_id, mock_test_id, status, started_at, deadline_at, paused_at, remaining_seconds"
            )
            .eq("student_id", studentId)
            .eq("mock_test_id", testId)
            .in("status", ["in_progress", "paused"])
            .maybeSingle();

        if (!retryError && concurrentAttempt) {
          return NextResponse.json(
            {
              message: "Existing test attempt retrieved",
              resumed: true,
              test: {
                id: test.id,
                title: test.title,
                duration_minutes: test.duration_minutes,
                total_marks: test.total_marks,
              },
              attempt: concurrentAttempt,
            },
            { status: 200 }
          );
        }
      }

      console.error("CBT attempt creation error:", insertError);

      return NextResponse.json(
        { error: "Unable to start test" },
        { status: 500 }
      );
    }

    // 10. Return newly created attempt
    return NextResponse.json(
      {
        message: "Test started successfully",
        resumed: false,
        test: {
          id: test.id,
          title: test.title,
          duration_minutes: test.duration_minutes,
          total_marks: test.total_marks,
        },
        attempt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CBT start API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}