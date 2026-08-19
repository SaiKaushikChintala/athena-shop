"use client";

import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { type ChartSlice } from "@/types";

type Props = {
  title: string;
  period: string;
  config: ChartConfig;
  data: ChartSlice[];
  total?: number;
};

export function DonutChart({ title, period, config, data, total }: Props): React.ReactElement {
  const slices = data.filter((slice) => slice.count > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{period}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={config} className="mx-auto aspect-square max-h-62.5">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={slices} dataKey="count" nameKey="key" innerRadius={60} strokeWidth={5}>
              {total !== undefined && (
                <Label
                  content={({ viewBox }) =>
                    viewBox && "cx" in viewBox && "cy" in viewBox ? (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {total.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className="fill-muted-foreground">
                          Orders
                        </tspan>
                      </text>
                    ) : null
                  }
                />
              )}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="key" />}
              className="-translate-y-2 flex-wrap gap-x-4 gap-y-1"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
