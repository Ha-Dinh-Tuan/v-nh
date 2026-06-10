import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, TrendingUp, Settings as SettingsIcon } from "lucide-react";
import {
  VND,
  currentMonthKey,
  daysLeftInMonth,
  dayOfMonth,
} from "@/lib/format";
import { findCategory } from "@/lib/categories";
import { QuickAddDialog } from "@/components/QuickAddDialog";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { Button } from "@/components/ui/button";
import { useStore, computeBalance } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const initialized = useStore((s) => s.initialized);
  if (!initialized) return <OnboardingScreen />;

  return <Dashboard />;
}

function Dashboard() {
  const [openAdd, setOpenAdd] = useState(false);
  const monthKey = currentMonthKey();

  const state = useStore((s) => s);
  const { balance, income: totalIncome, expense: totalExpense } = computeBalance(state);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthTx = state.transactions.filter(
    (t) => new Date(t.occurred_at) >= monthStart,
  );
  const monthSpent = monthTx
    .filter((t) => t.kind === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const monthIncome = monthTx
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalBudget =
    state.budgets.find((b) => b.category === "__total__" && b.month === monthKey)
      ?.amount ?? 0;

  const remainingMonth = totalBudget > 0 ? totalBudget - monthSpent : balance;
  const left = daysLeftInMonth();
  const dayN = dayOfMonth();
  const dailyAllowance =
    totalBudget > 0
      ? Math.max(0, (totalBudget - monthSpent) / Math.max(1, left + 1))
      : 0;
  const avgPerDay = dayN > 0 ? monthSpent / dayN : 0;
  const predicted = balance - avgPerDay * left;

  const recent = state.transactions.slice(0, 5);

  return (
    <div className="space-y-5 pb-8">
      {/* Balance card */}
      <div className="rounded-3xl gradient-primary p-6 text-white shadow-pink relative overflow-hidden">
        <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/15 blur-xl" />
        <div className="absolute -bottom-10 -left-4 size-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Số dư hiện tại</div>
              <div className="text-4xl font-bold font-display mt-1">{VND(balance)}</div>
            </div>
            <Link
              to="/cai-dat"
              className="size-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Cài đặt"
            >
              <SettingsIcon className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="rounded-2xl bg-white/20 backdrop-blur px-3 py-2 text-xs">
              <div className="opacity-90">Số dư ban đầu</div>
              <div className="font-semibold text-sm mt-0.5">{VND(state.initial_balance)}</div>
            </div>
            <div className="rounded-2xl bg-white/20 backdrop-blur px-3 py-2 text-xs">
              <div className="opacity-90">Còn lại tháng</div>
              <div className="font-semibold text-sm mt-0.5">{left} ngày</div>
            </div>
          </div>
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Tổng thu" value={VND(totalIncome)} tone="ok" />
        <StatCard label="Tổng chi" value={VND(totalExpense)} tone="warn" />
        <StatCard label="Đã chi tháng này" value={VND(monthSpent)} />
        <StatCard label="Đã thu tháng này" value={VND(monthIncome)} tone="ok" />
      </div>

      {/* Budget summary */}
      {totalBudget > 0 ? (
        <div className="rounded-3xl bg-card p-5 shadow-soft border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Ngân sách tháng này</div>
            <div className="text-xs text-muted-foreground">
              {VND(monthSpent)} / {VND(totalBudget)}
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width:
                  Math.min(100, (monthSpent / totalBudget) * 100).toFixed(1) + "%",
                background:
                  monthSpent > totalBudget
                    ? "var(--destructive)"
                    : "var(--primary)",
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-muted-foreground">Còn lại tháng</div>
              <div
                className={`font-bold ${
                  remainingMonth < 0 ? "text-destructive" : "text-foreground"
                }`}
              >
                {VND(remainingMonth)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Mỗi ngày được tiêu</div>
              <div className="font-bold text-primary">{VND(dailyAllowance)}</div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Để không vượt ngân sách, cố giữ chi tiêu dưới{" "}
            <span className="font-semibold text-foreground">{VND(dailyAllowance)}</span>{" "}
            mỗi ngày trong {left + 1} ngày tới 🌷
          </p>
        </div>
      ) : (
        <Link
          to="/vi-thang"
          className="block rounded-3xl bg-accent/40 border border-accent p-4 text-sm"
        >
          <span className="font-semibold">🌷 Đặt ngân sách tháng</span> — biết mỗi ngày
          được tiêu bao nhiêu để không vượt.
        </Link>
      )}

      {/* Prediction */}
      <div className="rounded-3xl bg-card p-5 shadow-soft border border-border">
        <div className="flex items-center gap-2 text-sm font-semibold mb-1">
          <TrendingUp className="size-4 text-primary" /> Dự đoán cuối tháng
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          Nếu tiếp tục như hiện tại, cuối tháng bạn sẽ còn khoảng{" "}
          <span className="font-bold text-foreground text-base">
            {VND(Math.max(0, predicted))}
          </span>
          .
        </div>
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="font-display font-semibold">Gần đây</h2>
          <span className="text-xs text-muted-foreground">
            {state.transactions.length} giao dịch
          </span>
        </div>
        <div className="rounded-3xl bg-card border border-border shadow-soft divide-y divide-border overflow-hidden">
          {recent.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Chưa có giao dịch nào 🌸
            </div>
          )}
          {recent.map((t) => {
            const isIncome = t.kind === "income";
            const c = findCategory(t.category);
            return (
              <div key={t.id} className="flex items-center gap-3 p-3">
                <div
                  className="size-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: isIncome ? "var(--success)" + "22" : c.color + "22" }}
                >
                  {isIncome ? "💖" : c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {isIncome ? "Thu nhập" : (t.subcategory ?? t.category)}
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
                <div
                  className={`text-sm font-semibold ${isIncome ? "text-success" : "text-foreground"}`}
                >
                  {isIncome ? "+" : "-"}
                  {VND(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating + */}
      <Button
        onClick={() => setOpenAdd(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 size-16 rounded-full gradient-primary shadow-pink hover:opacity-95 p-0"
        aria-label="Thêm giao dịch"
      >
        <Plus className="size-7 text-white" />
      </Button>

      <QuickAddDialog open={openAdd} onOpenChange={setOpenAdd} />
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
          tone === "ok" ? "text-success" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
