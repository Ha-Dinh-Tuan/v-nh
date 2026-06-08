import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, TrendingUp, Flame, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VND, currentMonthKey, daysLeftInMonth, daysInMonth, dayOfMonth } from "@/lib/format";
import { findCategory } from "@/lib/categories";
import { QuickAddDialog } from "@/components/QuickAddDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const [openAdd, setOpenAdd] = useState(false);
  const monthKey = currentMonthKey();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const accountsQ = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const txQ = useQuery({
    queryKey: ["tx-month", monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("occurred_at", monthStart.toISOString())
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const accounts = accountsQ.data ?? [];
  const tx = txQ.data ?? [];
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const spent = tx.filter((t) => t.kind === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const income = tx.filter((t) => t.kind === "income").reduce((s, t) => s + Number(t.amount), 0);
  const dayN = dayOfMonth();
  const left = daysLeftInMonth();
  const totalDays = daysInMonth();
  const avgPerDay = dayN > 0 ? spent / dayN : 0;
  const predicted = totalBalance - avgPerDay * left;

  // streak detect: days no "Trà sữa" or no "Ăn uống"
  const byCat = new Map<string, number>();
  tx.forEach((t) => {
    const k = (t.subcategory ?? t.category) as string;
    byCat.set(k, (byCat.get(k) ?? 0) + Number(t.amount));
  });
  const drinkSpent = (byCat.get("Trà sữa") ?? 0) + (byCat.get("Cafe") ?? 0);
  const lastDrink = tx.find((t) => t.subcategory === "Trà sữa");
  const daysSinceDrink = lastDrink
    ? Math.floor(
        (Date.now() - new Date(lastDrink.occurred_at).getTime()) / 86400000
      )
    : 7;

  const recent = tx.slice(0, 5);

  return (
    <div className="space-y-5 pb-8">
      {/* Balance card */}
      <div className="rounded-3xl gradient-primary p-6 text-white shadow-pink relative overflow-hidden">
        <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/15 blur-xl" />
        <div className="absolute -bottom-10 -left-4 size-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-wider opacity-80">Tổng số dư</div>
          <div className="text-4xl font-bold font-display mt-1">{VND(totalBalance)}</div>
          <div className="flex gap-2 mt-4">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex-1 rounded-2xl bg-white/20 backdrop-blur px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-1 opacity-90">
                  <span>{a.icon}</span>
                  <span>{a.name}</span>
                </div>
                <div className="font-semibold text-sm mt-0.5">{VND(Number(a.balance))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Đã tiêu tháng này" value={VND(spent)} tone="warn" />
        <StatCard label="Đã nạp vào ví" value={VND(income)} tone="ok" />
        <StatCard label="Còn lại trong tháng" value={`${left} ngày`} />
        <StatCard label="TB / ngày" value={VND(avgPerDay)} />
      </div>

      {/* Prediction */}
      <div className="rounded-3xl bg-card p-5 shadow-soft border border-border">
        <div className="flex items-center gap-2 text-sm font-semibold mb-1">
          <TrendingUp className="size-4 text-primary" /> Dự đoán cuối tháng
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          Nếu tiếp tục như hiện tại, cuối tháng bạn sẽ còn khoảng{" "}
          <span className="font-bold text-foreground text-base">{VND(Math.max(0, predicted))}</span>
          .
        </div>
      </div>

      {/* Streaks */}
      <div className="space-y-2">
        {daysSinceDrink >= 1 && (
          <InsightChip
            icon="🔥"
            text={`Bạn đã ${daysSinceDrink} ngày không uống trà sữa — giỏi quá!`}
          />
        )}
        {drinkSpent > 200_000 && (
          <InsightChip
            icon={<Sparkles className="size-4" />}
            text={`Tháng này bạn chi ${VND(drinkSpent)} cho đồ uống. Giảm 30% là tiết kiệm thêm ${VND(drinkSpent * 0.3)}.`}
            tone="warn"
          />
        )}
        {spent === 0 && (
          <InsightChip icon="✨" text="Chưa ghi khoản nào tháng này. Bấm + để bắt đầu nhé!" />
        )}
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="font-display font-semibold">Gần đây</h2>
          <span className="text-xs text-muted-foreground">{tx.length} giao dịch</span>
        </div>
        <div className="rounded-3xl bg-card border border-border shadow-soft divide-y divide-border overflow-hidden">
          {recent.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Chưa có giao dịch nào 🌸
            </div>
          )}
          {recent.map((t) => {
            const c = findCategory(t.category);
            return (
              <div key={t.id} className="flex items-center gap-3 p-3">
                <div
                  className="size-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: c.color + "22" }}
                >
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {t.subcategory ?? t.category}
                    {t.note ? <span className="text-muted-foreground"> · {t.note}</span> : null}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(t.occurred_at).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                </div>
                <div className="text-sm font-semibold text-foreground">-{VND(Number(t.amount))}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating + */}
      <Button
        onClick={() => setOpenAdd(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 size-16 rounded-full gradient-primary shadow-pink hover:opacity-95 p-0"
        aria-label="Thêm chi tiêu"
      >
        <Plus className="size-7 text-white" />
      </Button>

      <QuickAddDialog open={openAdd} onOpenChange={setOpenAdd} accounts={accounts} />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3.5 shadow-soft">
      <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
      <div
        className={`text-base font-bold font-display mt-0.5 ${
          tone === "ok" ? "text-success" : tone === "warn" ? "text-foreground" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function InsightChip({
  icon,
  text,
  tone,
}: {
  icon: React.ReactNode;
  text: string;
  tone?: "warn";
}) {
  return (
    <div
      className={`rounded-2xl p-3 flex items-start gap-2 text-sm border ${
        tone === "warn"
          ? "bg-secondary/60 border-secondary"
          : "bg-accent/40 border-accent"
      }`}
    >
      <div className="shrink-0 size-7 rounded-xl bg-card flex items-center justify-center">
        {typeof icon === "string" ? <span>{icon}</span> : icon}
      </div>
      <div className="flex-1 leading-snug">{text}</div>
    </div>
  );
}
