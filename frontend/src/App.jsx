import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Heart, Activity, Stethoscope, Brain, AlertTriangle, Loader, Mic, MicOff, Volume2, VolumeX, Play, Square, Pause } from 'lucide-react';

const HealthcareChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI Health Assistant. I can help analyze your symptoms and provide health guidance. Please describe your symptoms or health concerns. You can type or use voice input!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [userProfile, setUserProfile] = useState(null);
  
  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Text-to-Speech States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
      };
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev + ' ' + transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access to use voice input.');
        }
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Initialize Text-to-Speech
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      
      const loadVoices = () => {
        const availableVoices = synth.getVoices();
        setVoices(availableVoices);
        
        // Prefer female voice for healthcare assistant
        const preferredVoice = availableVoices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha')
        ) || availableVoices.find(voice => voice.lang.startsWith('en')) || availableVoices[0];
        
        setSelectedVoice(preferredVoice);
      };
      
      loadVoices();
      synth.onvoiceschanged = loadVoices;
    }
  }, []);

  // Speech Recognition Functions
  const startListening = () => {
    if (recognition && speechSupported && !isSpeaking) {
      try {
        setIsPaused(false);
        recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      setIsPaused(false);
    }
  };

  const pauseListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsPaused(true);
      setIsListening(false);
    }
  };

  const resumeListening = () => {
    if (recognition && isPaused && !isSpeaking) {
      try {
        setIsPaused(false);
        recognition.start();
      } catch (error) {
        console.error('Error resuming speech recognition:', error);
      }
    }
  };

  // Text-to-Speech Functions
  const speakText = (text, messageId) => {
    if (speechSynthesis && selectedVoice) {
      // Stop any current speech and pause listening
      speechSynthesis.cancel();
      if (isListening) {
        pauseListening();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingMessageId(messageId);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        // Resume listening if it was paused
        if (isPaused) {
          setTimeout(() => {
            resumeListening();
          }, 500);
        }
      };
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        // Resume listening if it was paused
        if (isPaused) {
          setTimeout(() => {
            resumeListening();
          }, 500);
        }
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      // Resume listening if it was paused
      if (isPaused) {
        setTimeout(() => {
          resumeListening();
        }, 500);
      }
    }
  };

  const addMessage = (type, content, metadata = {}) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date(),
      ...metadata
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-speak bot responses if enabled and not currently listening
    if (type === 'bot' && speechSynthesis && selectedVoice && autoSpeakEnabled && !isListening && !isPaused) {
      // Small delay to ensure message is rendered
      setTimeout(() => {
        speakText(content, newMessage.id);
      }, 500);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addMessage('user', userMessage);
    setInputMessage('');
    setIsLoading(true);
    const api_base = import.meta.env.VITE_BACKEND_URL || "https://localhost:3001";
    try {
      const response = await fetch(`${api_base}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
          currentStep
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        addMessage('bot', data.response, {
          analysis: data.analysis,
          suggestions: data.suggestions,
          severity: data.severity
        });
        
        if (data.nextStep) {
          setCurrentStep(data.nextStep);
        }
      } else {
        addMessage('bot', 'I apologize, but I encountered an error. Please try again or consult with a healthcare professional.');
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage('bot', 'I\'m having trouble connecting to my services. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const quickActions = [
    { icon: Heart, text: 'Chest Pain', color: 'bg-red-100 hover:bg-red-200 text-red-700' },
    { icon: Activity, text: 'Fever', color: 'bg-orange-100 hover:bg-orange-200 text-orange-700' },
    { icon: Brain, text: 'Headache', color: 'bg-purple-100 hover:bg-purple-200 text-purple-700' },
    { icon: Stethoscope, text: 'Breathing Issues', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700' }
  ];

  const handleQuickAction = (actionText) => {
    setInputMessage(`I'm experiencing ${actionText.toLowerCase()}`);
    // Auto-submit if speech synthesis is available for immediate response
    if (speechSynthesis && selectedVoice) {
      setTimeout(() => {
        // Trigger send message
        const event = { key: 'Enter', shiftKey: false, preventDefault: () => {} };
        handleKeyPress(event);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  AI Health Assistant
                </h1>
                <p className="text-gray-600 text-sm">Advanced NLP-powered healthcare guidance</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">AI Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Quick Symptoms
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.text)}
                    className={`p-3 rounded-xl transition-all duration-200 flex items-center space-x-3 ${action.color}`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{action.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Health Tips */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Health Tips</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="p-3 bg-blue-50 rounded-lg">
                  💧 Drink at least 8 glasses of water daily
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  🚶‍♂️ Take a 10-minute walk after meals
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  😴 Get 7-9 hours of quality sleep
                </div>
              </div>
            </div>

                {/* Voice Controls */}
                {(speechSupported || speechSynthesis) && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Volume2 className="w-5 h-5 mr-2 text-green-500" />
                      Voice Features
                    </h3>
                    <div className="space-y-3">
                      {speechSupported && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Mic className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">Voice Input</span>
                          </div>
                          <div className={`flex items-center space-x-2`}>
                            <div className={`w-3 h-3 rounded-full ${
                              isListening ? 'bg-red-500 animate-pulse' : 
                              isPaused ? 'bg-orange-500' : 
                              'bg-green-500'
                            }`}></div>
                            <span className="text-xs text-gray-600">
                              {isListening ? 'Active' : isPaused ? 'Paused' : 'Ready'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {speechSynthesis && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Volume2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-700">Voice Output</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-gray-600">
                              {isSpeaking ? 'Speaking' : 'Ready'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Auto-speak toggle */}
                      {speechSynthesis && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Play className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-purple-700">Auto-speak responses</span>
                          </div>
                          <button
                            onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
                            className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                              autoSpeakEnabled ? 'bg-purple-500' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                              autoSpeakEnabled ? 'translate-x-6' : 'translate-x-0.5'
                            }`}></div>
                          </button>
                        </div>
                      )}
                      
                      {/* Global stop button */}
                      {(isSpeaking || isListening || isPaused) && (
                        <button
                          onClick={() => {
                            stopSpeaking();
                            stopListening();
                          }}
                          className="w-full p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          <Square className="w-4 h-4 inline mr-2" />
                          Stop All Voice Activity
                        </button>
                      )}
                    </div>
                  </div>
                )}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                          : 'bg-gradient-to-r from-green-500 to-blue-500'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block p-4 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Text-to-Speech Button for Bot Messages */}
                          {message.type === 'bot' && speechSynthesis && (
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => speakingMessageId === message.id ? stopSpeaking() : speakText(message.content, message.id)}
                                className="flex items-center space-x-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full transition-colors duration-200"
                                title={speakingMessageId === message.id ? "Stop speaking" : "Listen to response"}
                              >
                                {speakingMessageId === message.id ? (
                                  <>
                                    <Square className="w-3 h-3" />
                                    <span>Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3 h-3" />
                                    <span>Listen</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Analysis and Suggestions */}
                        {message.analysis && (
                          <div className="mt-3 space-y-2">
                            {message.severity && (
                              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(message.severity)}`}>
                                Severity: {message.severity.charAt(0).toUpperCase() + message.severity.slice(1)}
                              </div>
                            )}
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                                <p className="font-medium text-blue-800 mb-2">Recommendations:</p>
                                <ul className="space-y-1 text-blue-700">
                                  {message.suggestions.map((suggestion, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl p-4">
                        <div className="flex items-center space-x-2">
                          <Loader className="w-4 h-4 animate-spin text-gray-600" />
                          <span className="text-gray-600">Analyzing your symptoms...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-6">
                {/* Voice Recognition Status */}
                {(isListening || isPaused) && (
                  <div className="mb-4 flex items-center justify-center space-x-4">
                    {isListening && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Listening... Speak now</span>
                        <div className="flex space-x-1">
                          <div className="w-1 h-4 bg-blue-500 animate-pulse"></div>
                          <div className="w-1 h-6 bg-blue-500 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-1 h-5 bg-blue-500 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-1 h-7 bg-blue-500 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                        </div>
                      </div>
                    )}
                    
                    {isPaused && (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <Pause className="w-4 h-4" />
                        <span className="text-sm font-medium">Voice recognition paused</span>
                      </div>
                    )}
                    
                    {/* Voice Control Buttons */}
                    <div className="flex space-x-2">
                      {isListening && (
                        <button
                          onClick={pauseListening}
                          className="px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-medium transition-colors duration-200"
                          title="Pause voice recognition"
                        >
                          <Pause className="w-3 h-3 inline mr-1" />
                          Pause
                        </button>
                      )}
                      
                      {isPaused && (
                        <button
                          onClick={resumeListening}
                          disabled={isSpeaking}
                          className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                          title="Resume voice recognition"
                        >
                          <Play className="w-3 h-3 inline mr-1" />
                          Resume
                        </button>
                      )}
                      
                      <button
                        onClick={stopListening}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors duration-200"
                        title="Stop voice recognition"
                      >
                        <Square className="w-3 h-3 inline mr-1" />
                        Stop
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Describe your symptoms or ask a health question..."
                      className="w-full p-4 pr-20 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="2"
                      disabled={isLoading}
                    />
                    
                    {/* Voice Input Button */}
                    {speechSupported && (
                      <div className="absolute right-3 top-3 flex space-x-1">
                        {/* Main Voice Button */}
                        <button
                          onClick={
                            isListening ? pauseListening :
                            isPaused ? resumeListening :
                            startListening
                          }
                          disabled={isLoading || isSpeaking}
                          className={`p-2 rounded-xl transition-all duration-200 ${
                            isListening 
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                              : isPaused
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={
                            isListening ? "Pause voice input" :
                            isPaused ? "Resume voice input" :
                            "Start voice input"
                          }
                        >
                          {isListening ? (
                            <Pause className="w-4 h-4" />
                          ) : isPaused ? (
                            <Play className="w-4 h-4" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </button>
                        
                        {/* Stop Button (when listening or paused) */}
                        {(isListening || isPaused) && (
                          <button
                            onClick={stopListening}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all duration-200"
                            title="Stop voice input"
                          >
                            <MicOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim() || (isListening && !isPaused)}
                    className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Voice Features Info */}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    {speechSupported ? (
                      <div className="flex items-center space-x-1">
                        <Mic className="w-3 h-3 text-green-500" />
                        <span>Voice input available</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <MicOff className="w-3 h-3 text-gray-400" />
                        <span>Voice input not supported</span>
                      </div>
                    )}
                    
                    {speechSynthesis ? (
                      <div className="flex items-center space-x-1">
                        <Volume2 className="w-3 h-3 text-green-500" />
                        <span>Voice output available</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <VolumeX className="w-3 h-3 text-gray-400" />
                        <span>Voice output not supported</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    ⚠️ This is an AI assistant for informational purposes only. Always consult healthcare professionals for medical advice.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareChatbot;