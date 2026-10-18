import "@testing-library/jest-dom";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { LineChart } from "./line-chart";

describe("LineChart", () => {
  it("renders an accessible line chart", () => {
    render(
      <LineChart
        data={[{ label: "Jan", value: 10 }, { label: "Feb", value: 20 }]}
        ariaLabel="Growth: Jan 10, Feb 20"
      />,
    );
    expect(screen.getByRole("img", { name: /Jan 10, Feb 20/ })).toBeInTheDocument();
  });

  it("shows empty state for zero data", () => {
    render(<LineChart data={[{ label: "Jan", value: 0 }]} ariaLabel="x" emptyTitle="No growth yet" />);
    expect(screen.getByText("No growth yet")).toBeInTheDocument();
  });

  it("shows loading skeleton", () => {
    render(<LineChart data={[]} ariaLabel="x" isLoading />);
    expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();
  });
});
