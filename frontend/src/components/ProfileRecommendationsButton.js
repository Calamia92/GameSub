import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import ApiService from "../services/api";

const ProfileRecommendationsButton = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const { user } = useAuth();
  const { showError } = useSnackbar();

  const fetchRecommendations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const response = await ApiService.getSubstituteProfil();
      setRecommendations(response.results || []);
    } catch (error) {
      console.error("Erreur lors du chargement des recommandations :", error);
      showError("Impossible de récupérer les recommandations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={fetchRecommendations}
        disabled={loading}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        {loading ? "Chargement..." : "Obtenir des recommandations"}
      </button>

      {recommendations.length > 0 && (
        <ul className="mt-4 space-y-2">
          {recommendations.map((game) => (
            <li key={game.id} className="bg-gray-50 p-2 rounded shadow-sm">
              {game.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProfileRecommendationsButton;
