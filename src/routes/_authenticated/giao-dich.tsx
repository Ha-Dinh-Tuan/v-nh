import { createFileRoute } from "@tanstack/react-router";
import { VND } from "@/lib/format";
import { findCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/giao-dich")({
  component: TxPage,
});

function TxPage() {
  const tx = useStore((s) => s.transactions);

  const groups = new Map<string, typeof tx>();
  tx.forEach((t) => {
    const d = new Date(t.occurred_at).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(t);
  });

  const del = (id: string) => {
    actions.deleteTransaction(id);
    toast.success("Đã xoá");
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Nhật ký giao dịch</h1>
        <p className="text-sm text-muted-foreground">
          Tổng cộng {tx.length} giao dịch
        </p>
      </div>

      {tx.length === 0 && (
        <div className="rounded-3xl bg-card border border-border p-8 text-center text-sm text-muted-foreground shadow-soft">
          Chưa có gì cả 🌷
          <br /> Bấm nút + ở trang chủ để thêm.
        </div>
      )}

      {[...groups.entries()].map(([day, items]) => {
        const sum = items.reduce(
          (s, t) => s + (t.kind === "income" ? t.amount : -t.amount),
          0,
        );
        return (
          <div key={day}>
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
              <div
                className={`text-xs font-semibold ${sum >= 0 ? "text-success" : "text-foreground"}`}
              >
                {sum >= 0 ? "+" : ""}
                {VND(sum)}
              </div>
            </div>
            <div className="rounded-3xl bg-card border border-border shadow-soft divide-y divide-border overflow-hidden">
              {items.map((t) => {
                const isIncome = t.kind === "income";
                const c = findCategory(t.category);
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 group">
                    <div
                      className="size-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                      style={{
                        backgroundColor: isIncome ? "var(--success)" + "22" : c.color + "22",
                      }}
                    >
                      {isIncome ? "💖" : c.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {isIncome ? "Thu nhập" : (t.subcategory ?? t.category)}
                        {t.note ? (
                          <span className="text-muted-foreground"> · {t.note}</span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(t.occurred_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${isIncome ? "text-success" : ""}`}
                    >
                      {isIncome ? "+" : "-"}
                      {VND(t.amount)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => del(t.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
