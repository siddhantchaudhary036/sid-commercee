import { NextResponse } from "next/server";
import { handleFlowsRequest } from "./handler";

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      );
    }

    const response = await handleFlowsRequest(message, userId, conversationHistory);

    return NextResponse.json({
      response
    });

  } catch (error) {
    console.error("Flows agent error:", error);
    return NextResponse.json(
      { error: "Failed to process flows request" },
      { status: 500 }
    );
  }
}
