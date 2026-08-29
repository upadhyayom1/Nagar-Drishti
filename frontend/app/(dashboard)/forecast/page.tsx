"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { CongestionForecastWidget } from "@/components/dashboard/CongestionForecastWidget";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function ForecastPage() {
  return (
    <PageWrapper className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp className="text-emerald-400" /> AI Traffic Forecast
        </h1>
        <Badge variant="info" size="sm">
          Real-time Predictions
        </Badge>
      </div>

      <p className="mt-1 text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider max-w-3xl">
        Predictive intelligence grid forecasting congestion bottlenecks up to 30
        minutes in advance using real-time node telemetry and machine learning
        models.
      </p>

      <div className="h-[800px] w-full max-w-5xl">
        <CongestionForecastWidget />
      </div>
    </PageWrapper>
  );
}
