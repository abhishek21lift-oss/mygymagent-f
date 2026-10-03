import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import LoginPage from "./page";

/**
 * The tabs used to read "Password" and "SMS code" — which describes the
 * credential but not whether you are in the right place. A member landing
 * here had no way to tell that "Password" was not for them. They now name
 * the person.
 */

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    login: jest.fn(),
    completeMfaLogin: jest.fn(),
    requestOtp: jest.fn(),
    loginWithOtp: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("LoginPage tabs", () => {
  it("labels the tabs by who is signing in, not by credential", () => {
    render(<LoginPage />);

    expect(screen.getByRole("tab", { name: "Gym staff" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Member" })).toBeInTheDocument();
  });

  it("no longer offers the old credential-shaped labels", () => {
    render(<LoginPage />);

    // "Password" and "SMS code" are what confused people; if they reappear
    // the change has been undone.
    expect(screen.queryByRole("tab", { name: "Password" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "SMS code" })).not.toBeInTheDocument();
  });

  it("opens on the gym staff form, which is the staff default it always was", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.queryByLabelText("Mobile number")).not.toBeInTheDocument();
  });

  it("says what each side needs, so the credential is still stated", () => {
    render(<LoginPage />);

    expect(
      screen.getByText(/email and password your gym set up/i),
    ).toBeInTheDocument();
  });

  it("keeps the tablist labelled for screen readers", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("tablist", { name: /how to sign in/i }),
    ).toBeInTheDocument();
  });

  it("tells the reader there is a choice to make", () => {
    render(<LoginPage />);

    // The old copy described the outcome ("you will land in the right
    // place") without ever mentioning there are two ways in.
    expect(screen.getByText(/gym staff or member/i)).toBeInTheDocument();
  });
});
