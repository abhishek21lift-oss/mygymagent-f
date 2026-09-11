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
      className="flex flex-col items-center justify-center gap-3 rounded-[22px] border border-rose-200 bg-gradient-to-br from-rose-50/90 via-white to-orange-50/60 px-6 py-12 text-center shadow-sm dark:border-rose-400/20 dark:from-rose-500/10 dark:via-transparent dark:to-orange-500/10"
    >
      <span className="flex size-12 items-center justify-center rounded-[19px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <p className="max-w-sm text-sm font-bold text-stone-900 dark:text-stone-100">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="min-h-11 rounded-2xl border-white/80 bg-white/85 px-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
