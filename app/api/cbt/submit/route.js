import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    // 1. Authenticate student
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // 2. Read request
    const body = await request.json();
    const { attemptId } = body;

    if (!attemptId) {
      return NextResponse.json(
        { error: "Attempt ID is required" },
        { status: 400 }
      );
    }

    // 3. Submit through deadline-aware database function
    const { data: result, error: submitError } =
      await supabaseAdmin.rpc("submit_cbt_attempt", {
        p_attempt_id: attemptId,
        p_student_id: user.id,
        p_auto_submit: false,
      });

    // 4. Handle errors
    if (submitError) {
      const message = submitError.message || "";

      if (
        message.includes("Already submitted") ||
        message.includes("Attempt is not active") ||
        message.includes("Deadline expired")
      ) {
        return NextResponse.json(
          { error: message },
          { status: 409 }
        );
      }

      if (message.includes("Attempt not found")) {
        return NextResponse.json(
          { error: "Attempt not found" },
          { status: 404 }
        );
      }

      if (message.includes("Deadline has not expired")) {
        return NextResponse.json(
          { error: message },
          { status: 403 }
        );
      }

      if (message.includes("Test contains no questions")) {
        return NextResponse.json(
          { error: "This test contains no questions" },
          { status: 400 }
        );
      }

      console.error("Submission RPC error:", submitError);

      return NextResponse.json(
        { error: "Unable to submit test" },
        { status: 500 }
      );
    }

    // 5. Return result
    return NextResponse.json({
      success: true,
      message: "Test submitted successfully",
      result,
    });

  } catch (error) {
    console.error("CBT submission error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}