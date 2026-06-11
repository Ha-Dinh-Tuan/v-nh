import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoneyInput } from "@/components/MoneyInput";
import { Plus, Trash2, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { actions, useStore } from "@/lib/store";

const EMOJIS = ["💻", "🏖️", "📱", "🛟", "🎧", "🚲", "🎁", "🌸"];

export const Route = createFileRoute("/_authenticated/muc-tieu")({
  component: GoalsPage,
});

function GoalsPage() {
  const goals = useStore((s) => s.goals);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState(0);
  const [emoji, setEmoji] = useState("💖");
  const [deposit, setDeposit] = useState<{ id: string; amount: number } | null>(null);

  const create = () => {
    if (!name.trim() || !target) {
      toast.error("Nhập tên và số tiền cần đạt nhé");
      return;
    }
    actions.createGoal(name.trim(), target, emoji);
    toast.success("Đã tạo mục tiêu " + emoji);
    setOpen(false);
    setName("");
    setTarget(0);
    setEmoji("💖");
  };

  const addSaving = () => {
    if (!deposit) return;
    const v = deposit.amount;
    const g = goals.find((x) => x.id === deposit.id);
    if (!g || !v) return;
    actions.depositGoal(g.id, v);
    toast.success(`+${VND(v)} cho "${g.name}"`);
    setDeposit(null);
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Mục tiêu tiết kiệm</h1>
          <p className="text-sm text-muted-foreground">Đặt mục tiêu — mỗi đồng tiết kiệm gần hơn 🌷</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="rounded-2xl gradient-primary text-white shadow-pink"
          size="sm"
        >
          <Plus className="size-4" /> Tạo
        </Button>
      </div>

      {goals.length === 0 && (
        <div className="rounded-3xl bg-card border border-border p-8 text-center text-sm text-muted-foreground shadow-soft">
          <PiggyBank className="size-10 mx-auto mb-2 text-primary" />
          Chưa có mục tiêu nào. Bắt đầu nào!
        </div>
      )}

      <div className="space-y-3">
        {goals.map((g) => {
          const pct = Math.min(100, (g.saved_amount / g.target_amount) * 100);
          const done = pct >= 100;
          return (
            <div key={g.id} className="rounded-3xl bg-card border border-border p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-primary-soft flex items-center justify-center text-2xl">
                  {g.emoji ?? "💖"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{g.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {VND(g.saved_amount)} / {VND(g.target_amount)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={() => actions.deleteGoal(g.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="mt-3 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full gradient-primary transition-all"
                  style={{ width: pct + "%" }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className={`text-xs font-semibold ${done ? "text-success" : "text-primary"}`}>
                  {done ? "Hoàn thành 🎉" : Math.round(pct) + "%"}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full h-7 text-xs"
                  onClick={() => setDeposit({ id: g.id, amount: 0 })}
                >
                  + Nạp tiền
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border-0 shadow-pink max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Mục tiêu mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Laptop mới"
              className="rounded-2xl h-11 bg-muted border-0"
            />
            <MoneyInput value={target} onChange={setTarget} />
            <div className="flex gap-1.5 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`size-10 rounded-2xl text-xl flex items-center justify-center border-2 ${
                    emoji === e ? "border-primary bg-primary-soft" : "border-transparent bg-muted"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <Button
              onClick={create}
              className="w-full h-11 rounded-2xl gradient-primary text-white font-semibold shadow-pink"
            >
              Tạo mục tiêu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deposit} onOpenChange={(v) => !v && setDeposit(null)}>
        <DialogContent className="rounded-3xl border-0 shadow-pink max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Nạp vào mục tiêu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <MoneyInput
              value={deposit?.amount ?? 0}
              onChange={(v) => setDeposit((d) => (d ? { ...d, amount: v } : d))}
              autoFocus
            />
            <Button
              onClick={addSaving}
              className="w-full h-11 rounded-2xl gradient-primary text-white font-semibold shadow-pink"
            >
              Nạp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
