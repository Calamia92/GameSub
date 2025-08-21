import React, { useState, useEffect } from "react";
import axios from "axios";

export default function DynamicAIQuiz({ userId }) {
  const [quizGames, setQuizGames] = useState([]);
  const [responses, setResponses] = useState({});
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/games/ai-quiz/");
        setQuizGames(res.data.quiz_games);
      } catch (err) {
        console.error(err);
      }
    };
    fetchQuiz();
  }, []);

  const handleChange = (gameName, value) => {
    setResponses(prev => ({ ...prev, [gameName]: value }));
  };

  const submitResponses = async () => {
    const payload = {
      user_id: userId,
      responses: Object.entries(responses).map(([game, like]) => ({ game, like }))
    };

    try {
      const res = await axios.post("http://localhost:8000/api/games/ai-quiz/", payload);
      setSuggestion(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>🎮 Quiz IA Dynamique</h1>

      {quizGames.map(game => (
        <div key={game.id}>
          <p>{game.name}</p>
          <button onClick={() => handleChange(game.name, true)}>J'aime 👍</button>
          <button onClick={() => handleChange(game.name, false)}>J'aime pas 👎</button>
        </div>
      ))}

      <button onClick={submitResponses}>Obtenir suggestion</button>

      {suggestion && !suggestion.error && (
        <div>
          <h2>Jeu recommandé :</h2>
          <p>{suggestion.suggested_game}</p>
          <h3>Pourquoi :</h3>
          <p>{suggestion.reasoning}</p>
        </div>
      )}

      {suggestion && suggestion.error && <p>{suggestion.error}</p>}
    </div>
  );
}
