"use client";

import { useState } from "react";

export default function WhatsAppSettingsPage() {
  const [connecting, setConnecting] = useState(false);

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <p className="text-sm font-medium text-emerald-600">Communications</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">WhatsApp</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Connect your studio&apos;s WhatsApp Business number for member messaging,
          reminders and future AI conversations.
        </p>
      </header>

      <section className="rounded-3xl border bg-background/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">WhatsApp Business</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Not connected. Your studio&apos;s credentials remain isolated from every other studio.
            </p>
          </div>
          <button
            type="button"
            disabled={connecting}
            onClick={() => setConnecting(true)}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {connecting ? "Preparing connection…" : "Connect WhatsApp"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Business account", "Not connected"],
            ["Phone number", "—"],
            ["Webhook", "Not configured"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-medium">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-background/60 p-6">
        <h2 className="text-lg font-semibold">What you&apos;ll be able to do</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "Membership and payment reminders",
            "PT session and package notifications",
            "Lead follow-ups and welcome messages",
            "Two-way client conversations",
          ].map((item) => (
            <div key={item} className="rounded-2xl border p-4 text-sm">{item}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
