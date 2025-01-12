import { Suspense } from "react";
import { AnalyticsData } from "./analytics-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsCards() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold ">Analytics</h2>
      <Suspense fallback={<AnalyticsCardsSkeleton />}>
        <AnalyticsData />
      </Suspense>
    </div>
  );
}

function AnalyticsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-[200px] w-full" />
      ))}
    </div>
  );
}
