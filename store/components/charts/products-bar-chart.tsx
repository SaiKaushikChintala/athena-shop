"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatMoney } from "@/lib/format";

type ProductPoint = { name: string; revenue: number };

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

function truncate(value: string): string {
  return value.length > 18 ? `${value.slice(0, 17)}…` : value;
}

export function ProductsBarChart({ data, period }: { data: ProductPoint[]; period: string }): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>By revenue · {period}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-55 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 56 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={130}
              tick={{ fontSize: 12 }}
              tickFormatter={truncate}
            />
            <XAxis dataKey="revenue" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent formatter={(value) => [formatMoney(Number(value)), "Revenue"]} indicator="line" />
              }
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4}>
              <LabelList
                dataKey="revenue"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value) => formatMoney(Number(value), 0)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
