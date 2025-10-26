Quizify - AI Quiz Generator 🧠✨

Quizify is a modern web application that leverages the power of Google's Gemini AI to generate dynamic quizzes based on user-provided topics or uploaded text documents. Built with React, Firebase, and Netlify, it offers a seamless and interactive learning experience.

[![Netlify Status](https://api.netlify.com/api/v1/badges/7e71662a-178b-40c2-a3f4-2214498e30bb/deploy-status)](https://app.netlify.com/projects/jinsu-quizify-ai/deploys)

Live Deployed Site: https://jinsu-quizify-ai.netlify.app

Features 🚀

AI-Powered Quiz Generation: Uses Google Gemini AI to create quizzes.

Multiple Input Modes:

Generate quizzes from any Topic.

Generate quizzes directly from uploaded Text Files (.txt, .csv).

Customizable Quizzes:

Number of Questions (1-100)

Choices per Question (2-10)

Difficulty Levels (Easy, Moderate, Hard)

Flexible Timer Options:

Set time limit per question (seconds).

Set time limit for the entire quiz (minutes).

Option to have no timer.

User Authentication:

Email/Password signup and login.

Social Login via Google & GitHub.

Anonymous Guest Mode.

User Profiles:

View quiz statistics (total taken, average score).

Upload custom profile pictures.

Quiz History & Review:

Stores history of completed quizzes for logged-in users.

Detailed review page showing each question, options, the correct answer, and the user's answer.

Creator Credits: Includes a dedicated section recognizing the developer.

PWA Ready: Can be "installed" on devices as a Progressive Web App.

Modern UI: Dark theme built with Tailwind CSS.

Tech Stack 🛠️

Frontend: React (Create React App with CRACO override), Tailwind CSS

Backend: Netlify Functions (Serverless Node.js)

AI: Google Gemini API

Authentication: Firebase Authentication

Database: Firebase Firestore

Deployment: Netlify

Getting Started 🏁

Follow these steps to set up and run the project locally.

Prerequisites

Node.js (v18 or later recommended)

npm (comes with Node.js)

Git

Firebase Account

Google Cloud Account (for Gemini API Key with Billing Enabled)

Netlify Account

Installation & Setup

Clone the Repository:

git clone [https://github.com/jinsu-2005/quizify.git](https://github.com/jinsu-2005/quizify.git)
cd quizify


Install Frontend Dependencies:

npm install


Install Backend Dependencies:

cd netlify/functions
npm install busboy node-fetch@2
cd ../..


Firebase Configuration:

Go to your Firebase project settings.

Register a Web App.

Copy the firebaseConfig object.

Paste it into the firebaseConfig variable at the top of src/App.jsx.

Enable Services: In the Firebase Console, ensure you have enabled:

Authentication (Email/Password, Google, GitHub, Anonymous providers)

Firestore Database (Create database, set production rules - see firestore.rules example in project setup steps).

Authentication Settings: Go to Authentication -> Settings -> Authorized domains and add localhost. Set "User account linking" to "Link accounts that use the same email".

Google Cloud Configuration:

Ensure you have a Google Cloud project linked to Firebase.

Go to "APIs & Services" -> Library and Enable the "Generative Language API" and "Cloud Firestore API".

Go to "Billing" and ensure your project is linked to a Billing Account (required for API usage from servers, even within free tier).

Go to "APIs & Services" -> Credentials -> Create/Get your Gemini API Key.

Go to "APIs & Services" -> OAuth consent screen. Configure it (App name, emails), add Scopes (userinfo.email, userinfo.profile, openid), and Publish the app.

Netlify & Environment Variables:

Create a file named .env in the root of your project (quizify/.env).

Add your secret Gemini API key to this file:

GEMINI_API_KEY=AIzaSy...YourSecretKey...


Running Locally

Use the Netlify CLI to run the full application (frontend + backend functions):

netlify dev


Open your browser to http://localhost:8888 (or the address provided by the command).

Deployment 🚀

This project is configured for easy deployment via Netlify.

Connect to GitHub (if not already done): Follow the Git steps (git init, git add, git commit, create repo on GitHub, git remote add, git push).

Link Netlify: Run netlify init and connect to your GitHub repository. Configure build settings (command: npm run build, directory: build, functions: netlify/functions).

Set Environment Variable: Crucially, go to your Netlify site dashboard -> Site configuration -> Build & deploy -> Environment variables. Add your GEMINI_API_KEY with its secret value.

Push to Deploy: Whenever you push changes to your GitHub repository's main branch, Netlify will automatically build and deploy the update.

git add .
git commit -m "Deploy latest changes"
git push


Creator 👨‍💻

This project was built with ❤️ by Jinsu J.

Studies: 3rd Year B.Tech, Information Technology

GitHub: jinsu-2005

LinkedIn: Jinsu .J

Email: jinsu.j2005@gmail.com

Project Started: October 2025