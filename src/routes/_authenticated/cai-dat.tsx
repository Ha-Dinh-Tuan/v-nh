import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogOut, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cai-dat")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("initial_balance")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (q.data) setValue(String(Math.round(Number(q.data.initial_balance))));
  }, [q.data]);

  const formatted = value
    ? Number(value.replace(/\D/g, "")).toLocaleString("vi-VN")
    : "";

  const save = async () => {
    const v = Number(value.replace(/\D/g, "")) || 0;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: u.user.id, initial_balance: v, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã cập nhật số dư ban đầu 🌸");
    qc.invalidateQueries();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">
          Chỉnh số dư ban đầu — mọi lúc, mọi nơi 🌷
        </p>
      </div>

      <div className="rounded-3xl bg-card border border-border p-5 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="size-4 text-primary" /> Số dư ban đầu
        </div>
        <div className="rounded-2xl bg-primary-soft p-5 text-center">
          <div className="text-xs text-muted-foreground mb-1">Số tiền hiện có</div>
          <div className="flex items-baseline justify-center gap-1">
            <Input
              inputMode="numeric"
              value={formatted}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="text-3xl font-bold text-center bg-transparent border-0 shadow-none focus-visible:ring-0 h-12 p-0 font-display"
            />
            <span className="text-xl font-bold text-primary">đ</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Số dư hiện tại = Số dư ban đầu + Tổng thu - Tổng chi.
          {q.data ? (
            <>
              {" "}Đang lưu: <span className="font-semibold text-foreground">{VND(Number(q.data.initial_balance))}</span>.
            </>
          ) : null}
        </p>
        <Button
          onClick={save}
          disabled={saving}
          className="w-full h-12 rounded-2xl gradient-primary text-white font-semibold shadow-pink"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>

      <button
        onClick={signOut}
        className="w-full rounded-3xl bg-card border border-border p-4 shadow-soft flex items-center justify-center gap-2 text-sm font-semibold text-destructive hover:bg-muted transition-colors"
      >
        <LogOut className="size-4" /> Đăng xuất
      </button>
    </div>
  );
}
