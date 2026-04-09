export interface Transaction {
  id: string;
  date: string;
  time: string;
  type: "inflow" | "outflow";
  subtype: "transfer_in" | "transfer_out" | "bill_payment" | "savings" | "cash_out" | "other";
  amount: number;
  currency: "XAF";
  counterparty: string;
  rawMessage: string;
}

export interface FinancialMetrics {
  totalInflow: number;
  totalOutflow: number;
  inflowCount: number;
  outflowCount: number;
  transactionCount: number;
  averageInflow: number;
  averageOutflow: number;
  activeDays: number;
  billPaymentCount: number;
  savingsCount: number;
  cashOutCount: number;
  largestInflow: number;
  largestOutflow: number;
  inflowOutflowRatio: number;
  hasRegularActivity: boolean;
  activityConsistencyLevel: "low" | "medium" | "high";
}

export interface TrustScoreResult {
  score: number; // 0-100
  rating: "Low" | "Moderate" | "Strong";
  metrics: FinancialMetrics;
  transactions: Transaction[];
  explanation?: {
    summary: string;
    strengths: string[];
    risks: string[];
    recommendations: string[];
  };
}
