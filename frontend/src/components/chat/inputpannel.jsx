import React, { useState, useEffect } from 'react';
import { Send, Mic, MicOff, Keyboard } from 'lucide-react';
import { useLanguage } from '../../Context/Languagecontext';
import { useSpeechRecognition } from '../../Hooks/useSpeechrecognition';
import { getSpeechLanguageCode } from '../../Utils/SpeechRecognition';
import toast from 'react-hot-toast';

const InputPanel = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const { currentLanguage } = useLanguage();
  
  const speechLangCode = getSpeechLanguageCode(currentLanguage);
  const {
    transcript,
    listening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(speechLangCode);

  useEffect(() => {
    if (transcript && !listening) {
      setInput(transcript);
    }
  }, [transcript, listening]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      resetTranscript();
    }
  };

  const toggleInputMode = () => {
    if (inputMode === 'text') {
      if (!isSupported) {
        toast.error('Speech recognition is not supported in your browser');
        return;
      }
      setInputMode('speech');
      startListening();
    } else {
      setInputMode('text');
      stopListening();
    }
  };

  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="p-4 border-t bg-gray-50">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <button
          type="button"
          onClick={toggleInputMode}
          className={`p-3 rounded-lg transition-colors ${
            inputMode === 'speech'
              ? 'bg-primary-100 text-primary-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={inputMode === 'text' ? 'Switch to voice input' : 'Switch to text input'}
        >
          {inputMode === 'text' ? <Keyboard size={20} /> : <Mic size={20} />}
        </button>

        {inputMode === 'text' ? (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 input-field"
            disabled={disabled}
          />
        ) : (
          <div className="flex-1 flex items-center space-x-3 px-4 py-2 bg-white border border-gray-300 rounded-lg">
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-2 rounded-full transition-colors ${
                listening
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'bg-primary-100 text-primary-600'
              }`}
            >
              {listening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <span className="flex-1 text-gray-600">
              {listening ? 'Listening...' : transcript || 'Click to speak'}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || (!input.trim() && !transcript)}
          className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default InputPanel;