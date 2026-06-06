export type AccountType = "cash" | "bank" | "investment";

export type TransactionType =
  | "expense"
  | "income"
  | "transfer"
  | "investment_deposit"
  | "investment_withdrawal"
  | "settlement"
  | "loan_given";

export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  opening_balance: number;
  institution: string | null;
  invested_amount: number;
  current_value: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  personal_amount: number | null;
  description: string | null;
  category_id: string | null;
  transaction_date: string;
  created_at: string;
}

export interface SplitReceivable {
  id: string;
  user_id: string;
  transaction_id: string;
  contact_name: string;
  amount: number;
  status: "pending" | "paid";
  paid_at: string | null;
  settlement_transaction_id: string | null;
  paid_to_account_id: string | null;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
}

export interface DashboardSummary {
  cashTotal: number;
  bankTotal: number;
  investmentCurrent: number;
  investmentInvested: number;
  pendingReceivables: number;
  netWorth: number;
}
