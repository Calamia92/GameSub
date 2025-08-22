import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import Header from './components/Header';
import Breadcrumb from './components/Breadcrumb';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MySubstitutes from './pages/MySubstitutes';
import GameDetails from './pages/GameDetails';
import SearchHistory from './pages/SearchHistory';
import MyLibrary from './pages/MyLibrary';
import Profile from './pages/Profile';
import AIPreferences from './pages/AIPreferences';
import ChatBot from './components/ChatBot';

function App() {
  return (
    <AuthProvider>
      <SnackbarProvider>
        <Router>
          <div className="App">
            <Header />
            <Breadcrumb />
            <main className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/my-substitutes" element={<MySubstitutes />} />
                <Route path="/my-library" element={<MyLibrary />} />
                <Route path="/search-history" element={<SearchHistory />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/ai-preferences" element={<AIPreferences />} />
                <Route path="/game/:id" element={<GameDetails />} />
              </Routes>
              <ChatBot />
            </main>
          </div>
        </Router>
      </SnackbarProvider>
    </AuthProvider>
  );
}

export default App;