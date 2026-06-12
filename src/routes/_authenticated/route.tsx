import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Home, ListChecks, Target, PieChart, Settings as SettingsIcon, Wallet } from "lucide-react";
import logo from "@/assets/vi-hong-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-md w-full pb-24 relative">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="Ví Hồng" className="w-8 h-8 rounded-lg" />
          <span className="font-display font-bold text-lg tracking-tight">Ví Hồng</span>
        </Link>
      </header>
      <main className="flex-1 px-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const items = [
    { to: "/", icon: Home, label: "Trang chủ" },
    { to: "/giao-dich", icon: ListChecks, label: "Nhật ký" },
    { to: "/vi-thang", icon: Wallet, label: "Ngân sách" },
    { to: "/muc-tieu", icon: Target, label: "Mục tiêu" },
    { to: "/bao-cao", icon: PieChart, label: "Báo cáo" },
    { to: "/cai-dat", icon: SettingsIcon, label: "Cài đặt" },
  ] as const;
  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[min(28rem,calc(100%-1rem))]">
      <div className="bg-card/95 backdrop-blur border border-border rounded-3xl shadow-soft px-2 py-2 flex justify-between">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-2xl text-muted-foreground text-[10px] font-medium transition-colors hover:text-foreground"
            activeProps={{
              className:
                "flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-2xl bg-primary-soft text-primary text-[10px] font-semibold",
            }}
            activeOptions={{ exact: it.to === "/" }}
          >
            <it.icon className="size-5" />
            <span>{it.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
