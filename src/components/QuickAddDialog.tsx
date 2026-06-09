import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function QuickAddDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [sub, setSub] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setSub(null);
      setNote("");
      setKind("expense");
      setCategory(CATEGORIES[0].name);
    }
  }, [open]);

  const cat = CATEGORIES.find((c) => c.name === category)!;

  const submit = async () => {
    const value = Number(amount.replace(/\D/g, ""));
    if (!value || value <= 0) {
      toast.error("Nhập số tiền nhé 💸");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("transactions").insert({
      user_id: u.user.id,
      amount: value,
      kind,
      category: kind === "income" ? "Thu nhập" : category,
      subcategory: kind === "income" ? null : sub,
      note: note || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Có lỗi: " + error.message);
      return;
    }
    toast.success(
      kind === "income"
        ? `+${value.toLocaleString("vi-VN")}đ thu nhập 💖`
        : `Đã ghi ${value.toLocaleString("vi-VN")}đ ${cat.emoji}`,
    );
    qc.invalidateQueries();
    onOpenChange(false);
  };

  const formatted = amount
    ? Number(amount.replace(/\D/g, "")).toLocaleString("vi-VN")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-pink">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Ghi nhanh</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl">
            <button
              type="button"
              onClick={() => setKind("expense")}
              className={cn(
                "py-2 rounded-xl text-sm font-semibold transition-all",
                kind === "expense" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground",
              )}
            >
              💸 Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => setKind("income")}
              className={cn(
                "py-2 rounded-xl text-sm font-semibold transition-all",
                kind === "income" ? "bg-card shadow-soft text-success" : "text-muted-foreground",
              )}
            >
              💖 Thu nhập
            </button>
          </div>

          <div className="rounded-2xl bg-primary-soft p-5 text-center">
            <div className="text-xs text-muted-foreground mb-1">Số tiền</div>
            <div className="flex items-baseline justify-center gap-1">
              <Input
                autoFocus
                inputMode="numeric"
                value={formatted}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="text-3xl font-bold text-center bg-transparent border-0 shadow-none focus-visible:ring-0 h-12 p-0 font-display"
              />
              <span className="text-xl font-bold text-primary">đ</span>
            </div>
          </div>

          {kind === "expense" && (
            <>
              <div>
                <div className="text-xs text-muted-foreground mb-2 font-medium">Danh mục</div>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setCategory(c.name);
                        setSub(null);
                      }}
                      className={cn(
                        "rounded-2xl py-3 px-2 flex flex-col items-center gap-1 border-2 transition-all",
                        category === c.name
                          ? "border-primary bg-primary-soft scale-[1.02]"
                          : "border-transparent bg-muted hover:border-border",
                      )}
                    >
                      <span className="text-2xl">{c.emoji}</span>
                      <span className="text-[11px] font-medium leading-tight">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {cat.sub.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {cat.sub.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSub(sub === s ? null : s)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                        sub === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú (tuỳ chọn)"
            className="rounded-2xl bg-muted border-0"
          />

          <Button
            onClick={submit}
            disabled={saving}
            className="w-full h-12 rounded-2xl gradient-primary text-white font-semibold shadow-pink hover:opacity-95"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
