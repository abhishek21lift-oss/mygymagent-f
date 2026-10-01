import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card a shared link shows on WhatsApp, LinkedIn, X and Slack. */
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/tcc-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#ffffff",
          backgroundColor: "#0b0b14",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, #7c3aed 0%, transparent 45%), radial-gradient(circle at 85% 25%, #ec4899 0%, transparent 42%), radial-gradient(circle at 70% 95%, #06b6d4 0%, transparent 45%), radial-gradient(circle at 10% 100%, #f97316 0%, transparent 40%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 132,
              height: 96,
              borderRadius: 24,
              backgroundColor: "#FBF8F2",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <img src={logoSrc} width={112} height={79} alt="" />
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>{SITE.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2.5, maxWidth: 1000 }}>
            Gym management software that runs your gym for you
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.78)" }}>
            Memberships · WhatsApp reminders · AI · Attendance · Payments
          </div>
        </div>
      </div>
    ),
    size,
  );
}
