"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { shortDay } from "@/lib/dates";
import { type ChartPoint } from "@/types";

const chartConfig = {
  value: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function OrdersBarChart({ data, period }: { data: ChartPoint[]; period: string }): React.ReactElement {
  return (
    <Card className="pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle>Orders</CardTitle>
        <CardDescription>Daily order count · {period}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <BarChart data={data}>
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
              content={<ChartTooltipContent labelFormatter={(value) => shortDay(String(value))} indicator="dot" />}
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
