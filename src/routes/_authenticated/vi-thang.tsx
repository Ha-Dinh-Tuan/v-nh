import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VND, currentMonthKey } from "@/lib/format";
import { CATEGORIES, findCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/vi-thang")({
  component: BudgetPage,
});

function BudgetPage() {
  const month = currentMonthKey();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [totalOpen, setTotalOpen] = useState(false);
  const [totalAmt, setTotalAmt] = useState("");

  const allBudgets = useStore((s) => s.budgets);
  const allTx = useStore((s) => s.transactions);
  const budgets = allBudgets.filter((b) => b.month === month);
  const tx = allTx.filter(
    (t) => t.kind === "expense" && new Date(t.occurred_at) >= monthStart,
  );

  const spentBy = new Map<string, number>();
  tx.forEach((t) => spentBy.set(t.category, (spentBy.get(t.category) ?? 0) + t.amount));

  const totalBudget = budgets.find((b) => b.category === "__total__")?.amount ?? 0;
  const totalSpent = tx.reduce((s, t) => s + t.amount, 0);

  const openEdit = (cat: string) => {
    setEditing(cat);
    const cur = budgets.find((b) => b.category === cat);
    setAmount(cur ? String(cur.amount) : "");
    setOpen(true);
  };

  const save = () => {
    if (!editing) return;
    const val = Number(amount.replace(/\D/g, "")) || 0;
    actions.setBudget(editing, val, month);
    toast.success("Đã cập nhật " + editing);
    setOpen(false);
  };

  const saveTotal = () => {
    const val = Number(totalAmt.replace(/\D/g, "")) || 0;
    actions.setBudget("__total__", val, month);
    toast.success("Đã đặt ngân sách tháng");
    setTotalOpen(false);
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Ngân sách tháng</h1>
        <p className="text-sm text-muted-foreground">
          Đặt ngân sách — nhìn tiền giảm dần để kiểm soát tốt hơn 🌷
        </p>
      </div>

      <button
        onClick={() => {
          setTotalAmt(totalBudget ? String(totalBudget) : "");
          setTotalOpen(true);
        }}
        className="w-full text-left rounded-3xl gradient-primary p-5 text-white shadow-pink"
      >
        <div className="text-xs uppercase tracking-wider opacity-80">
          Tổng ngân sách tháng
        </div>
        <div className="text-3xl font-bold font-display mt-1">
          {totalBudget > 0 ? VND(totalBudget) : "Chưa đặt — bấm để đặt"}
        </div>
        {totalBudget > 0 && (
          <div className="text-xs mt-2 opacity-90">
            Đã dùng {VND(totalSpent)} ·{" "}
            {Math.round((totalSpent / totalBudget) * 100)}%
          </div>
        )}
      </button>

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">
          Theo danh mục
        </div>
        <div className="space-y-3">
          {CATEGORIES.map((c) => {
            const b = budgets.find((x) => x.category === c.name);
            const budget = b ? b.amount : 0;
            const spent = spentBy.get(c.name) ?? 0;
            const remain = budget - spent;
            const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
            const over = budget > 0 && spent > budget;

            return (
              <button
                key={c.name}
                onClick={() => openEdit(c.name)}
                className="w-full text-left rounded-3xl bg-card border border-border p-4 shadow-soft hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-11 rounded-2xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: c.color + "22" }}
                  >
                    {c.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {budget > 0
                        ? over
                          ? `Vượt ${VND(Math.abs(remain))}`
                          : `Còn ${VND(remain)}`
                        : "Chưa đặt ngân sách"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{VND(spent)}</div>
                    <div className="text-[11px] text-muted-foreground">/ {VND(budget)}</div>
                  </div>
                </div>
                {budget > 0 && (
                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: pct + "%",
                        background: over ? "var(--destructive)" : c.color,
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border-0 shadow-pink max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              Ngân sách {editing} {editing ? findCategory(editing).emoji : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl bg-primary-soft p-5 text-center">
              <div className="text-xs text-muted-foreground mb-1">Số tiền / tháng</div>
              <div className="flex items-baseline justify-center gap-1">
                <Input
                  autoFocus
                  inputMode="numeric"
                  value={amount ? Number(amount.replace(/\D/g, "")).toLocaleString("vi-VN") : ""}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="text-3xl font-bold text-center bg-transparent border-0 shadow-none focus-visible:ring-0 h-12 p-0 font-display"
                />
                <span className="text-xl font-bold text-primary">đ</span>
              </div>
            </div>
            <Button
              onClick={save}
              className="w-full h-12 rounded-2xl gradient-primary text-white font-semibold shadow-pink"
            >
              Lưu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={totalOpen} onOpenChange={setTotalOpen}>
        <DialogContent className="rounded-3xl border-0 shadow-pink max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Ngân sách tháng này</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl bg-primary-soft p-5 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <Input
                  autoFocus
                  inputMode="numeric"
                  value={totalAmt ? Number(totalAmt.replace(/\D/g, "")).toLocaleString("vi-VN") : ""}
                  onChange={(e) => setTotalAmt(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="text-3xl font-bold text-center bg-transparent border-0 shadow-none focus-visible:ring-0 h-12 p-0 font-display"
                />
                <span className="text-xl font-bold text-primary">đ</span>
              </div>
            </div>
            <Button
              onClick={saveTotal}
              className="w-full h-12 rounded-2xl gradient-primary text-white font-semibold shadow-pink"
            >
              Lưu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
