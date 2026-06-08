import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VND } from "@/lib/format";
import { findCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/giao-dich")({
  component: TxPage,
});

function TxPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["tx-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
  const tx = q.data ?? [];
  // group by day
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

  const del = async (id: string, amount: number, accountId: string | null) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (accountId) {
      const { data: cur } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", accountId)
        .single();
      const newBal = Number(cur?.balance ?? 0) + Number(amount);
      await supabase.from("accounts").update({ balance: newBal }).eq("id", accountId);
    }
    toast.success("Đã xoá");
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Nhật ký chi tiêu</h1>
        <p className="text-sm text-muted-foreground">
          Tổng cộng {tx.length} giao dịch gần nhất
        </p>
      </div>

      {tx.length === 0 && (
        <div className="rounded-3xl bg-card border border-border p-8 text-center text-sm text-muted-foreground shadow-soft">
          Chưa có gì cả 🌷
          <br /> Bấm nút + ở trang chủ để thêm.
        </div>
      )}

      {[...groups.entries()].map(([day, items]) => {
        const sum = items.reduce((s, t) => s + Number(t.amount), 0);
        return (
          <div key={day}>
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
              <div className="text-xs font-semibold text-foreground">{VND(sum)}</div>
            </div>
            <div className="rounded-3xl bg-card border border-border shadow-soft divide-y divide-border overflow-hidden">
              {items.map((t) => {
                const c = findCategory(t.category);
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 group">
                    <div
                      className="size-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: c.color + "22" }}
                    >
                      {c.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {t.subcategory ?? t.category}
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
                    <div className="text-sm font-semibold">-{VND(Number(t.amount))}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => del(t.id, Number(t.amount), t.account_id)}
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
