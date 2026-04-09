# MoMoScore 🚀

**Turn mobile money activity into an explainable trust signal.**

MoMoScore is a financial identity platform designed for informal workers who lack formal credit history. By analyzing mobile money transaction messages (SMS/Chat), the app generates a deterministic trust score and provides AI-powered financial insights to help users access formal credit and opportunities.

## 🌐 Live Demo
[View Live Application](https://ais-dev-t64x4sds7uukqtm2y7kljs-544634115319.europe-west2.run.app)

## ✨ Key Features
- **Transaction Parser**: Extracts structured data from mock mobile money SMS/chat messages.
- **Trust Scoring Engine**: Calculates a 0-100 score based on 16+ financial metrics (consistency, savings, bill payments, etc.).
- **AI-Powered Insights**: Uses Gemini AI to explain financial behavior, highlighting strengths, risks, and actionable recommendations.
- **Privacy First**: Analysis is performed on the data provided, with no external database requirements for the core scoring logic.
- **Demo Mode**: Built-in sample profiles (Market Trader, Taxi Driver, Food Vendor) for quick testing.
- **Persistent History**: Locally stored analysis history for easy comparison.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Motion (for animations), Lucide React (icons).
- **Backend**: Express (serving the SPA).
- **AI**: Google Gemini API via `@google/genai`.

## 🚀 Getting Started

### Prerequisites
- Node.js installed.
- A Gemini API Key (configured in environment variables).

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file with your `GEMINI_API_KEY`.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 Mock Data Format
The app expects messages in the following format:
- `You have received 25000 XAF from Linda on 2026-04-01 at 09:42.`
- `You sent 8000 XAF to Paul on 2026-04-01 at 13:10.`
- `You paid 4500 XAF to ENEO on 2026-04-02 at 08:15.`

---
*Built for the Financial Inclusion Hackathon.*
