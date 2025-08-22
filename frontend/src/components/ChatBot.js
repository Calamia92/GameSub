import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [questionStarters, setQuestionStarters] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Configuration adaptée au backend GameSub
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

  // Récupération des débuts de questions depuis Django
  useEffect(() => {
    if (open && questionStarters.length === 0) {
      axios
        .get(`${API_BASE}/api/chatbot/starters/`)
        .then((res) => setQuestionStarters(res.data))
        .catch((err) => console.error("Erreur récupération starters:", err));
    }
  }, [open, API_BASE, questionStarters.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Message de bienvenue
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "bot", 
        content: "🎮 Salut ! Je suis ton assistant GameSub. Pose-moi tes questions sur les jeux vidéo !"
      }]);
    }
  }, [open, messages.length]);

  // Ajoute un texte dans l'input
  const addTextToInput = (text) => {
    setInput(text);
  };

  // Envoie le message
  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    // Ajoute le message utilisateur
    const userMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/chatbot/`, { 
        question: msg 
      });
      
      const botMessage = res.data.answer || "Désolé, je n'ai pas compris.";

      // Ajoute la réponse du bot
      setMessages((prev) => [...prev, {
        role: "bot",
        content: botMessage
      }]);

    } catch (err) {
      console.error("Erreur chatbot:", err);
      setMessages((prev) => [...prev, {
        role: "bot",
        content: "🔧 Erreur serveur, réessaye dans un moment !"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {open ? (
        <div className="w-96 max-h-[600px] flex flex-col bg-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
          {/* En-tête */}
          <div className="bg-primary-600 px-4 py-3 flex justify-between items-center border-b border-primary-700">
            <span className="font-bold text-white">🎮 Chat GameSub IA</span>
            <button 
              className="text-lg hover:bg-primary-700 w-7 h-7 rounded-full flex items-center justify-center transition-colors text-white"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Zone des messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-white max-h-80 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm break-words ${
                  m.role === 'user' 
                    ? 'bg-green-100 text-slate-800' 
                    : 'bg-blue-50 text-slate-800'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-blue-50 px-3 py-2 rounded-xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Questions suggérées */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs font-medium text-slate-600 mb-2">💡 Questions suggérées :</p>
            <div className="flex flex-wrap gap-1">
              {questionStarters.map((starter, i) => (
                <button 
                  key={i} 
                  className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-xl hover:bg-primary-50 hover:border-primary-200 transition-colors"
                  onClick={() => addTextToInput(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          {/* Zone de saisie */}
          <div className="flex p-4 bg-gray-50 border-t border-gray-200 gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pose ta question sur les jeux vidéo..."
              onKeyDown={handleKeyPress}
              rows="2"
              disabled={loading}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <span className="text-sm font-medium">
                {loading ? "⏳" : "➤"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="bg-primary-600 text-white border-none p-4 rounded-full text-2xl cursor-pointer shadow-lg hover:shadow-xl hover:bg-primary-700 transition-all duration-200"
          onClick={() => setOpen(true)}
        >
          💬
        </button>
      )}
    </div>
  );
}