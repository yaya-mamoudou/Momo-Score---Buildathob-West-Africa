import { Transaction, FinancialMetrics, TrustScoreResult } from './types';

export function parseTransactions(text: string): Transaction[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const transactions: Transaction[] = [];

  lines.forEach((line, index) => {
    try {
      const rawMessage = line.trim();
      
      // Extract amount and currency
      const amountMatch = rawMessage.match(/(\d+)\s*XAF/i);
      if (!amountMatch) return;
      const amount = parseFloat(amountMatch[1]);

      // Extract date and time
      const dateMatch = rawMessage.match(/(\d{4}-\d{2}-\d{2})/);
      const timeMatch = rawMessage.match(/at\s*(\d{2}:\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      const time = timeMatch ? timeMatch[1] : "00:00";

      let type: Transaction['type'] = "outflow";
      let subtype: Transaction['subtype'] = "other";
      let counterparty = "Unknown";

      const lowerMsg = rawMessage.toLowerCase();

      if (lowerMsg.includes("received")) {
        type = "inflow";
        subtype = "transfer_in";
        const cpMatch = rawMessage.match(/from\s+([A-Za-z0-9\s]+?)\s+on/i);
        if (cpMatch) counterparty = cpMatch[1].trim();
      } else if (lowerMsg.includes("sent")) {
        type = "outflow";
        subtype = "transfer_out";
        const cpMatch = rawMessage.match(/to\s+([A-Za-z0-9\s]+?)\s+on/i);
        if (cpMatch) counterparty = cpMatch[1].trim();
      } else if (lowerMsg.includes("paid")) {
        type = "outflow";
        subtype = "bill_payment";
        const cpMatch = rawMessage.match(/to\s+([A-Za-z0-9\s]+?)\s+on/i);
        if (cpMatch) counterparty = cpMatch[1].trim();
      } else if (lowerMsg.includes("transferred") && lowerMsg.includes("savings")) {
        type = "outflow";
        subtype = "savings";
        counterparty = "Savings Pocket";
      } else if (lowerMsg.includes("cash out")) {
        type = "outflow";
        subtype = "cash_out";
        counterparty = "Agent";
      }

      transactions.push({
        id: `tx-${index}`,
        date,
        time,
        type,
        subtype,
        amount,
        currency: "XAF",
        counterparty,
        rawMessage
      });
    } catch (e) {
      console.error("Failed to parse line:", line, e);
      // Skip line but don't crash
    }
  });

  return transactions;
}

export function calculateMetrics(transactions: Transaction[]): FinancialMetrics {
  let totalInflow = 0;
  let totalOutflow = 0;
  let inflowCount = 0;
  let outflowCount = 0;
  let billPaymentCount = 0;
  let savingsCount = 0;
  let cashOutCount = 0;
  let largestInflow = 0;
  let largestOutflow = 0;
  const dates = new Set<string>();

  transactions.forEach(tx => {
    dates.add(tx.date);
    if (tx.type === "inflow") {
      totalInflow += tx.amount;
      inflowCount++;
      if (tx.amount > largestInflow) largestInflow = tx.amount;
    } else {
      totalOutflow += tx.amount;
      outflowCount++;
      if (tx.amount > largestOutflow) largestOutflow = tx.amount;
      
      if (tx.subtype === "bill_payment") billPaymentCount++;
      if (tx.subtype === "savings") savingsCount++;
      if (tx.subtype === "cash_out") cashOutCount++;
    }
  });

  const transactionCount = transactions.length;
  const averageInflow = inflowCount > 0 ? totalInflow / inflowCount : 0;
  const averageOutflow = outflowCount > 0 ? totalOutflow / outflowCount : 0;
  const activeDays = dates.size;
  const inflowOutflowRatio = totalOutflow > 0 ? totalInflow / totalOutflow : totalInflow > 0 ? 10 : 0;
  
  const hasRegularActivity = activeDays >= 3;
  let activityConsistencyLevel: "low" | "medium" | "high" = "low";
  if (activeDays >= 5) activityConsistencyLevel = "high";
  else if (activeDays >= 3) activityConsistencyLevel = "medium";

  return {
    totalInflow,
    totalOutflow,
    inflowCount,
    outflowCount,
    transactionCount,
    averageInflow,
    averageOutflow,
    activeDays,
    billPaymentCount,
    savingsCount,
    cashOutCount,
    largestInflow,
    largestOutflow,
    inflowOutflowRatio,
    hasRegularActivity,
    activityConsistencyLevel
  };
}

export function computeTrustScore(metrics: FinancialMetrics): { score: number; rating: TrustScoreResult['rating'] } {
  let score = 20;

  if (metrics.transactionCount >= 10) score += 15;
  if (metrics.transactionCount >= 20) score += 10;
  if (metrics.totalInflow > metrics.totalOutflow) score += 15;
  if (metrics.savingsCount >= 1) score += 10;
  if (metrics.savingsCount >= 3) score += 10;
  if (metrics.billPaymentCount >= 1) score += 10;
  if (metrics.activeDays >= 5) score += 10;
  
  if (metrics.activityConsistencyLevel === "high") score += 10;
  else if (metrics.activityConsistencyLevel === "medium") score += 5;

  if (metrics.cashOutCount >= 4) score -= 10;
  if (metrics.inflowOutflowRatio < 0.9) score -= 10;
  if (metrics.largestOutflow > metrics.largestInflow && metrics.largestOutflow > 30000) score -= 10;

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  let rating: TrustScoreResult['rating'] = "Low";
  if (score >= 70) rating = "Strong";
  else if (score >= 40) rating = "Moderate";

  return { score, rating };
}
