"use client"; // Error boundaries must be Client Components.

import * as React from "react";

/**
 * The last resort: this replaces the root layout itself, so it runs when
 * the layout, the theme provider or the query provider is what failed.
 *
 * Two consequences, both from the framework's own docs, decide how this
 * file is written:
 *
 *  - It must render its own `<html>` and `<body>`.
 *  - It does *not* get the app's global stylesheet, so no Tailwind class
 *    here would resolve, and it does not get the `ThemeProvider`, so the
 *    `data-theme` attribute the rest of the app themes itself with is
 *    never set. Everything below is therefore inline style plus one
 *    `prefers-color-scheme` block — the OS preference is the only
 *    signal available, and a stylesheet this page had to fetch is one
 *    more thing that could be broken at the moment it is needed.
 *
 * `metadata` cannot be exported from a Client Component, so the tab title
 * is set with React's own `<title>`.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
          background: "var(--ge-bg)",
          color: "var(--ge-fg)",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          textAlign: "center",
        }}
      >
        <title>Something went wrong</title>
        <style>{`
          :root {
            --ge-bg: #ffffff;
            --ge-fg: #0a0a0a;
            --ge-muted: #71717a;
            --ge-border: #e4e4e7;
            --ge-accent: #4f46e5;
            --ge-accent-fg: #ffffff;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --ge-bg: #09090b;
              --ge-fg: #fafafa;
              --ge-muted: #a1a1aa;
              --ge-border: #27272a;
              --ge-accent: #6366f1;
              --ge-accent-fg: #ffffff;
            }
          }
          .ge-btn:focus-visible {
            outline: 2px solid var(--ge-accent);
            outline-offset: 2px;
          }
        `}</style>

        <main style={{ display: "grid", gap: "1rem", maxWidth: "26rem" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "var(--ge-muted)",
            }}
          >
            The application could not start. Trying again will reload it.
          </p>

          {error.digest && (
            <p
              style={{
                margin: 0,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.75rem",
                color: "var(--ge-muted)",
              }}
            >
              Reference: {error.digest}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
              paddingTop: "0.25rem",
            }}
          >
            <button
              type="button"
              className="ge-btn"
              onClick={() => retry()}
              style={{
                minHeight: "2.75rem",
                padding: "0 1.5rem",
                borderRadius: "0.625rem",
                border: "1px solid transparent",
                background: "var(--ge-accent)",
                color: "var(--ge-accent-fg)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* A full document load, not a client transition: this
                boundary replaces the root layout, so the router is part
                of what may have failed. `next/link` would try to
                navigate with the very thing that is broken, which is
                why the lint rule is waived rather than obeyed here. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="ge-btn"
              style={{
                minHeight: "2.75rem",
                padding: "0 1.5rem",
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "0.625rem",
                border: "1px solid var(--ge-border)",
                background: "transparent",
                color: "var(--ge-fg)",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
