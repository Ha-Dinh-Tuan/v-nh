import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Home, ListChecks, Target, PieChart, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const router = useRouter();
  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };
  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-md w-full pb-24 relative">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <span className="font-display font-bold text-lg tracking-tight">Ví Hồng</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Đăng xuất">
          <LogOut className="size-4" />
        </Button>
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
    { to: "/vi-thang", icon: Wallet, label: "Ví tháng" },
    { to: "/muc-tieu", icon: Target, label: "Mục tiêu" },
    { to: "/bao-cao", icon: PieChart, label: "Báo cáo" },
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
