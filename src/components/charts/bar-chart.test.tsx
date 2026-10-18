import "@testing-library/jest-dom";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { GradientBarChart } from "./bar-chart";

describe("GradientBarChart", () => {
  it("renders bars with role=img and aria label", () => {
    render(
      <GradientBarChart
        data={[{ label: "Jan", value: 10 }, { label: "Feb", value: 20 }]}
        ariaLabel="Revenue trend: Jan 10, Feb 20"
      />,
    );
    expect(screen.getByRole("img", { name: /Jan 10, Feb 20/ })).toBeInTheDocument();
  });

  it("shows empty state for zero data", () => {
    render(
      <GradientBarChart
        data={[{ label: "Jan", value: 0 }]}
        ariaLabel="x"
        emptyTitle="No revenue yet"
      />,
    );
    expect(screen.getByText("No revenue yet")).toBeInTheDocument();
  });

  it("shows loading skeleton", () => {
    render(<GradientBarChart data={[]} ariaLabel="x" isLoading />);
    expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();
  });

  it("shows error state with retry", () => {
    const onRetry = jest.fn();
    render(<GradientBarChart data={[]} ariaLabel="x" isError onRetry={onRetry} />);
    expect(screen.getByText(/Could not load chart/i)).toBeInTheDocument();
  });
});
