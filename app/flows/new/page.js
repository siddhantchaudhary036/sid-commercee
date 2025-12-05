"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import FlowEditor from "../editor/FlowEditor";

export default function NewFlowPage() {
  const { user } = useUser();
  const router = useRouter();

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  if (!user || !convexUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  // Initial flow state for new flow (new schema format)
  const initialFlow = {
    name: "Untitled Flow",
    description: "",
    status: "draft",
    nodes: [
      {
        nodeId: "trigger-1",
        type: "trigger",
        triggerType: "segment_added",
        segmentId: undefined,
        segmentName: undefined,
        positionX: 250,
        positionY: 50,
      },
    ],
    edges: [],
  };

  return (
    <FlowEditor
      flow={initialFlow}
      userId={convexUser._id}
      isNew={true}
      onBack={() => router.push("/flows")}
    />
  );
}
