import React, { useState } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';

export default function VoiceSearch({ onSearch, className = '' }) {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("La recherche vocale n'est pas supportée sur ce navigateur");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'fr-FR'; // TODO: Dynamique avec i18n
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      onSearch(voiceText);
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Erreur reconnaissance vocale:", event.error);
      setListening(false);
    };

    recognition.start();
  };

  return (
    <div 
      className={`mic-btn ${listening ? 'listening' : ''} ${className}`} 
      onClick={startListening}
      title={listening ? "Écoute en cours..." : "Recherche vocale"}
      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {listening ? <FaStop className="animate-pulse text-red-500" /> : <FaMicrophone />}
    </div>
  );
}
