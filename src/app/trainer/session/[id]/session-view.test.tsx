import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import { TrainerSessionView } from "./session-view"

jest.mock("next/navigation", () => ({ usePathname: () => "/trainer/session/s1", useRouter: () => ({ push: jest.fn() }) }))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

const session = {
  id: "s1",
  assignmentId: "a1",
  memberId: "m1",
  branchId: "b1",
  sessionDate: "2026-10-08T00:00:00.000Z",
  status: "IN_PROGRESS",
  startedAt: "2026-10-08T07:00:00.000Z",
  completedAt: null,
  notes: null,
  firstName: "Alex",
  lastName: "Adams",
  workoutPlanName: "Squat day",
  exercises: [
    { id: "se1", exerciseId: "e1", exerciseName: "Back Squat", setsTarget: 3, repsTarget: "5", restSeconds: 180, displayOrder: 1, notes: null },
  ],
  sets: [
    { id: "set1", sessionExerciseId: "se1", setNumber: 1, weightKg: "180", reps: 5, rpe: "8", notes: null, completedAt: "2026-10-08T07:05:00.000Z" },
  ],
}

function renderView() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TrainerSessionView sessionId="s1" />
    </QueryClientProvider>,
  )
}

describe("Trainer session view", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(api.get as jest.Mock).mockResolvedValue(session)
    ;(api.post as jest.Mock).mockResolvedValue(session)
    ;(api.patch as jest.Mock).mockResolvedValue({ ...session, status: "COMPLETED" })
  })

  it("shows the member, the target and the sets already logged", async () => {
    renderView()
    expect(await screen.findByRole("heading", { name: "Alex Adams" })).toBeTruthy()
    expect(screen.getByText(/Target 3 sets × 5 reps/)).toBeTruthy()
    expect(screen.getByText(/180 kg × 5 · RPE 8/)).toBeTruthy()
    expect(api.get).toHaveBeenCalledWith("/workout-sessions/s1")
  })

  it("logs the next set against the session exercise, and keeps the entry for the set after", async () => {
    renderView()
    const weight = await screen.findByLabelText("Back Squat weight in kg")
    fireEvent.change(weight, { target: { value: "182.5" } })
    fireEvent.change(screen.getByLabelText("Back Squat reps"), { target: { value: "5" } })
    fireEvent.click(screen.getByRole("button", { name: "Log set 2" }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/workout-sessions/s1/exercises/se1/sets", {
        setNumber: 2,
        weightKg: 182.5,
        reps: 5,
        rpe: undefined,
        notes: undefined,
      }),
    )
    expect((screen.getByLabelText("Back Squat weight in kg") as HTMLInputElement).value).toBe("182.5")
  })

  it("does not send an empty set", async () => {
    renderView()
    fireEvent.click(await screen.findByRole("button", { name: "Log set 2" }))
    await waitFor(() => expect(api.post).not.toHaveBeenCalled())
  })

  it("finishes the session", async () => {
    renderView()
    fireEvent.click(await screen.findByRole("button", { name: "Finish session" }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/workout-sessions/s1/complete", {}))
  })

  it("shows a completed session read-only", async () => {
    ;(api.get as jest.Mock).mockResolvedValue({ ...session, status: "COMPLETED", completedAt: "2026-10-08T08:00:00.000Z" })
    renderView()
    expect(await screen.findByText(/Session complete/)).toBeTruthy()
    expect(screen.queryByRole("button", { name: /Log set/ })).toBeNull()
    expect(screen.queryByRole("button", { name: "Finish session" })).toBeNull()
  })
})
