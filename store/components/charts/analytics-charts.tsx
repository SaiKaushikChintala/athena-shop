"use client";

import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type ChartConfig } from "@/components/ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { OrdersBarChart } from "@/components/charts/orders-bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { ProductsBarChart } from "@/components/charts/products-bar-chart";
import { fromDayKey, longDay, toDayKey } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { type ChartPoint, type ChartSlice, type OrderSummary } from "@/types";

type Props = {
  orders: OrderSummary[];
  minDate: string;
};

const STATUS_CONFIG = {
  count: { label: "Orders" },
  DELIVERED: { label: "Delivered", color: "var(--success)" },
  ORDERED: { label: "Ordered", color: "var(--muted-foreground)" },
  SHIPPED: { label: "Shipped", color: "var(--info)" },
  OUTFORDELIVERY: { label: "Out for delivery", color: "var(--warning)" },
  CANCELLED: { label: "Cancelled", color: "var(--destructive)" },
} satisfies ChartConfig;

const PAYMENT_CONFIG = {
  count: { label: "Orders" },
  UPI: { label: "UPI", color: "var(--chart-1)" },
  CREDIT_CARD: { label: "Credit card", color: "var(--chart-2)" },
  DEBIT_CARD: { label: "Debit card", color: "var(--chart-3)" },
  PAY_ON_DELIVERY: { label: "Pay on delivery", color: "var(--chart-4)" },
} satisfies ChartConfig;

function toSlices(config: ChartConfig, counts: Map<string, number>): ChartSlice[] {
  return Object.keys(config)
    .filter((key) => key !== "count")
    .map((key) => ({ key, count: counts.get(key) ?? 0, fill: `var(--color-${key})` }));
}

function increment(map: Map<string, number>, key: string, by = 1): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

function summarise(orders: OrderSummary[], fromKey: string, toKey: string) {
  const revenueByDay = new Map<string, number>();
  const ordersByDay = new Map<string, number>();
  const productRevenue = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  const paymentCounts = new Map<string, number>();
  const customers = new Set<string>();
  let totalRevenue = 0;
  let totalOrders = 0;

  for (const order of orders) {
    const day = toDayKey(new Date(order.createdAt));
    if (day < fromKey || day > toKey) continue;

    totalOrders += 1;
    totalRevenue += order.orderRevenue;
    customers.add(order.customerId);
    increment(revenueByDay, day, order.orderRevenue);
    increment(ordersByDay, day);
    increment(statusCounts, order.status);
    increment(paymentCounts, order.paymentMethod);
    for (const item of order.items) increment(productRevenue, item.productName, item.revenue);
  }

  const revenueData: ChartPoint[] = [];
  const ordersData: ChartPoint[] = [];
  for (const cursor = fromDayKey(fromKey); toDayKey(cursor) <= toKey; cursor.setDate(cursor.getDate() + 1)) {
    const key = toDayKey(cursor);
    revenueData.push({ date: key, value: revenueByDay.get(key) ?? 0 });
    ordersData.push({ date: key, value: ordersByDay.get(key) ?? 0 });
  }

  const topProducts = [...productRevenue.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    revenueData,
    ordersData,
    topProducts,
    statusData: toSlices(STATUS_CONFIG, statusCounts),
    paymentData: toSlices(PAYMENT_CONFIG, paymentCounts),
    totalOrders,
    stats: [
      { label: "Revenue", value: formatMoney(totalRevenue) },
      { label: "Orders", value: String(totalOrders) },
      { label: "Avg Order", value: formatMoney(totalOrders > 0 ? totalRevenue / totalOrders : 0) },
      { label: "Customers", value: String(customers.size) },
    ],
  };
}

function defaultRange(): DateRange {
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  from.setHours(0, 0, 0, 0);
  return { from, to: new Date() };
}

export function AnalyticsCharts({ orders, minDate }: Props): React.ReactElement {
  const [range, setRange] = useState<DateRange | undefined>(defaultRange);
  const [open, setOpen] = useState<boolean>(false);

  const today = useMemo<Date>(() => new Date(), []);
  const earliest = useMemo<Date>(() => {
    const date = new Date(minDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [minDate]);

  const fromKey = toDayKey(range?.from ?? earliest);
  const toKey = toDayKey(range?.to ?? today);

  const { revenueData, ordersData, topProducts, statusData, paymentData, totalOrders, stats } = useMemo(
    () => summarise(orders, fromKey, toKey),
    [orders, fromKey, toKey],
  );

  const periodLabel = range?.from
    ? `${longDay(range.from)} – ${longDay(range.to ?? today)}`
    : "All available history";

  function handleSelect(next: DateRange | undefined): void {
    setRange(next);
    if (next?.from && next.to) setOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-accent/30 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <p className="eyebrow">Showing</p>
          <p className="text-sm font-medium tabular-nums text-foreground">{periodLabel}</p>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon data-icon="inline-start" />
              Change range
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={(date) => date > today || date < earliest}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <Card key={label} size="sm" className="gap-2">
            <CardHeader>
              <p className="eyebrow">{label}</p>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <RevenueChart data={revenueData} period={periodLabel} />
      <OrdersBarChart data={ordersData} period={periodLabel} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart
          title="Order status"
          period={periodLabel}
          config={STATUS_CONFIG}
          data={statusData}
          total={totalOrders}
        />
        <DonutChart title="Payment methods" period={periodLabel} config={PAYMENT_CONFIG} data={paymentData} />
      </div>

      {topProducts.length > 0 && <ProductsBarChart data={topProducts} period={periodLabel} />}
    </div>
  );
}
