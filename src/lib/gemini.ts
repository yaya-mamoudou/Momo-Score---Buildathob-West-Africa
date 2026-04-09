import { GoogleGenAI, Type } from "@google/genai";
import { TrustScoreResult, FinancialMetrics } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateExplanation(result: TrustScoreResult): Promise<TrustScoreResult['explanation']> {
  const { score, rating, metrics } = result;
  
  const prompt = `
    Analyze the financial behavior of an informal worker based on the following data:
    - Trust Score: ${score}/100
    - Trust Band: ${rating}
    - Total Inflow: XAF ${metrics.totalInflow}
    - Total Outflow: XAF ${metrics.totalOutflow}
    - Transaction Count: ${metrics.transactionCount}
    - Active Days: ${metrics.activeDays}
    - Bill Payments: ${metrics.billPaymentCount}
    - Savings Transactions: ${metrics.savingsCount}
    - Cash Out Transactions: ${metrics.cashOutCount}
    - Consistency Level: ${metrics.activityConsistencyLevel}
    - Inflow/Outflow Ratio: ${metrics.inflowOutflowRatio.toFixed(2)}

    Instructions:
    1. Provide a professional, practical, and non-judgmental explanation.
    2. Do not claim this is an official credit score.
    3. Do not mention banks unless necessary.
    4. Do not invent facts not present in the input.
    5. Focus on financial consistency, inflow patterns, spending behavior, bill payment behavior, and savings signals.
    6. Use plain language suitable for a hackathon demo in Africa.
    7. Output valid JSON only.

    Response Schema:
    {
      "summary": "One short paragraph summarizing their financial health.",
      "strengths": ["2 to 4 specific financial strengths."],
      "risks": ["2 to 4 potential risks or areas for improvement."],
      "recommendations": ["Exactly 3 concise actionable items."]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              minItems: 2,
              maxItems: 4
            },
            risks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              minItems: 2,
              maxItems: 4
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              minItems: 3,
              maxItems: 3
            }
          },
          required: ["summary", "strengths", "risks", "recommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return getFallbackExplanation(metrics, score, rating);
  }
}

function getFallbackExplanation(metrics: FinancialMetrics, score: number, rating: string): TrustScoreResult['explanation'] {
  const strengths = [];
  if (metrics.savingsCount > 0) strengths.push("Demonstrates a habit of saving money regularly.");
  if (metrics.billPaymentCount > 0) strengths.push("Shows reliability by paying utility bills through mobile money.");
  if (metrics.activityConsistencyLevel === "high") strengths.push("Maintains a very consistent daily transaction pattern.");
  if (metrics.totalInflow > metrics.totalOutflow) strengths.push("Maintains a positive cash flow with more money coming in than going out.");
  
  if (strengths.length < 2) {
    strengths.push("Active user of mobile money services.");
    strengths.push("Digital footprint established through regular transactions.");
  }

  const risks = [];
  if (metrics.cashOutCount >= 4) risks.push("High frequency of cash-outs may indicate limited digital ecosystem usage.");
  if (metrics.inflowOutflowRatio < 0.9) risks.push("Spending is very close to or exceeds total income.");
  if (metrics.activeDays < 3) risks.push("Limited transaction history over the analyzed period.");
  
  if (risks.length < 2) {
    risks.push("Vulnerability to unexpected financial shocks.");
    risks.push("Potential for improved expense tracking.");
  }

  return {
    summary: `Your MoMoScore of ${score} places you in the ${rating} trust band. This analysis is based on your recent mobile money activity, focusing on how you manage inflows, outflows, and savings.`,
    strengths: strengths.slice(0, 4),
    risks: risks.slice(0, 4),
    recommendations: [
      "Try to keep a small balance in your mobile money wallet instead of cashing out everything.",
      "Continue making regular bill payments to build a stronger reliability record.",
      "Increase the frequency of your transfers to your savings pocket to boost your score."
    ]
  };
}
