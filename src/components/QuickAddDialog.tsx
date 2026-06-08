import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Account = { id: string; name: string; icon: string | null };

export function QuickAddDialog({
  open,
  onOpenChange,
  accounts,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: Account[];
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [sub, setSub] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setSub(null);
      setNote("");
      setAccountId(accounts[0]?.id ?? "");
    }
  }, [open, accounts]);

  const cat = CATEGORIES.find((c) => c.name === category)!;

  const submit = async () => {
    const value = Number(amount.replace(/\D/g, ""));
    if (!value || value <= 0) {
      toast.error("Nhập số tiền nhé 💸");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("transactions").insert({
      user_id: u.user.id,
      account_id: accountId || null,
      amount: value,
      kind: "expense",
      category,
      subcategory: sub,
      note: note || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Có lỗi: " + error.message);
      return;
    }
    // also reduce account balance optimistically
    if (accountId) {
      const acc = accounts.find((a) => a.id === accountId);
      if (acc) {
        await supabase.rpc; // no-op
        const { data: cur } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", accountId)
          .single();
        const newBal = Number(cur?.balance ?? 0) - value;
        await supabase.from("accounts").update({ balance: newBal }).eq("id", accountId);
      }
    }
    toast.success(`Đã ghi ${value.toLocaleString("vi-VN")}đ ${cat.emoji}`);
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
          <DialogTitle className="font-display text-xl">Ghi chi tiêu nhanh</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                      : "border-transparent bg-muted hover:border-border"
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
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium">Trừ từ ví</div>
            <div className="flex gap-2">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccountId(a.id)}
                  className={cn(
                    "flex-1 rounded-2xl py-2.5 px-3 text-sm font-medium border-2 transition-all flex items-center gap-2 justify-center",
                    accountId === a.id
                      ? "border-primary bg-primary-soft"
                      : "border-transparent bg-muted"
                  )}
                >
                  <span>{a.icon ?? "💰"}</span>
                  {a.name}
                </button>
              ))}
            </div>
          </div>

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
            {saving ? "Đang lưu..." : "Lưu chi tiêu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
