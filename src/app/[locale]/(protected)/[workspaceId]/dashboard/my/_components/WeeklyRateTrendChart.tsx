"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeeklyTrendPoint } from "../_lib/dashboard-scoreboard";

export interface WeeklyRateTrendChartProps {
  points: WeeklyTrendPoint[];
}

export function WeeklyRateTrendChart({ points }: WeeklyRateTrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const data = points.map((p) => ({
    name: p.label,
    rate: p.rate,
  }));

  if (!isMounted) return null;

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={1}
      minHeight={1}
      initialDimension={{ width: 10, height: 10 }}
    >
      <AreaChart data={data} margin={{ top: 25, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={{
            stroke: "rgba(0,0,0,0.05)",
            strokeWidth: 2,
            strokeDasharray: "4 4",
          }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-[12px] bg-zinc-800 px-3 py-1.5 shadow-xl">
                <p className="font-mono text-[12px] font-bold text-white">{payload[0].value}%</p>
              </div>
            );
          }}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
          dy={8}
        />
        <YAxis domain={[0, 100]} hide />
        <Area
          type="monotone"
          dataKey="rate"
          stroke="var(--color-primary)"
          strokeWidth={3}
          fill="url(#rateGrad)"
          activeDot={{
            r: 6,
            fill: "var(--color-primary)",
            stroke: "#fff",
            strokeWidth: 3,
          }}
          dot={(props: { cx?: number; cy?: number; index?: number }) => {
            const { cx, cy, index } = props;
            if (index === data.length - 1) {
              return (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="var(--color-primary)"
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }
            return <svg key={`dot-${index}`} />;
          }}
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
