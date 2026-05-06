import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Category = { id: string; name: string; type: "income" | "expense"; color: string; icon: string };
export type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string | null;
  occurred_at: string;
  category_id: string | null;
};
export type Goal = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  color: string;
};

export function useCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["categories", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as any[]).map((t) => ({ ...t, amount: Number(t.amount) }));
    },
  });
}

export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((g) => ({
        ...g,
        target_amount: Number(g.target_amount),
        current_amount: Number(g.current_amount),
      }));
    },
  });
}

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
