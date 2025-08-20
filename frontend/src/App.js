import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MySubstitutes from './pages/MySubstitutes';
import GameDetails from './pages/GameDetails';
import SearchHistory from './pages/SearchHistory';
import MyLibrary from './pages/MyLibrary';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/my-substitutes" element={<MySubstitutes />} />
              <Route path="/my-library" element={<MyLibrary />} />
              <Route path="/search-history" element={<SearchHistory />} />
              <Route path="/game/:id" element={<GameDetails />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;