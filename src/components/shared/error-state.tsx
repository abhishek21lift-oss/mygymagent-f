import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message = "Something went wrong loading this data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-[14px] border-[3px] border-[#4a0f0a] bg-gradient-to-b from-[#ffc4b8] via-[#e08a7a] to-[#a92a20] px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_24px_rgba(0,0,0,0.45)]"
    >
      <span className="flex size-14 items-center justify-center rounded-full border-[3px] border-[#2b0a06] bg-gradient-to-b from-[#3a1512] to-[#170807] text-[#ffb3a6] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.4)]">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <p className="max-w-sm text-sm font-black text-[#2b0a06]" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.4)" }}>{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="min-h-10 rounded-[10px] px-5"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
