import React, { useState, useEffect, createContext, useContext } from 'react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  getDocs,
  orderBy,
  updateDoc,
  deleteDoc,
  onSnapshot // Added for real-time updates
} from 'firebase/firestore';
// Firebase Storage imports removed - using Firestore for profile pictures

/* ═══════════════════════════════════════════════════════════
   1. FIREBASE CONFIGURATION
   ═══════════════════════════════════════════════════════════ */

const firebaseConfig = {
  apiKey: "AIzaSyAbqc7XKvad9DZgOX5KudSEepyawlJd04I",
  authDomain: "quizify-25f11.firebaseapp.com",
  projectId: "quizify-25f11",
  storageBucket: "quizify-25f11.firebasestorage.app",
  messagingSenderId: "1084847201377",
  appId: "1:1084847201377:web:337becfdafaa73f92d1e20",
  measurementId: "G-RNH1BBN2FS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Storage removed - using Firestore Base64 for profile pictures
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

/* ═══════════════════════════════════════════════════════════
   2. AUTHENTICATION CONTEXT WITH REAL-TIME UPDATES
   ═══════════════════════════════════════════════════════════ */

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user data from Firestore
  const fetchUser = async (user) => {
    setLoading(true);
    if (user) {
      if (!user.isAnonymous) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          // Combine auth data with Firestore data
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          // Create profile if it doesn't exist
          const newUserProfile = {
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null, // Explicitly store photoURL from Google/GitHub
            createdAt: serverTimestamp(),
            totalQuizzes: 0,
            averageScore: 0,
          };
          try {
            await setDoc(userDocRef, newUserProfile);
            setCurrentUser({ ...user, ...newUserProfile });
          } catch (error) {
            console.error('Error creating user profile:', error);
            setCurrentUser(user);
          }
        }
      } else {
        // Anonymous user
        setCurrentUser({ ...user, displayName: 'Guest', isAnonymous: true });
      }
    } else {
      setCurrentUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, fetchUser);
    
    return () => unsubscribeAuth();
  }, []);

  // ✨ ENHANCEMENT: Real-time Firestore listener for profile updates
  useEffect(() => {
    let unsubscribeFirestore = null;

    if (currentUser && !currentUser.isAnonymous) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Real-time listener for profile changes
      unsubscribeFirestore = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          setCurrentUser(prev => ({
            ...prev,
            ...docSnapshot.data()
          }));
        }
      }, (error) => {
        console.error('Error listening to user profile:', error);
      });
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [currentUser?.uid]);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await fetchUser(auth.currentUser);
    }
  };

  const value = { currentUser, refreshUser };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Spinner />
        <p className="ml-4 text-xl">Loading Quizify...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ═══════════════════════════════════════════════════════════
   3. UI HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════ */

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// ✨ NEW: Success Toast Component
const SuccessToast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center space-x-2">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
  );
};

// ✨ NEW: Confirmation Modal Component
const ConfirmModal = ({ title, message, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onCancel}>
    <div className="bg-gray-800 text-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-300 mb-6">{message}</p>
      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 flex items-center justify-center"
        >
          {loading ? <Spinner /> : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   4. AUTHENTICATION FORMS
   ═══════════════════════════════════════════════════════════ */

const AuthForm = ({ isLogin, setPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: userCredential.user.email.split('@')[0],
          createdAt: serverTimestamp(),
          totalQuizzes: 0,
          averageScore: 0,
        });
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user profile exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      // Create or update profile with Google/GitHub photo
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL, // Store Google/GitHub profile picture
          createdAt: serverTimestamp(),
          totalQuizzes: 0,
          averageScore: 0,
        });
      } else {
        // Update photoURL if changed (for existing users)
        const existingData = userDoc.data();
        if (user.photoURL && user.photoURL !== existingData.photoURL) {
          await updateDoc(userDocRef, {
            photoURL: user.photoURL,
            displayName: user.displayName || existingData.displayName
          });
        }
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleAnonymousLogin = async () => {
    setError('');
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl text-white animate-fade-in">
        <h1 className="text-4xl font-bold text-center mb-2">Quizify</h1>
        <p className="text-center text-gray-400 mb-8">{isLogin ? 'Welcome back!' : 'Join the Quest'}</p>

        {error && <p className="bg-red-800 text-red-100 p-3 rounded-lg mb-4 text-center">{error}</p>}

        <form onSubmit={handleEmailPassword}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-100"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 text-gray-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center disabled:bg-gray-500 h-12"
          >
            {loading ? <Spinner /> : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-800 text-gray-400">OR</span></div>
        </div>

        <div className="space-y-4">
          <button onClick={() => handleSocialLogin(googleProvider)} className="w-full bg-gray-700 hover:bg-gray-600 font-bold py-3 rounded-lg transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.048 36.453 44 30.861 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Continue with Google
          </button>

          <button onClick={() => handleSocialLogin(githubProvider)} className="w-full bg-gray-700 hover:bg-gray-600 font-bold py-3 rounded-lg transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="text-center mt-6">
          <button onClick={handleAnonymousLogin} className="text-gray-400 hover:text-white font-semibold transition-colors">
            Continue as Guest
          </button>
        </div>

        <p className="text-center text-gray-400 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setPage(isLogin ? 'signup' : 'login')} className="font-semibold text-blue-500 hover:text-blue-400">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   5. MODALS & FOOTER
   ═══════════════════════════════════════════════════════════ */

const CreditsModal = ({ setShowCredits }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in p-4" onClick={() => setShowCredits(false)}>
    <div className="bg-gray-800 text-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-auto text-center transform transition-all" onClick={(e) => e.stopPropagation()}>
      <img src="/my-pic.png" alt="Jinsu J" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 border-4 border-blue-500 object-cover bg-gray-700" onError={(e) => { e.target.style.display = 'none'; }} />
      <h2 className="text-2xl sm:text-3xl font-bold">Jinsu J</h2>
      <p className="text-blue-400 font-semibold text-sm sm:text-base">3rd Year B.Tech, Information Technology</p>
      <p className="text-gray-400 mt-2 text-xs sm:text-sm">Project Creation: October 2025</p>
      <div className="my-5 border-t border-gray-700"></div>
      <div className="space-y-3 text-left text-sm sm:text-base">
        <a href="mailto:jinsu.j2005@gmail.com" className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors group">
          <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
          </svg>
          <span>jinsu.j2005@gmail.com</span>
        </a>
      </div>
      <div className="my-5 border-t border-gray-700"></div>
      <div className="flex justify-center space-x-4">
        <a href="https://github.com/jinsu-2005" target="_blank" rel="noopener noreferrer" title="GitHub Profile" className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
        <a href="https://www.linkedin.com/in/jinsu-j-48b072296" target="_blank" rel="noopener noreferrer" title="LinkedIn Profile" className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </a>
      </div>
      <button onClick={() => setShowCredits(false)} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm sm:text-base">
        Close
      </button>
    </div>
  </div>
);

// --- UPDATED FOOTER COMPONENT ---
const Footer = ({ setShowCredits }) => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 text-center py-3 text-sm text-gray-500 z-20">
             © {currentYear} · Build with{' '}
             {/* Added animate-pulse for a glowing effect */}
            <span aria-label="love" className="text-red-400 inline-block animate-pulse">❤️</span> by{' '}
            <button onClick={() => setShowCredits(true)} className="font-semibold text-blue-500 hover:text-blue-400 hover:underline">
                Jinsu J
            </button>
        </footer>
    );
};
/* ═══════════════════════════════════════════════════════════
   6. HEADER COMPONENT - FIXED PROFILE PICTURE UPDATE
   ═══════════════════════════════════════════════════════════ */

const Header = ({ setPage }) => {
  const { currentUser } = useAuth();

  // ✅ FIX: Use currentUser from context which updates via real-time listener
  const displayName = currentUser?.displayName || 'User';
  const photoURL = currentUser?.photoURL || `https://api.dicebear.com/8.x/avataaars/svg?seed=${currentUser?.uid}`;

  return (
    <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-10">
      <h1 className="text-2xl font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPage('quizForge')}>
        Quizify
      </h1>
      <div className="flex items-center space-x-4">
        {currentUser?.isAnonymous ? (
          <span className="text-white font-medium">Guest Mode</span>
        ) : (
          <button onClick={() => setPage('profile')} title="View Profile" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img src={photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover bg-gray-600" />
            <span className="text-white font-medium hidden sm:block">{displayName}</span>
          </button>
        )}
        <button onClick={() => signOut(auth)} title="Logout" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Logout
        </button>
      </div>
    </header>
  );
};

/* ═══════════════════════════════════════════════════════════
   7. QUIZ FORGE PAGE (No changes needed - keeping original)
   ═══════════════════════════════════════════════════════════ */

const QuizForge = ({ setPage, setQuizConfig }) => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [numOptions, setNumOptions] = useState(4);
  const [difficulty, setDifficulty] = useState('Moderate');
  const [timerMode, setTimerMode] = useState('off');
  const [timeValue, setTimeValue] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [instruction, setInstruction] = useState('Create a multiple-choice quiz based on the provided text.');
  const [mode, setMode] = useState('topic');

  useEffect(() => {
    if (timerMode === 'perQuestion') setTimeValue(30);
    else if (timerMode === 'total') setTimeValue(10);
  }, [timerMode]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const timerSettings = { mode: timerMode, time: timeValue };
    let requestOptions;

    if (mode === 'file') {
      if (!file || !instruction) {
        setError('Please upload a file and provide an instruction.');
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify({ instruction, numQuestions, numOptions, difficulty }));
      requestOptions = { method: 'POST', body: formData };
    } else {
      if (!topic) {
        setError('Please enter a topic.');
        setLoading(false);
        return;
      }
      requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, numQuestions, numOptions, difficulty }),
      };
    }

    try {
      const response = await fetch('/.netlify/functions/generateQuiz', requestOptions);
      const responseBody = await response.text();

      if (!response.ok) {
        let errorMsg = 'Failed to generate quiz.';
        try {
          errorMsg = JSON.parse(responseBody).error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const quizData = JSON.parse(responseBody);
      if (quizData && quizData.length > 0) {
        setQuizConfig({ quizData, topic: file ? file.name : topic, difficulty, timerSettings });
        setPage('theArena');
      } else {
        throw new Error('AI returned an empty or invalid quiz.');
      }
    } catch (err) {
      console.error('Quiz generation error:', err);
      if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
        setError('Received an invalid response from the server. Please try again.');
      } else {
        setError(err.message || 'An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = 'w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 p-4 pt-24 pb-16">
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-2xl shadow-2xl text-white animate-fade-in">
        <h2 className="text-3xl font-bold text-center mb-2">The Quiz Forge</h2>

        <div className="flex justify-center bg-gray-700 p-1 rounded-lg mb-8 max-w-sm mx-auto">
          <button onClick={() => setMode('topic')} className={`w-full py-2 font-semibold rounded-md transition-colors ${mode === 'topic' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}>
            From Topic
          </button>
          <button onClick={() => setMode('file')} className={`w-full py-2 font-semibold rounded-md transition-colors ${mode === 'file' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}>
            From File
          </button>
        </div>

        <form onSubmit={handleGenerateQuiz}>
          {mode === 'topic' ? (
            <div className="animate-fade-in">
              <label htmlFor="topic" className="block text-gray-300 mb-2 font-medium">Topic</label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={inputStyle}
                placeholder="e.g., The Roman Empire"
              />
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Upload Document</label>
                <label htmlFor="file-upload" className="w-full flex items-center justify-center px-4 py-6 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-400">{file ? file.name : 'Click to upload'}</p>
                    <p className="text-xs text-gray-500">TXT or CSV files only</p>
                  </div>
                </label>
                <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.csv" />
              </div>
              <div>
                <label htmlFor="instruction" className="block text-gray-300 mb-2 font-medium">Instruction</label>
                <textarea
                  id="instruction"
                  rows="3"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className={inputStyle}
                  placeholder="e.g., Create a 5-question true/false quiz."
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="questions" className="block text-gray-300 mb-2 font-medium">No. of Questions (1-100)</label>
              <input
                type="number"
                id="questions"
                min="1"
                max="100"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(100, Number(e.target.value))))}
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="options" className="block text-gray-300 mb-2 font-medium">Choices per Question (2-10)</label>
              <input
                type="number"
                id="options"
                min="2"
                max="10"
                value={numOptions}
                onChange={(e) => setNumOptions(Math.max(2, Math.min(10, Number(e.target.value))))}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-gray-300 mb-2 font-medium">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {['Easy', 'Moderate', 'Hard'].map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all duration-200 border-2 ${difficulty === level ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-transparent hover:border-blue-500'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-gray-300 mb-2 font-medium">Timer Mode</label>
            <div className="grid grid-cols-3 gap-2 bg-gray-700 p-1 rounded-lg">
              {['off', 'perQuestion', 'total'].map((tMode) => (
                <button
                  type="button"
                  key={tMode}
                  onClick={() => setTimerMode(tMode)}
                  className={`py-2 text-sm font-semibold rounded-md transition-colors ${timerMode === tMode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
                >
                  {tMode === 'perQuestion' ? 'Per Question' : tMode === 'total' ? 'Total Quiz' : 'Off'}
                </button>
              ))}
            </div>

            {timerMode === 'perQuestion' && (
              <div className="mt-2 animate-fade-in">
                <label htmlFor="timePer" className="block text-gray-400 text-sm mb-1">Seconds per question (min 10)</label>
                <input
                  type="number"
                  id="timePer"
                  min="10"
                  value={timeValue}
                  onChange={(e) => setTimeValue(Math.max(10, Number(e.target.value)))}
                  className={inputStyle}
                />
              </div>
            )}

            {timerMode === 'total' && (
              <div className="mt-2 animate-fade-in">
                <label htmlFor="totalTime" className="block text-gray-400 text-sm mb-1">Total minutes for quiz (min 1)</label>
                <input
                  type="number"
                  id="totalTime"
                  min="1"
                  value={timeValue}
                  onChange={(e) => setTimeValue(Math.max(1, Number(e.target.value)))}
                  className={inputStyle}
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-center my-4 p-3 bg-red-900/50 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 disabled:bg-gray-500 flex items-center justify-center transform hover:scale-105 mt-8 h-12"
          >
            {loading ? <Spinner /> : 'Generate Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   8. THE ARENA PAGE (Quiz Taking - keeping original)
   ═══════════════════════════════════════════════════════════ */

const TheArena = ({ setPage, quizConfig, setLastResult }) => {
  const { quizData, topic, timerSettings } = quizConfig;
  const { currentUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (timerSettings.mode === 'perQuestion') return timerSettings.time;
    if (timerSettings.mode === 'total') return timerSettings.time * 60;
    return null;
  });
  const timerIntervalRef = React.useRef(null);

  useEffect(() => {
    const handleTimeout = () => handleAnswer(null);

    if (timerSettings.mode === 'off' || isAnswered) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentIndex, isAnswered, timerSettings.mode, timerSettings.time]);

  const handleAnswer = React.useCallback(
    (option) => {
      if (isAnswered) return;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      setIsAnswered(true);
      setSelectedAnswer(option);

      const currentQ = quizData[currentIndex];
      const isCorrect = option === currentQ.answer;
      if (isCorrect) setScore((prev) => prev + 1);

      setUserAnswers((prev) => [
        ...prev,
        {
          question: currentQ.question,
          options: currentQ.options,
          correctAnswer: currentQ.answer,
          userChoice: option,
          isCorrect: isCorrect,
        },
      ]);

      setTimeout(() => setShowNext(true), 1200);
    },
    [isAnswered, currentIndex, quizData]
  );

  const handleNextQuestion = async () => {
    if (currentIndex < quizData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
      setShowNext(false);
      if (timerSettings.mode === 'perQuestion') setTimeLeft(timerSettings.time);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      await saveResults();
    }
  };

  const saveResults = async () => {
    const resultData = {
      topic,
      score,
      totalQuestions: quizData.length,
      difficulty: quizConfig.difficulty,
      date: serverTimestamp(),
      attemptDetails: userAnswers,
    };

    if (currentUser && !currentUser.isAnonymous) {
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'quizHistory'), resultData);
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newTotalQuizzes = (userData.totalQuizzes || 0) + 1;
          const currentTotalScorePoints = (userData.averageScore || 0) * (userData.totalQuizzes || 0);
          const newQuizScorePoints = (score / quizData.length) * 100;
          const newAverageScore = (currentTotalScorePoints + newQuizScorePoints) / newTotalQuizzes;

          await updateDoc(userRef, {
            totalQuizzes: newTotalQuizzes,
            averageScore: newAverageScore,
          });
        }
      } catch (error) {
        console.error('Error saving quiz result:', error);
      }
    }

    setLastResult(resultData);
    setPage('results');
  };

  const progressPercent = ((currentIndex + 1) / quizData.length) * 100;
  let timerWidth = 100;
  let timerColor = 'bg-blue-500';
  let displayTime = timeLeft;

  if (timerSettings.mode === 'perQuestion') {
    timerWidth = Math.max(0, (timeLeft / timerSettings.time) * 100);
    if (timeLeft <= 5) timerColor = 'bg-red-500 animate-pulse';
  } else if (timerSettings.mode === 'total') {
    const totalDuration = timerSettings.time * 60;
    timerWidth = Math.max(0, (timeLeft / totalDuration) * 100);
    if (timeLeft <= 30) timerColor = 'bg-red-500 animate-pulse';
    displayTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 animate-fade-in">
      <div className="w-full max-w-3xl mb-4">
        <div className="flex justify-between items-center mb-2 text-white">
          <p className="font-bold truncate pr-4" title={topic}>{topic}</p>
          <div className="flex items-center space-x-4 flex-shrink-0">
            {timerSettings.mode !== 'off' && <span className="font-mono text-lg">{displayTime}</span>}
            <p>Question {currentIndex + 1} of {quizData.length}</p>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full transition-width duration-500 ease-linear" style={{ width: `${progressPercent}%` }}></div>
        </div>
        {timerSettings.mode !== 'off' && (
          <div className="w-full bg-gray-600 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className={`h-1.5 rounded-full transition-all duration-1000 linear ${timerColor}`} style={{ width: `${timerWidth}%` }}></div>
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl bg-gray-800 p-8 rounded-2xl shadow-2xl text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 min-h-[100px] flex items-center">{quizData[currentIndex].question}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizData[currentIndex].options.map((option, index) => {
            const isCorrect = option === quizData[currentIndex].answer;
            const isSelected = selectedAnswer === option;

            let buttonClass = 'bg-gray-700 hover:bg-gray-600';
            if (isAnswered) {
              if (isCorrect) {
                buttonClass = 'bg-green-700 border-green-500 scale-105 ring-2 ring-green-400';
              } else if (isSelected && !isCorrect) {
                buttonClass = 'bg-red-700 border-red-500 ring-2 ring-red-400';
              } else {
                buttonClass = 'bg-gray-700 opacity-60';
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
                className={`p-4 rounded-lg text-left text-lg font-medium border-2 border-transparent transition-all duration-300 ${buttonClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {showNext && (
          <div className="mt-8 text-right">
            <button
              onClick={handleNextQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105 animate-fade-in"
            >
              {currentIndex === quizData.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   9. RESULTS PAGE (keeping original)
   ═══════════════════════════════════════════════════════════ */

const ResultsPage = ({ setPage, lastResult }) => {
  const { currentUser } = useAuth();

  if (!lastResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 text-white">
        <p>No result to display.</p>
        <button onClick={() => setPage('quizForge')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
          Go to Forge
        </button>
      </div>
    );
  }

  const { score, totalQuestions, topic } = lastResult;
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 p-4 pt-24 pb-12">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl text-white text-center animate-fade-in">
        <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-gray-400 mb-6 truncate" title={topic}>Topic: {topic}</p>
        <p className="text-xl text-gray-300 mb-2">Your Score</p>
        <p className="text-7xl font-bold text-blue-500 mb-1">{percentage}%</p>
        <p className="text-2xl text-gray-400 mb-8">{score}/{totalQuestions} correct</p>
        <div className="flex flex-col space-y-4">
          <button onClick={() => setPage('quizForge')} className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3 rounded-lg transition-transform duration-300 transform hover:scale-105">
            Forge Another Quiz
          </button>
          {!currentUser.isAnonymous && (
            <button onClick={() => setPage('profile')} className="w-full bg-gray-600 hover:bg-gray-500 font-bold py-3 rounded-lg transition-transform duration-300 transform hover:scale-105">
              View Profile & History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   10. PROFILE PAGE - ENHANCED WITH DELETE FEATURE
   ═══════════════════════════════════════════════════════════ */

const ProfilePage = ({ setPage, setSelectedHistoryItem }) => {
  const { currentUser, refreshUser } = useAuth();
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // ✨ NEW: Delete modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null, loading: false });

  useEffect(() => {
    const fetchHistory = async () => {
      if (currentUser && !currentUser.isAnonymous) {
        setLoading(true);
        setError('');
        try {
          const q = query(collection(db, 'users', currentUser.uid, 'quizHistory'), orderBy('date', 'desc'));
          const querySnapshot = await getDocs(q);
          setQuizHistory(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
          console.error('Error fetching history:', err);
          setError('Could not load quiz history.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.isAnonymous) {
      setPage('quizForge');
    }
  }, [currentUser, setPage]);

  if (currentUser?.isAnonymous) return null;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Spinner />
      </div>
    );
  }

  const handleReviewClick = (item) => {
    setSelectedHistoryItem(item);
    setPage('review');
  };

  // ✨ NEW: Delete quiz history handler
  const handleDeleteClick = (item) => {
    setDeleteModal({ show: true, item, loading: false });
  };

  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    
    try {
      // Delete the quiz history document
      await deleteDoc(doc(db, 'users', currentUser.uid, 'quizHistory', deleteModal.item.id));
      
      // Update user stats
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const oldTotalQuizzes = userData.totalQuizzes || 0;
        const oldAverageScore = userData.averageScore || 0;
        
        if (oldTotalQuizzes > 0) {
          const deletedQuizScore = (deleteModal.item.score / deleteModal.item.totalQuestions) * 100;
          const newTotalQuizzes = oldTotalQuizzes - 1;
          
          let newAverageScore = 0;
          if (newTotalQuizzes > 0) {
            const oldTotalScore = oldAverageScore * oldTotalQuizzes;
            const newTotalScore = oldTotalScore - deletedQuizScore;
            newAverageScore = newTotalScore / newTotalQuizzes;
          }
          
          await updateDoc(userRef, {
            totalQuizzes: newTotalQuizzes,
            averageScore: newAverageScore,
          });
        }
      }
      
      // Update local state
      setQuizHistory(prev => prev.filter(item => item.id !== deleteModal.item.id));
      setSuccessMessage('Quiz deleted successfully!');
      setDeleteModal({ show: false, item: null, loading: false });
    } catch (err) {
      console.error('Error deleting quiz:', err);
      setError('Failed to delete quiz. Please try again.');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, item: null, loading: false });
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser || currentUser.isAnonymous) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG).');
      return;
    }

    // Allow up to 2MB raw file size (will be compressed)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size too large (max 2MB). Please use a smaller image.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Create image element to resize/compress
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = async () => {
        try {
          // Create canvas to resize image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize to max 400x400 (perfect for profile pictures)
          const maxSize = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to Base64 with compression (JPEG, 0.7 quality)
          const base64DataURL = canvas.toDataURL('image/jpeg', 0.7);
          
          // Check if compressed size is acceptable (Base64 string length)
          if (base64DataURL.length > 1000000) { // ~750KB after Base64
            setError('Image still too large after compression. Try a smaller image.');
            setUploading(false);
            return;
          }

          // ⚠️ Skip Firebase Auth - photoURL has 2KB limit (Base64 images are too large)
          // Only store in Firestore which allows up to 1MB per field
          
          // Update Firestore user document only
          await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: base64DataURL });

          // ✅ Real-time listener will automatically update the UI
          setSuccessMessage('Profile picture updated!');
          setUploading(false);
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          const errorMsg = error.message || 'Failed to upload profile picture.';
          setError(`Upload failed: ${errorMsg}`);
          setUploading(false);
        }
      };

      img.onerror = () => {
        setError('Failed to load image file.');
        setUploading(false);
      };

      reader.onerror = () => {
        setError('Failed to read image file.');
        setUploading(false);
      };

      // Start reading the file
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      const errorMsg = error.message || 'Failed to upload profile picture.';
      setError(`Upload failed: ${errorMsg}`);
      setUploading(false);
    }
  };

  const displayName = currentUser?.displayName || 'User';
  const photoURL = currentUser?.photoURL || `https://api.dicebear.com/8.x/avataaars/svg?seed=${currentUser?.uid}`;

  return (
    <div className="min-h-screen bg-gray-900 p-4 pt-24 pb-12 text-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setPage('quizForge')} className="mb-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Back to Forge</span>
        </button>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl mb-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <div className="relative group flex-shrink-0">
            <img src={photoURL} alt="Profile" className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover bg-gray-600" />
            <label htmlFor="pfp-upload" className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploading ? (
                <Spinner />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Change</span>
                </>
              )}
            </label>
            <input type="file" id="pfp-upload" className="sr-only" accept="image/png, image/jpeg" onChange={handleProfilePicUpload} disabled={uploading} />
          </div>
          <div>
            <h2 className="text-4xl font-bold">{displayName}</h2>
            <p className="text-gray-400 text-lg">{currentUser.email}</p>
          </div>
        </div>

        {error && <p className="text-red-500 text-center mb-4 p-3 bg-red-900/50 rounded-lg">{error}</p>}
        {successMessage && <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg text-center">
            <h3 className="text-xl text-gray-400 mb-2">Total Quizzes</h3>
            <p className="text-5xl font-bold text-blue-500">{currentUser.totalQuizzes || 0}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg text-center">
            <h3 className="text-xl text-gray-400 mb-2">Average Score</h3>
            <p className="text-5xl font-bold text-blue-500">{Math.round(currentUser.averageScore || 0)}%</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Quiz History</h3>
          {loading ? (
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {quizHistory.length > 0 ? (
                quizHistory.map((item) => (
                  <div key={item.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center hover:bg-gray-600 transition-colors">
                    <div>
                      <p className="font-bold text-lg truncate max-w-xs sm:max-w-md" title={item.topic}>{item.topic}</p>
                      <p className="text-sm text-gray-400">
                        {item.date ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'N/A'} - {item.difficulty}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <p className="text-2xl font-bold text-blue-400">{Math.round((item.score / item.totalQuestions) * 100)}%</p>
                      <button onClick={() => handleReviewClick(item)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                        Review
                      </button>
                      {/* ✨ NEW: Delete button */}
                      <button onClick={() => handleDeleteClick(item)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors" title="Delete Quiz">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No quizzes taken yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✨ NEW: Delete confirmation modal */}
      {deleteModal.show && (
        <ConfirmModal
          title="Delete Quiz?"
          message={`Are you sure you want to delete "${deleteModal.item?.topic}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          loading={deleteModal.loading}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   11. REVIEW PAGE (keeping original)
   ═══════════════════════════════════════════════════════════ */

const ReviewPage = ({ setPage, item }) => {
  if (!item || !item.attemptDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>No review data available.</p>
        <button onClick={() => setPage('profile')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 pt-24 pb-12 text-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setPage('profile')} className="mb-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Back to Profile</span>
        </button>

        <h2 className="text-3xl font-bold mb-6 truncate" title={item.topic}>Reviewing: {item.topic}</h2>

        <div className="space-y-6">
          {item.attemptDetails.map((attempt, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <p className="font-bold text-xl mb-4">{index + 1}. {attempt.question}</p>
              <div className="space-y-3">
                {attempt.options.map((option, optIndex) => {
                  const isCorrect = option === attempt.correctAnswer;
                  const isUserChoice = option === attempt.userChoice;

                  let style = 'bg-gray-700';
                  if (isCorrect) {
                    style = 'bg-green-800/50 border-green-500';
                  } else if (isUserChoice && !isCorrect) {
                    style = 'bg-red-800/50 border-red-500';
                  }

                  return (
                    <div key={optIndex} className={`p-3 rounded-lg border-2 border-transparent ${style} flex justify-between items-center`}>
                      <span>{option}</span>
                      <div>
                        {isUserChoice && !isCorrect && <span className="text-xs font-bold ml-2 py-0.5 px-1.5 rounded-full bg-red-600">Your Answer</span>}
                        {isUserChoice && isCorrect && <span className="text-xs font-bold ml-2 py-0.5 px-1.5 rounded-full bg-green-600">Your Answer ✓ Correct</span>}
                        {isCorrect && !isUserChoice && <span className="text-xs font-bold ml-2 py-0.5 px-1.5 rounded-full bg-green-600">Correct Answer</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {!attempt.userChoice && (
                <div className="p-3 rounded-lg border-2 border-yellow-500 bg-yellow-800/50">
                  You did not select an answer. Correct: {attempt.correctAnswer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   12. MAIN APP COMPONENT (Router)
   ═══════════════════════════════════════════════════════════ */

function App() {
  const [page, setPage] = useState('quizForge');
  const { currentUser } = useAuth();
  const [quizConfig, setQuizConfig] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [showCredits, setShowCredits] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const renderPage = () => {
    if (!currentUser) {
      if (page === 'signup') return <AuthForm isLogin={false} setPage={setPage} />;
      return <AuthForm isLogin={true} setPage={setPage} />;
    }

    switch (page) {
      case 'theArena':
        return quizConfig ? (
          <TheArena setPage={setPage} quizConfig={quizConfig} setLastResult={setLastResult} />
        ) : (
          <QuizForge setPage={setPage} setQuizConfig={setQuizConfig} />
        );
      case 'results':
        return lastResult ? (
          <ResultsPage setPage={setPage} lastResult={lastResult} />
        ) : (
          <QuizForge setPage={setPage} setQuizConfig={setQuizConfig} />
        );
      case 'profile':
        return <ProfilePage setPage={setPage} setSelectedHistoryItem={setSelectedHistoryItem} />;
      case 'review':
        return selectedHistoryItem ? (
          <ReviewPage setPage={setPage} item={selectedHistoryItem} />
        ) : (
          <ProfilePage setPage={setPage} setSelectedHistoryItem={setSelectedHistoryItem} />
        );
      case 'quizForge':
      default:
        return <QuizForge setPage={setPage} setQuizConfig={setQuizConfig} />;
    }
  };

  return (
    <div className="bg-gray-900 relative pb-10 min-h-screen">
      {currentUser && <Header setPage={setPage} />}
      <main className="pt-16">{renderPage()}</main>
      <Footer setShowCredits={setShowCredits} />
      {showCredits && <CreditsModal setShowCredits={setShowCredits} />}
    </div>
  );
}

const AppWrapper = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWrapper;