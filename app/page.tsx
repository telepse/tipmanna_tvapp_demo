import { JoinEventClient } from "@/components/events/join";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Loading...
            </span>
          </div>
        </div>
      }
    >
      <JoinEventClient />
    </Suspense>
  );
}
