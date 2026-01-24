
# Infix ⇄ Postfix ⇄ Prefix Master: The Expression Lab 2.0

A professional-grade Data Structures & Algorithms (DSA) visualization tool designed to bridge the gap between theoretical stack logic and practical implementation.

## 🧠 New in Version 2.0
- **Persistent Lab Archive**: Your experiments are now saved to `localStorage`. Refreshing the page no longer loses your work; revisit past conversions and AI analyses instantly.
- **AI-Powered Mentorship**: Integrated Gemini 3.0 Flash logic to provide real-time, encouraging breakdowns of stack operations and complexity analysis.
- **Enhanced Execution Tracking**: A high-fidelity table mapping every token to its specific stack frame and action logic.
- **Total Conversion Suite**: Full support for all 6 conversion permutations plus real-time evaluation of Postfix/Prefix notation.

## 🛠️ Technical Implementation
- **Custom Stack Engine**: A hand-coded `Stack<T>` class (LIFO) demonstrating core computer science principles.
- **Persistence Layer**: Custom hook-based state management synced with the Browser Storage API.
- **Responsive UX**: Built with Tailwind CSS, featuring a "Lab Archive" sidebar for rapid session restoration.
- **AI Integration**: Secure environment-variable-driven communication with Google GenAI.

## 📦 Deployment to Vercel

1. **Push to GitHub**: Ensure your code is in a repository.
2. **Connect to Vercel**: Import the repo into the Vercel Dashboard.
3. **Environment Variables**: 
   - Navigate to **Settings > Environment Variables**.
   - Add `API_KEY` with your Gemini key from [AI Studio](https://aistudio.google.com/).
4. **Deploy**: Vercel will serve the static files automatically.

---

## 📄 Professional Summary (For Resume)

**Senior DSA Visualization Platform | React, TypeScript, AI Integration**
- Engineered an educational platform for visualizing stack-based algorithms, supporting 8 complex expression operations.
- Implemented a **Persistent State System** using Web Storage APIs to maintain user session history across browser refreshes.
- Leveraged **LLMs (Gemini API)** to generate automated, context-aware algorithmic proofs and O(n) complexity analyses.
- Developed a custom **Generic Stack Structure** to handle operator precedence and associativity for mathematical parsing.
