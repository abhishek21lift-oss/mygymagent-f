import * as React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6 md:p-10">
      {/* workbench backdrop is inherited from body wood; add felt mat */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-6 rounded-[18px] border border-[#170e07] bg-gradient-to-b from-[#3a2a1c]/80 to-[#21150d]/90 shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-6 rounded-[18px] outline-2 outline-dashed outline-[#c9a44f]/40 outline-offset-[-12px]" />
      <div className="relative flex w-full max-w-sm flex-col gap-5">
        <div className="skeuo-plate skeuo-screws flex flex-col items-center gap-2 rounded-[14px] border px-6 py-5">
          <img
            src="/logo-lockup.webp"
            alt="MyGymAgent"
            width={192}
            height={192}
            className="h-auto w-44 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
          />
          <span className="skeuo-embossed-label rounded-[6px] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em]">Members &bull; Iron &amp; Leather &bull; Est.</span>
        </div>
        <div className="skeuo-plate skeuo-screws rounded-[14px] border p-5">
          <div className="relative z-10">{children}</div>
        </div>
        <p className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9b586]/80" style={{ textShadow: "0 -1px 0 rgba(0,0,0,0.8)" }}>
          Brass-bound &bull; Calibrated dials
        </p>
      </div>
    </main>
  );
}
