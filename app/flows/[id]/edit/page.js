"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import FlowEditor from "../../editor/FlowEditor";

export default function EditFlowPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const flowId = params.id;

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const flow = useQuery(api.flows.getById, flowId ? { id: flowId } : "skip");

  if (!user || !convexUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading flow...</div>
      </div>
    );
  }

  return (
    <FlowEditor
      flow={flow}
      userId={convexUser._id}
      isNew={false}
      onBack={() => router.push("/flows")}
    />
  );
}
