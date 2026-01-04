# Infix ⇄ Postfix ⇄ Prefix Master: The Expression Lab

A comprehensive Data Structures & Algorithms (DSA) visualization tool built to help students master stack-based expression conversion and evaluation.

## 🚀 Live Demo
*Coming soon! Follow the deployment guide below.*

## 🧠 Features
- **Total Conversion Suite**: Supports all 6 conversion permutations (Infix, Postfix, Prefix).
- **Expression Evaluation**: Real-time evaluation of Postfix and Prefix notations.
- **Interactive Stack Visualizer**: Watch the LIFO (Last-In-First-Out) logic in real-time with a step-by-step execution table.
- **AI-Powered Mentor**: Integrated with Gemini 1.5 Flash to provide personalized algorithmic analysis and complexity breakdowns.
- **Pure JavaScript Logic**: All algorithms and the Stack data structure are implemented from scratch to demonstrate deep architectural understanding.

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS, Font Awesome
- **AI Integration**: Google Gemini API (@google/genai)
- **State Management**: React Hooks

## 📦 Deployment Guide (Vercel - Recommended)

1. **Push to GitHub**: Upload your project code to a public or private GitHub repository.
2. **Connect to Vercel**:
   - Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
   - Click "Add New" -> "Project".
   - Import your repository.
3. **Configure Environment Variables**:
   - During the "Configure Project" step, expand the **Environment Variables** section.
   - Add a new variable:
     - **Key**: `API_KEY`
     - **Value**: `your_gemini_api_key_here` (Get one at [AI Studio](https://aistudio.google.com/))
4. **Deploy**: Click "Deploy". Your app will be live in seconds!

---

## 📄 Professional Resume Description

**Expression Master | DSA Visualization Tool**
*JavaScript, React, TypeScript, Google Gemini API, Tailwind CSS*
- Developed a full-stack algorithmic visualization platform supporting 8 distinct expression conversion and evaluation operations.
- Engineered a custom **Stack Data Structure** from scratch to manage complex operator precedence and associativity logic.
- Integrated **Google Gemini AI** to provide real-time, automated analysis of algorithmic steps and time/space complexity (O(n)).
- Built a high-performance UI featuring a step-by-step execution tracker that maps token processing to stack state transitions.
- Optimized the application for educational clarity, achieving a seamless bridge between theoretical computer science and practical implementation.
