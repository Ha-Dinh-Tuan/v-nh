import { useSyncExternalStore } from "react";

export type TxKind = "expense" | "income";

export type Transaction = {
  id: string;
  amount: number;
  kind: TxKind;
  category: string;
  subcategory: string | null;
  note: string | null;
  occurred_at: string; // ISO
};

export type Budget = {
  category: string;
  amount: number;
  month: string; // YYYY-MM
};

export type Goal = {
  id: string;
  name: string;
  emoji: string;
  target_amount: number;
  saved_amount: number;
  created_at: string;
};

export type AppState = {
  initialized: boolean;
  initial_balance: number;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
};

const KEY = "vihong:v1";

const defaultState: AppState = {
  initialized: false,
  initial_balance: 0,
  transactions: [],
  budgets: [],
  goals: [],
};

let state: AppState = defaultState;
const listeners = new Set<() => void>();

const isBrowser = typeof window !== "undefined";

function load(): AppState {
  if (!isBrowser) return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

function persist() {
  if (!isBrowser) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

if (isBrowser) {
  state = load();
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = load();
      emit();
    }
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(defaultState),
  );
}

export function getState() {
  return state;
}

function update(mut: (s: AppState) => AppState) {
  state = mut(state);
  persist();
  emit();
}

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));

// --- Actions ---

export const actions = {
  initialize(initial_balance: number, monthlyBudget?: number) {
    update((s) => {
      const month = currentMonth();
      const budgets = [...s.budgets];
      if (monthlyBudget && monthlyBudget > 0) {
        const idx = budgets.findIndex((b) => b.category === "__total__" && b.month === month);
        const item = { category: "__total__", amount: monthlyBudget, month };
        if (idx >= 0) budgets[idx] = item;
        else budgets.push(item);
      }
      return {
        ...s,
        initialized: true,
        initial_balance,
        budgets,
      };
    });
  },

  setInitialBalance(v: number) {
    update((s) => ({ ...s, initial_balance: v, initialized: true }));
  },

  addTransaction(tx: Omit<Transaction, "id" | "occurred_at"> & { occurred_at?: string }) {
    update((s) => ({
      ...s,
      transactions: [
        {
          id: uid(),
          occurred_at: tx.occurred_at ?? new Date().toISOString(),
          amount: tx.amount,
          kind: tx.kind,
          category: tx.category,
          subcategory: tx.subcategory ?? null,
          note: tx.note ?? null,
        },
        ...s.transactions,
      ],
    }));
  },

  deleteTransaction(id: string) {
    update((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  setBudget(category: string, amount: number, month: string) {
    update((s) => {
      const budgets = [...s.budgets];
      const idx = budgets.findIndex((b) => b.category === category && b.month === month);
      const item = { category, amount, month };
      if (idx >= 0) budgets[idx] = item;
      else budgets.push(item);
      return { ...s, budgets };
    });
  },

  createGoal(name: string, target_amount: number, emoji: string) {
    update((s) => ({
      ...s,
      goals: [
        ...s.goals,
        {
          id: uid(),
          name,
          emoji,
          target_amount,
          saved_amount: 0,
          created_at: new Date().toISOString(),
        },
      ],
    }));
  },

  depositGoal(id: string, amount: number) {
    update((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, saved_amount: g.saved_amount + amount } : g,
      ),
    }));
  },

  deleteGoal(id: string) {
    update((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  },

  reset() {
    update(() => ({ ...defaultState }));
  },

  importData(data: Partial<AppState>) {
    update(() => ({ ...defaultState, ...data, initialized: true }));
  },

  exportData(): string {
    return JSON.stringify(state, null, 2);
  },
};

export function currentMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function computeBalance(s: AppState = state) {
  const income = s.transactions
    .filter((t) => t.kind === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expense = s.transactions
    .filter((t) => t.kind === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  return {
    income,
    expense,
    balance: s.initial_balance + income - expense,
  };
}
