import { getCurrentBranchId, setCurrentBranchId } from "@/lib/branch-context"

describe("current branch context", () => {
  beforeEach(() => {
    window.localStorage.clear()
    setCurrentBranchId(null)
  })

  it("persists and reads the selected branch", () => {
    setCurrentBranchId("branch-a")
    expect(getCurrentBranchId()).toBe("branch-a")
    expect(window.localStorage.getItem("mygymagent:current-branch")).toBe("branch-a")
  })

  it("clears the branch context", () => {
    setCurrentBranchId("branch-a")
    setCurrentBranchId(null)
    expect(getCurrentBranchId()).toBeUndefined()
    expect(window.localStorage.getItem("mygymagent:current-branch")).toBeNull()
  })
})
