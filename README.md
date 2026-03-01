# Flowtime: Ultimate Productivity & Flow State Ecosystem


**Flowtime** is a modern productivity and task management ecosystem that breaks away from the strict rules of the classic Pomodoro technique and instead relies on the user's natural focus duration ("Flow State").

You can manage your tasks in a Kanban format, track your focus durations with the flexible Flowtime timer, and gain personal productivity insights by analyzing the collected data with the **Google Gemini AI**-powered assistant.

This project is developed using the MERN Stack (MongoDB, Express.js, React.js, Node.js) and React Native Expo.

---

## 🌟 Key Features

### 1. Flow-Driven Timer (Flowtime Timer)
Instead of the traditional "work for 25 minutes, rest for 5 minutes" pattern, it allows you to continue working until your focus breaks and dynamically calculates your break time based on how long you worked.

### 2. Drag & Drop Kanban Board (Task Management)
Easily organize your tasks on a visual board (To-Do, In Progress, Done). All changes are instantly (real-time) reflected across the database and applications.

### 3. Deep & Advanced Analytics
Your focus sessions are analyzed in the background. 
* **Peak Focus Area:** The hours when you are most productive.
* **Flow Streaks:** Daily active streaks.
* **Focus Density & Task Harmony:** 8+ different metrics such as task completion harmony and break density.

### 4. AI Productivity Assistant (Gemini AI Integration)
Not just a plain chatbot! Gemini-Flash reads your personal task and analytics data from Firebase and provides personalized intelligence such as "You are more productive in the mornings today, you should schedule critical tasks for this timeframe."

### 5. Multi-Platform Usage (Cross-Platform)
Experience flowtime platform-independently—whether via the browser fueled by Next.js or via the mobile application built for iOS/Android using React Native/Expo.

---

## 🤖 AI-Driven Development

Modern AI Coding Agents were actively and strategically utilized during the creation of this project:

*   **Architectural Planning & Refactoring:** Transitioning the project to a Monorepo structure and equipping the Express.js backend with clean-code infrastructures like `asyncHandler` were designed via pair-programming with AI models.
*   **Rapid Debugging (AI Debugging):** Complex TypeScript errors and missing type issues encountered during development were autonomously solved in **seconds** by the AI scanning AST levels directly or analyzing compiler logs.
*   **Production-Ready Security:** Through the AI assistant's guidance and automated implementation, enterprise-grade security features such as Health Check (`/api/health`), global Rate-Limiting for DDoS protection, and dynamic CORS integrations were fully completed before deployment.

---

## 🏗️ Architecture & Tech Stack

The application is built end-to-end with **TypeScript** to be completely type-safe.

- **Backend (`/flowtime_backend`):** Express.js, Node.js, Firebase Admin SDK, Zod, express-rate-limit. *(Written to enterprise standards with Global Error Handling and Anti-DDoS rate-limiting.)*
- **Web Frontend (`/met_flowtime`):** Next.js (Page Router), Redux Toolkit (RTK Query), PrimeReact, TailwindCSS, dnd-kit.
- **Mobile App (`/flowtimeMobile`):** React Native, Expo, Redux Toolkit, Firebase AsyncStorage Persistence.
- **Database & Authentication:** Firebase Firestore & Firebase Auth (Google Sign-In).
- **Artificial Intelligence:** Google GenAI (Gemini) Function Calling architecture.

---

## 🚀 Getting Started

Follow the steps below to run the project on your local machine:

### 1. Clone the Repository
```bash
git clone https://github.com/Mehmet-Emre-Topdal/Flowtime-MERN-RN-Gemini.git
cd flowtime
```

### 2. Start the Backend
```bash
cd flowtime_backend
npm install
# Configure your .env file (Firebase Admin Key and Gemini API Key are mandatory)
npm run dev
```

### 3. Start the Web Application (In a Separate Terminal)
```bash
cd met_flowtime
npm install
# Fill your .env file with Firebase Client credentials
npm run dev
```

### 4. Start the Mobile Application (In a Separate Terminal)
```bash
cd flowtimeMobile
npm install
# Update the EXPO_PUBLIC_API_URL in the .env file to your local IP address.
npm start
```

---

## 🛡️ Security & Error Handling
The API infrastructure of the project has a "Production-Ready" architecture. It includes a global `try-catch` wrapper (`asyncHandler`), brute-force protected rate-limiters, health-check endpoints, and strict CORS configurations.

