"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { shortDay } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { type ChartPoint } from "@/types";

const chartConfig = {
  value: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function RevenueChart({ data, period }: { data: ChartPoint[]; period: string }): React.ReactElement {
  return (
    <Card className="pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle>Revenue</CardTitle>
        <CardDescription>Daily revenue · {period}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => shortDay(value)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => shortDay(String(value))}
                  formatter={(value) => formatMoney(Number(value))}
                  indicator="dot"
                />
              }
            />
            <Area dataKey="value" type="natural" fill="url(#fillRevenue)" stroke="var(--color-value)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
