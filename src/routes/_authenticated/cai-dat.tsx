import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { VND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wallet, Download, Upload, Trash2 } from "lucide-react";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/cai-dat")({
  component: SettingsPage,
});

function SettingsPage() {
  const initial_balance = useStore((s) => s.initial_balance);
  const [value, setValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(String(Math.round(initial_balance)));
  }, [initial_balance]);

  const formatted = value
    ? Number(value.replace(/\D/g, "")).toLocaleString("vi-VN")
    : "";

  const save = () => {
    const v = Number(value.replace(/\D/g, "")) || 0;
    actions.setInitialBalance(v);
    toast.success("Đã cập nhật số dư ban đầu 🌸");
  };

  const exportData = () => {
    const json = actions.exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `vi-hong-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất dữ liệu 📤");
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      actions.importData(data);
      toast.success("Đã nhập dữ liệu 🌷");
    } catch {
      toast.error("File không hợp lệ");
    } finally {
      e.target.value = "";
    }
  };

  const clearAll = () => {
    if (!confirm("Xoá TOÀN BỘ dữ liệu? Hành động này không thể hoàn tác.")) return;
    actions.reset();
    toast.success("Đã xoá toàn bộ dữ liệu");
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý số dư & dữ liệu của bạn 🌷
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
          Số dư hiện tại = Số dư ban đầu + Tổng thu - Tổng chi. Đang lưu:{" "}
          <span className="font-semibold text-foreground">{VND(initial_balance)}</span>.
        </p>
        <Button
          onClick={save}
          className="w-full h-12 rounded-2xl gradient-primary text-white font-semibold shadow-pink"
        >
          Lưu thay đổi
        </Button>
      </div>

      <div className="rounded-3xl bg-card border border-border p-5 shadow-soft space-y-3">
        <div className="text-sm font-semibold">Dữ liệu</div>
        <p className="text-xs text-muted-foreground">
          Mọi dữ liệu lưu trên trình duyệt này. Nhớ xuất file để sao lưu nhé.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={exportData}
            variant="outline"
            className="h-11 rounded-2xl gap-2"
          >
            <Download className="size-4" /> Xuất JSON
          </Button>
          <Button
            onClick={() => fileRef.current?.click()}
            variant="outline"
            className="h-11 rounded-2xl gap-2"
          >
            <Upload className="size-4" /> Nhập JSON
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={importData}
        />
      </div>

      <button
        onClick={clearAll}
        className="w-full rounded-3xl bg-card border border-destructive/30 p-4 shadow-soft flex items-center justify-center gap-2 text-sm font-semibold text-destructive hover:bg-destructive/5 transition-colors"
      >
        <Trash2 className="size-4" /> Xoá toàn bộ dữ liệu
      </button>
    </div>
  );
}
