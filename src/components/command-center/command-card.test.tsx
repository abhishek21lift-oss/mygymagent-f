import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { CommandCard, Metric, QueueBars } from "./command-card";
import type { CardResult } from "@/lib/hooks/use-command-center";

/**
 * These assert the one property that matters on an operations screen: a
 * measurement that was never taken must not look like a measurement that
 * came back zero.
 */

const checkedAt = new Date().toISOString();

const card = <T,>(over: Partial<CardResult<T>> = {}): CardResult<T> => ({
  status: "ok",
  value: {} as T,
  latencyMs: 1,
  checkedAt,
  ...over,
});

describe("CommandCard", () => {
  it("shows the figure when the card measured something", () => {
    render(
      <CommandCard title="Readiness" card={card()}>
        <p>database up</p>
      </CommandCard>,
    );

    expect(screen.getByText("database up")).toBeInTheDocument();
    expect(screen.queryByTestId("card-unavailable")).not.toBeInTheDocument();
  });

  it("renders no figure at all when the card could not be measured", () => {
    render(
      <CommandCard
        title="Queues"
        card={card({ status: "unavailable", value: null, unavailableReason: "Redis unreachable" })}
      >
        <p>must not render</p>
      </CommandCard>,
    );

    // The children are the figures. If they rendered here, a caller could
    // paint a number next to a card that says it has none.
    expect(screen.queryByText("must not render")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-unavailable")).toBeInTheDocument();
    expect(screen.getByText("Redis unreachable")).toBeInTheDocument();
  });

  it("says Unavailable rather than Degraded, so a blind spot is not a fault", () => {
    render(
      <CommandCard
        title="Queues"
        card={card({ status: "unavailable", value: null, unavailableReason: "no data" })}
      >
        <p>unused</p>
      </CommandCard>,
    );

    // "Unavailable" appears twice by design: the status chip, and the
    // screen-reader text on the em dash. Both must read the same way.
    expect(screen.getAllByText("Unavailable")).toHaveLength(2);
    expect(screen.queryByText("Degraded")).not.toBeInTheDocument();
  });

  it("still shows the figure, plus a warning, when degraded", () => {
    render(
      <CommandCard title="Queues" card={card({ status: "degraded" })}>
        <p>500 waiting</p>
      </CommandCard>,
    );

    expect(screen.getByText("500 waiting")).toBeInTheDocument();
    expect(screen.getByText("Degraded")).toBeInTheDocument();
  });

  it("flags a stale reading without hiding it", () => {
    const stale = new Date(Date.now() - 5 * 60_000).toISOString();
    render(
      <CommandCard title="AI usage" card={card({ checkedAt: stale })} isStale>
        <p>42 requests</p>
      </CommandCard>,
    );

    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText("42 requests")).toBeInTheDocument();
  });

  it("explains itself when the card is missing entirely", () => {
    render(
      <CommandCard title="AI usage" card={undefined}>
        <p>unused</p>
      </CommandCard>,
    );

    // No card at all is the same blind spot as an unavailable one, and must
    // not read as an empty-but-healthy section.
    expect(screen.getAllByText("Unavailable")).toHaveLength(2);
    expect(
      screen.getByText("No reading was returned."),
    ).toBeInTheDocument();
  });
});

describe("Metric", () => {
  it("renders a real figure", () => {
    render(<Metric label="Requests" value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders an em dash, not a zero, for an unmeasured value", () => {
    render(<Metric label="Cost" value={null} />);

    // "0" here would read as "AI cost nothing", which is a claim, not an
    // absence of one.
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.getByText("Not measured")).toBeInTheDocument();
  });

  it("renders a zero when the measurement really was zero", () => {
    render(<Metric label="Errors" value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

describe("QueueBars", () => {
  it("draws a row per queue with its depth", () => {
    render(
      <QueueBars
        rows={[
          { name: "notifications", waiting: 5, failed: 0 },
          { name: "automation", waiting: 0, failed: 2 },
        ]}
      />,
    );

    expect(screen.getByText("notifications")).toBeInTheDocument();
    expect(screen.getByText("5 waiting")).toBeInTheDocument();
    expect(screen.getByText("0 waiting · 2 failed")).toBeInTheDocument();
  });

  it("says unavailable instead of drawing an empty bar for an unreadable queue", () => {
    render(
      <QueueBars rows={[{ name: "push", waiting: 0, failed: 0, unavailable: true }]} />,
    );

    expect(screen.getByText("unavailable")).toBeInTheDocument();
    // The zero row would render as "0 waiting", which is indistinguishable
    // from a queue that is genuinely idle.
    expect(screen.queryByText("0 waiting")).not.toBeInTheDocument();
  });
});
