import React, { useState, useEffect } from "react"; 
import axios from "axios";
import GameCard from './GameCard';

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Configuration adaptée au backend GameSub
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/quiz/questions/`)
      .then((res) => setQuestions(res.data))
      .catch((err) => console.error("Erreur chargement questions:", err));
  }, [API_BASE]);

  const choices = [
    ["Aventure", "Stratégie", "Exploration", "Survie", "Simulation"],
    ["Seul", "En équipe", "Compétitif", "Multijoueur"],
    ["Session courte", "Aventure suivie", "Speed-Run", "Longue campagne"],
    ["Réalisme", "Fantastique", "Science-fiction", "Historique", "Post-apocalyptique"],
    ["Énigmes", "Combat", "Action", "Stratégie", "Crafting"],
  ];

  const handleChoice = (choice) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = choice;
    setAnswers(newAnswers);

    setIsRotating(true);

    setTimeout(() => {
      setIsRotating(false);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Quiz terminé - génération des suggestions
        setLoading(true);
        handleSubmit(newAnswers);
      }
    }, 600);
  };

  const handleSubmit = async (finalAnswers) => {
    try {
      const res = await axios.post(`${API_BASE}/api/quiz/submit/`, { 
        answers: finalAnswers 
      });
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error("Erreur génération suggestions:", err);
      setSuggestions(["Erreur lors de la génération des suggestions IA."]);
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setSuggestions([]);
    setLoading(false);
  };

  // Affichage des résultats ou chargement
  if (loading || (answers.length === questions.length && suggestions.length > 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎮 Vos jeux personnalisés
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Basé sur vos préférences, voici les jeux que nous vous recommandons
          </p>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-6"></div>
            <p className="text-lg text-gray-600 font-medium">
              🤖 L'IA analyse vos préférences...
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* En-tête des suggestions */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Jeux recommandés pour vous
              </h2>
              <p className="text-gray-600">
                Basé sur vos préférences : <span className="font-medium">{answers.slice(0, 2).join(', ')}</span>
              </p>
            </div>

            {/* Suggestions sous forme de GameCard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((game, i) => (
                <div key={i} className="relative">
                  <GameCard game={game} />
                  
                  {/* Badge personnalisé */}
                  <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    IA Match
                  </div>
                </div>
              ))}
            </div>
            
            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={resetQuiz}
                className="btn-outline"
              >
                Refaire le quiz
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn-primary"
              >
                Explorer d'autres jeux
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Affichage des questions
  if (questions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-6"></div>
          <p className="text-lg text-gray-600 font-medium">Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧠 Quiz de Préférences
          </h1>
          <p className="text-gray-600">
            Répondez à ces questions pour découvrir vos jeux idéaux
          </p>
        </div>
        
        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Progression</span>
            <span>{currentIndex + 1} sur {questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Carte de question */}
        <div className="card">
          <div className="p-8">
            <div className={`transition-all duration-600 ${isRotating ? 'opacity-50' : 'opacity-100'}`}>
              <h2 className="text-xl font-semibold text-gray-900 mb-8 text-center leading-relaxed">
                {questions[currentIndex]}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {choices[currentIndex]?.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChoice(choice)}
                    className="p-4 text-left border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
                    disabled={isRotating}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-primary-500 transition-colors"></div>
                      <span className="font-medium text-gray-700 group-hover:text-primary-700">
                        {choice}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {isRotating && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Question suivante...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}