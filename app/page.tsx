import { JoinEventClient } from "@/components/events/join";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinEventClient />
    </Suspense>
  );
}
