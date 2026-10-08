import type { Metadata } from "next";

import { TrainerSessionView } from "./session-view";

export const metadata: Metadata = {
  title: "Session",
};

/**
 * One workout session on the floor: where "Resume" and "Start" on the
 * trainer's home lead. The id is a workout session's, never an
 * assignment's -- "Start" opens the session first and then comes here.
 */
export default async function TrainerSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrainerSessionView sessionId={id} />;
}
