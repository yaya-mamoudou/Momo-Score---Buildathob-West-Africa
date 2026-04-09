import { GoogleGenAI, Type } from "@google/genai";
import { TrustScoreResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateExplanation(result: TrustScoreResult): Promise<TrustScoreResult['explanation']> {
  const prompt = `
    Analyze the following financial data for an informal worker and provide a professional, encouraging explanation of their MoMoScore (Mobile Money Trust Score).
    
    Score: ${result.score}/100 (${result.rating})
    Total Inflow: XAF ${result.metrics.totalInflow}
    Total Outflow: XAF ${result.metrics.totalOutflow}
    Transaction Count: ${result.metrics.transactionCount}
    Active Days: ${result.metrics.activeDays}
    Bill Payments: ${result.metrics.billPaymentCount}
    Savings Transactions: ${result.metrics.savingsCount}
    Cash Out Transactions: ${result.metrics.cashOutCount}
    Consistency Level: ${result.metrics.activityConsistencyLevel}
    Inflow/Outflow Ratio: ${result.metrics.inflowOutflowRatio.toFixed(2)}

    Provide the response in JSON format with the following structure:
    {
      "summary": "A 2-3 sentence overview of their financial health.",
      "strengths": ["List 2-3 specific financial strengths based on the data."],
      "risks": ["List 1-2 potential risks or areas for improvement."],
      "recommendations": ["List 2-3 actionable steps to improve their score."]
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
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
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
    return {
      summary: "We analyzed your mobile money activity to determine your financial trust score. Your score reflects your transaction volume and consistency.",
      strengths: ["Active mobile money usage", "Regular incoming payments"],
      risks: ["Limited transaction history"],
      recommendations: ["Continue using mobile money for business", "Maintain a positive net balance"]
    };
  }
}
