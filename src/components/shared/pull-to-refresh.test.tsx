import * as React from "react";
import { act, fireEvent, render } from "@testing-library/react";

import { PULL_THRESHOLD, PullToRefresh, resist, useRefreshOnPull } from "./pull-to-refresh";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
const mockRefetch = jest.fn().mockResolvedValue(undefined);
jest.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ refetchQueries: mockRefetch }) }));

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

function Harness({ onRefresh }: { onRefresh: () => Promise<unknown> }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  return (
    <div ref={ref} data-testid="scroller" style={{ overflowY: "auto" }}>
      <PullToRefresh scrollRef={ref} onRefresh={onRefresh}>
        <p data-testid="content">Members</p>
      </PullToRefresh>
    </div>
  );
}

function pull(el: Element, dx: number, dy: number) {
  fireEvent.touchStart(el, { touches: [{ clientX: 100, clientY: 100 }] });
  // Two moves: the first decides direction, the second pulls.
  fireEvent.touchMove(el, { touches: [{ clientX: 100 + dx / 2, clientY: 100 + dy / 2 }] });
  fireEvent.touchMove(el, { touches: [{ clientX: 100 + dx, clientY: 100 + dy }] });
  fireEvent.touchEnd(el, { touches: [] });
}

describe("resist", () => {
  it("follows the finger at first, then gets heavier, and never passes the cap", () => {
    expect(resist(0)).toBe(0);
    expect(resist(20)).toBeGreaterThan(16);
    expect(resist(400) - resist(300)).toBeLessThan(resist(100) - resist(0));
    expect(resist(10_000)).toBeLessThanOrEqual(128);
  });

  it("needs a deliberate pull to refresh", () => {
    // About 115px of finger travel.
    expect(resist(90)).toBeLessThan(PULL_THRESHOLD);
    expect(resist(130)).toBeGreaterThan(PULL_THRESHOLD);
    expect(resist(200)).toBeGreaterThan(PULL_THRESHOLD);
  });
});

describe("PullToRefresh", () => {
  it("refreshes after a long enough pull from the top", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<Harness onRefresh={onRefresh} />);
    await act(async () => pull(getByTestId("scroller"), 0, 300));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("does nothing for a short pull", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<Harness onRefresh={onRefresh} />);
    await act(async () => pull(getByTestId("scroller"), 0, 60));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("stands aside when the page is scrolled down", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<Harness onRefresh={onRefresh} />);
    const scroller = getByTestId("scroller");
    Object.defineProperty(scroller, "scrollTop", { value: 240, configurable: true });
    await act(async () => pull(scroller, 0, 300));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("ignores a sideways swipe", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<Harness onRefresh={onRefresh} />);
    await act(async () => pull(getByTestId("scroller"), 300, 120));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("leaves the gesture to an open dialog", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<Harness onRefresh={onRefresh} />);
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);
    await act(async () => pull(getByTestId("scroller"), 0, 300));
    dialog.remove();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("skips anything marked data-ptr-ignore", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    function Ignored() {
      const ref = React.useRef<HTMLDivElement | null>(null);
      return (
        <div ref={ref}>
          <PullToRefresh scrollRef={ref} onRefresh={onRefresh}>
            <div data-ptr-ignore data-testid="pad">Signature</div>
          </PullToRefresh>
        </div>
      );
    }
    const { getByTestId } = render(<Ignored />);
    await act(async () => pull(getByTestId("pad"), 0, 300));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("also reloads a screen that fetches its own data", async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    function ManualPage() {
      useRefreshOnPull(load);
      return <p>Payroll</p>;
    }
    function App() {
      const ref = React.useRef<HTMLDivElement | null>(null);
      return (
        <div ref={ref} data-testid="scroller">
          <PullToRefresh scrollRef={ref}>
            <ManualPage />
          </PullToRefresh>
        </div>
      );
    }
    const { getByTestId } = render(<App />);
    await act(async () => pull(getByTestId("scroller"), 0, 300));
    expect(mockRefetch).toHaveBeenCalledWith({ type: "active" });
    expect(load).toHaveBeenCalledTimes(1);
  });
});
