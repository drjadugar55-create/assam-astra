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

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const studentId = authData.user.id;

    // 2. Read request body
    const body = await request.json();

    const { attemptId, questionId, selectedOption, isFlagged } = body;

    if (!attemptId || !questionId) {
      return NextResponse.json(
        { error: "Attempt ID and question ID are required" },
        { status: 400 }
      );
    }

    // 3. Validate request fields
    const hasAnswer = Object.prototype.hasOwnProperty.call(
      body,
      "selectedOption"
    );

    const hasFlag = Object.prototype.hasOwnProperty.call(
      body,
      "isFlagged"
    );

    if (!hasAnswer && !hasFlag) {
      return NextResponse.json(
        { error: "Nothing to save" },
        { status: 400 }
      );
    }

    if (
      hasAnswer &&
      selectedOption !== null &&
      !["A", "B", "C", "D"].includes(selectedOption)
    ) {
      return NextResponse.json(
        { error: "Invalid answer option" },
        { status: 400 }
      );
    }

    if (hasFlag && typeof isFlagged !== "boolean") {
      return NextResponse.json(
        { error: "Flag status must be true or false" },
        { status: 400 }
      );
    }

    // 4. Save atomically through PostgreSQL function
    const { data, error } = await supabaseAdmin.rpc(
      "save_cbt_answer",
      {
        p_attempt_id: attemptId,
        p_student_id: studentId,
        p_question_id: questionId,
        p_has_answer: hasAnswer,
        p_selected_option: hasAnswer ? selectedOption : null,
        p_has_flag: hasFlag,
        p_is_flagged: hasFlag ? isFlagged : false,
      }
    );

    if (error) {
      console.error("CBT atomic answer save error:", error);

      const message = error.message || "";

      if (message.includes("Attempt not found")) {
        return NextResponse.json(
          { error: "Attempt not found" },
          { status: 404 }
        );
      }

      if (message.includes("Attempt is not active")) {
        return NextResponse.json(
          { error: "This attempt is not active" },
          { status: 403 }
        );
      }

      if (message.includes("Deadline expired")) {
        return NextResponse.json(
          { error: "Test time has expired" },
          { status: 403 }
        );
      }

      if (message.includes("Question does not belong")) {
        return NextResponse.json(
          { error: "Question does not belong to this test" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "Unable to save answer" },
        { status: 500 }
      );
    }

    // 5. Return saved answer
    return NextResponse.json(
      {
        message: "Answer state saved",
        answer: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CBT save-answer API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}