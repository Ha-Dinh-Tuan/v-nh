import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/MoneyInput";
import { actions } from "@/lib/store";
import { toast } from "sonner";
import logo from "@/assets/vi-hong-logo.png.asset.json";

export function OnboardingScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [balance, setBalance] = useState(0);
  const [budget, setBudget] = useState(0);

  const next = () => {
    if (!balance) {
      toast.error("Nhập số tiền hiện có nhé 💖");
      return;
    }
    setStep(2);
  };

  const finish = () => {
    actions.initialize(balance, budget);
    toast.success("Xong rồi! Chào mừng đến Ví Hồng 🌷");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8 mx-auto max-w-md">
      <div className="w-full rounded-3xl gradient-primary p-6 text-white shadow-pink mb-5 text-center">
        <img src={logo.url} alt="Ví Hồng" className="h-20 w-auto mx-auto mb-2 drop-shadow-lg" />
        <h1 className="font-display text-2xl font-bold">Chào bạn!</h1>
        <p className="text-sm opacity-90 mt-1">
          Mình là Ví Hồng — đồng hành tiết kiệm cùng bạn 💖
        </p>
      </div>

      <div className="w-full rounded-3xl bg-card border border-border p-5 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Dot active={step >= 1} />
          <span className={step === 1 ? "font-semibold text-foreground" : ""}>
            Số tiền hiện có
          </span>
          <span>·</span>
          <Dot active={step >= 2} />
          <span className={step === 2 ? "font-semibold text-foreground" : ""}>
            Ngân sách tháng
          </span>
        </div>

        {step === 1 ? (
          <>
            <div>
              <div className="text-sm font-semibold mb-1">Bạn đang có bao nhiêu tiền?</div>
              <p className="text-xs text-muted-foreground">
                Là tổng số tiền hiện có trong ví, tài khoản, ví điện tử...
              </p>
            </div>
            <MoneyInput value={balance} onChange={setBalance} autoFocus />
            <Button
              onClick={next}
              className="w-full h-12 rounded-2xl gradient-primary text-white font-semibold shadow-pink"
            >
              Tiếp tục →
            </Button>
          </>
        ) : (
          <>
            <div>
              <div className="text-sm font-semibold mb-1">Ngân sách dự kiến cho tháng này?</div>
              <p className="text-xs text-muted-foreground">
                Số tiền bạn cho phép mình chi trong tháng. Bỏ trống nếu chưa biết.
              </p>
            </div>
            <MoneyInput value={budget} onChange={setBudget} autoFocus />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="h-12 rounded-2xl font-semibold"
              >
                ← Quay lại
              </Button>
              <Button
                onClick={finish}
                className="h-12 rounded-2xl gradient-primary text-white font-semibold shadow-pink"
              >
                Bắt đầu 🌷
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className={`size-2 rounded-full ${active ? "bg-primary" : "bg-muted-foreground/30"}`}
    />
  );
}
