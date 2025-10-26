<h1 align="center">Quizify - AI Quiz Generator 🧠✨</h1>

<p align="center">
  <b>A modern AI-powered quiz generator built using Google's Gemini AI</b><br/>
  <i>Generate smart quizzes instantly from any topic or uploaded text!</i>
</p>

<p align="center">
  <a href="https://app.netlify.com/projects/jinsu-quizify-ai/deploys">
    <img src="https://api.netlify.com/api/v1/badges/7e71662a-178b-40c2-a3f4-2214498e30bb/deploy-status" alt="Netlify Status"/>
  </a>
</p>

<p align="center">
  🔗 <b>Live Site:</b> <a href="https://jinsu-quizify-ai.netlify.app">https://jinsu-quizify-ai.netlify.app</a>
</p>

---

## ✨ Features

### 🚀 AI-Powered Quiz Generation
- Uses **Google Gemini AI** to create context-aware quizzes.

### 🧾 Multiple Input Modes
- Generate quizzes from any **topic**.
- Upload **text files (.txt, .csv)** to auto-generate questions.

### ⚙️ Customizable Quizzes
- **Number of Questions:** 1–100  
- **Choices per Question:** 2–10  
- **Difficulty Levels:** Easy, Moderate, Hard  

### ⏰ Flexible Timer Options
- Time per question *(seconds)*  
- Time for entire quiz *(minutes)*  
- Option for **no timer**

### 🔐 User Authentication
- Email/Password signup & login  
- Social Login via **Google** & **GitHub**  
- **Guest Mode** (no login required)

### 👤 User Profiles
- View quiz stats *(total quizzes, average score)*  
- Upload custom profile picture

### 🧠 Quiz History & Review
- Stores completed quizzes for logged-in users  
- Review answers: correct vs selected  

### ❤️ Creator Credits
- Dedicated section recognizing the developer

### 📱 PWA Ready
- Installable Progressive Web App

### 🎨 Modern UI
- Dark theme using **Tailwind CSS**

---

## 🛠️ Tech Stack

| Component | Technology |
|------------|-------------|
| **Frontend** | React (CRA + CRACO), Tailwind CSS |
| **Backend** | Netlify Functions (Serverless Node.js) |
| **AI Integration** | Google Gemini API |
| **Authentication** | Firebase Authentication |
| **Database** | Firebase Firestore |
| **Deployment** | Netlify |

---

## 🏁 Getting Started

Follow these steps to set up and run the project locally.

### ✅ Prerequisites
- Node.js (v18 or later)
- npm (comes with Node.js)
- Git
- Firebase Account
- Google Cloud Account *(Gemini API Key with Billing Enabled)*
- Netlify Account

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```
git clone https://github.com/jinsu-2005/quizify.git
cd quizify
```

### 2️⃣ Install Frontend Dependencies
```
npm install
```

### 3️⃣ Install Backend Dependencies
```
cd netlify/functions
npm install busboy node-fetch@2
cd ../..
```

---

## 🔥 Firebase Configuration

1. Go to your **Firebase project settings** → Register a **Web App**.  
2. Copy the `firebaseConfig` object.  
3. Paste it into the `firebaseConfig` variable in **src/App.jsx**.  
4. Enable these Firebase services:
   - **Authentication** (Email/Password, Google, GitHub, Anonymous)
   - **Firestore Database**

**Authentication Settings:**
- Add `localhost` under *Authorized domains*.
- Set *User account linking* → “Link accounts that use the same email”.

---

## ☁️ Google Cloud Configuration

1. Link your Firebase project to **Google Cloud**.  
2. Enable APIs:
   - Generative Language API  
   - Cloud Firestore API  
3. Link your project to a **Billing Account**.  
4. Generate your **Gemini API Key** under  
   *APIs & Services → Credentials → Create API Key*.  
5. Configure **OAuth consent screen** → Add required scopes and publish.

---

## 🌍 Netlify & Environment Variables

Create a `.env` file in your root directory:
```
GEMINI_API_KEY=AIzaSy...YourSecretKey...
```

Run the app locally:
```
netlify dev
```

Then open 👉 **http://localhost:8888**

---

## 🚀 Deployment (Netlify)

### 1️⃣ Connect GitHub
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/jinsu-2005/quizify.git
git push -u origin main
```

### 2️⃣ Link Netlify
```
netlify init
```
- **Build command:** `npm run build`  
- **Publish directory:** `build`  
- **Functions directory:** `netlify/functions`

### 3️⃣ Set Environment Variables
Go to  
`Netlify → Site configuration → Build & deploy → Environment variables`  
Add your `GEMINI_API_KEY`.

### 4️⃣ Push to Deploy
```
git add .
git commit -m "Deploy latest changes"
git push
```

---

## 👨‍💻 Creator

| Detail | Info |
|--------|------|
| **Name** | Jinsu J |
| **Role** | Developer & Student (3rd Year B.Tech IT) |
| **GitHub** | [jinsu-2005](https://github.com/jinsu-2005) |
| **LinkedIn** | Jinsu .J |
| **Email** | jinsu.j2005@gmail.com |
| **Project Started** | October 2025 |

---

<p align="center">
  Built with ❤️ by <b>Jinsu J</b> — Empowering Learning with AI 🚀
</p>
