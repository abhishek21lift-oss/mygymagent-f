import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* Skeuo analog gauges — steel bezel, odometer readout, needle LED. */
const TONE_STYLES = {
  primary: {
    bezel: "from-[#ffedb0] via-[#c99b3f] to-[#7a5a1e] border-[#4a360f]",
    face: "from-[#2b2114] to-[#170e07]",
    led: "bg-[#ffe9a8] shadow-[0_0_8px_rgba(255,200,80,0.9)]",
    needle: "bg-[#e8c25e]",
  },
  success: {
    bezel: "from-[#d8f0dc] via-[#6aa876] to-[#2a5a35] border-[#1d3a24]",
    face: "from-[#16241a] to-[#0d150f]",
    led: "bg-[#8affa0] shadow-[0_0_8px_rgba(80,255,140,0.9)]",
    needle: "bg-[#6fce82]",
  },
  warning: {
    bezel: "from-[#ffe9a8] via-[#d9a53a] to-[#7a5a1e] border-[#4a360f]",
    face: "from-[#2b2110] to-[#170e07]",
    led: "bg-[#ffb02a] shadow-[0_0_8px_rgba(255,160,40,0.9)]",
    needle: "bg-[#ff9a2a]",
  },
  destructive: {
    bezel: "from-[#ffc4b8] via-[#b03528] to-[#5a130c] border-[#4a0f0a]",
    face: "from-[#241110] to-[#120707]",
    led: "bg-[#ff6a5a] shadow-[0_0_8px_rgba(255,80,60,0.9)]",
    needle: "bg-[#ff6a5a]",
  },
} as const;

export function StatCard({
  title,
  icon: Icon,
  value,
  isLoading,
  hint,
  tone = "primary",
}: {
  title: string;
  icon: LucideIcon;
  value: number | string | undefined;
  isLoading: boolean;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const t = TONE_STYLES[tone];
  return (
    <Card className="group gap-0 overflow-hidden py-0">
      {/* top machined stripe */}
      <span aria-hidden="true" className="relative z-10 block h-2 border-b border-[#4a3f2a] bg-[repeating-linear-gradient(90deg,#6b5d42_0_6px,#3a3222_6px_12px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]" />
      <CardContent className="relative flex items-center gap-4 p-5 lg:p-6">
        {/* analog gauge icon */}
        <span
          className={cn(
            "relative flex size-16 shrink-0 items-center justify-center rounded-full border-[3px] bg-gradient-to-b shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_4px_0_#241a08,0_8px_16px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-105",
            t.bezel,
          )}
        >
          <span className={cn("flex size-11 items-center justify-center rounded-full border border-black bg-gradient-to-b text-[#ffe9a8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]", t.face)}>
            <Icon className="size-5" aria-hidden="true" strokeWidth={2.25} />
          </span>
          <span aria-hidden="true" className={cn("absolute -top-0.5 size-2 rounded-full border border-black", t.led)} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="skeuo-embossed-label inline-block rounded-[6px] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em]"
          >
            {title}
          </p>
          {isLoading ? (
            <Skeleton className="mt-2 h-9 w-24 rounded-[8px] border border-[#5c4f38]" />
          ) : (
            <p className="skeuo-odometer mt-2 inline-block min-w-[4rem] rounded-[8px] px-3 py-1 text-center text-2xl font-black tracking-tight">
              {value ?? 0}
            </p>
          )}
          {hint && <p className="mt-1.5 text-[11px] font-bold text-[#5c4f38] dark:text-[#c9b586]" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}>{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
