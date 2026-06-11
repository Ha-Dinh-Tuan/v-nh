import { createFileRoute } from "@tanstack/react-router";
import { VND } from "@/lib/format";
import { findCategory } from "@/lib/categories";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/bao-cao")({
  component: ReportPage,
});

function ReportPage() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const sixMonthAgo = new Date();
  sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 5);
  sixMonthAgo.setDate(1);
  sixMonthAgo.setHours(0, 0, 0, 0);

  const allTx = useStore((s) => s.transactions);
  const tx = allTx.filter((t) => new Date(t.occurred_at) >= sixMonthAgo);

  const monthTx = tx.filter(
    (t) => new Date(t.occurred_at) >= start && t.kind === "expense",
  );

  const byCat = new Map<string, number>();
  monthTx.forEach((t) => byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount));

  const pieData = [...byCat.entries()].map(([name, value]) => ({
    name,
    value,
    color: findCategory(name).color,
  }));
  const total = pieData.reduce((s, p) => s + p.value, 0);

  const monthsMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
    monthsMap.set(key, 0);
  }
  tx.forEach((t) => {
    if (t.kind !== "expense") return;
    const d = new Date(t.occurred_at);
    const key = `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
    if (monthsMap.has(key)) monthsMap.set(key, (monthsMap.get(key) ?? 0) + t.amount);
  });
  const barData = [...monthsMap.entries()].map(([month, total]) => ({ month, total }));

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">Tiền của bạn đi đâu mỗi tháng?</p>
      </div>

      <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-semibold">Tháng này</h2>
          <span className="text-sm font-bold">{VND(total)}</span>
        </div>
        {pieData.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            Chưa có dữ liệu 🌸
          </div>
        ) : (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((p, i) => (
                      <Cell key={i} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => VND(v)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {pieData
                .sort((a, b) => b.value - a.value)
                .map((p) => {
                  const c = findCategory(p.name);
                  const pct = total ? Math.round((p.value / total) * 100) : 0;
                  return (
                    <div key={p.name} className="flex items-center gap-3 text-sm">
                      <span className="text-lg">{c.emoji}</span>
                      <span className="flex-1 font-medium">{p.name}</span>
                      <span className="text-muted-foreground text-xs">{pct}%</span>
                      <span className="font-semibold w-24 text-right">{VND(p.value)}</span>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>

      <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
        <h2 className="font-display font-semibold mb-3">6 tháng gần nhất</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                formatter={(v: number) => VND(v)}
                cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Bar dataKey="total" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
