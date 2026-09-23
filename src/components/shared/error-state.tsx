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
 className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
 >
 <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
 <AlertTriangle className="size-5" aria-hidden="true" />
 </span>
 <p className="max-w-sm text-sm font-medium">{message}</p>
 {onRetry && (
 <Button
 variant="outline"
 size="sm"
 onClick={onRetry}
 className="min-h-10 px-5"
 >
 Try again
 </Button>
 )}
 </div>
 );
}
