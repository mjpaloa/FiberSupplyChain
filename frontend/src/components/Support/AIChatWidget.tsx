import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Phone, Mail, MapPin, Clock, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOOGLE_AI_API_KEY = 'AIzaSyDhqq4Nu2Lx5bYZmzLjktf4XcGnJVzzCIk';
const MAO_EMAIL = 'mao.culiram@talacogon.gov.ph';
const MAO_PHONE = '+63 912 345 6789';

const SUGGESTION_QUESTIONS = [
  'Unsaon pag-plant og abaca?',
  'Pila ang presyo sa abaca karon?',
  'Unsaon pag-register?',
  'Asa ko makakita og buyer?',
  'Kanus-a ang harvest season?',
  'Unsa ang fertilizer nga gamiton?'
];

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Kumusta! Ako ang EASY Abaca AI Assistant. Unsay akong matabangan nimo karon? 🌱',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationStep, setEscalationStep] = useState<'contact' | 'form' | 'sent'>('contact');
  const [userInfo, setUserInfo] = useState({ name: '', phone: '', location: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const lastRequestTime = useRef<number>(0);
  const MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const needsEscalation = (userMessage: string): boolean => {
    const escalationKeywords = [
      'sakit', 'disease', 'peste', 'legal', 'dokumento', 'document', 'pautang',
      'loan', 'kwarta', 'money', 'problema', 'reklamo', 'complaint', 'dispute',
      'away', 'diagnose', 'check', 'tingnan', 'himuon'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    return escalationKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are EASY Abaca AI Assistant. Respond in Bisaya (Mindanao dialect - modern, conversational, not too traditional/deep). Help with:
- Abaca farming (planting, fertilizer, harvest)
- Platform usage (registration, selling, finding buyers)
- Pricing info
- Basic troubleshooting

Keep responses friendly, short, practical. Use emoji occasionally. 

User asked: ${userMessage}

Respond in conversational Bisaya:`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200,
            }
          })
        }
      );

      const data = await response.json();
      
      // Log response for debugging
      console.log('Gemini API Response:', data);
      
      if (data.error) {
        console.error('Gemini API Error:', data.error);
        
        // Handle rate limit (429) specifically
        if (data.error.code === 429) {
          return `Pasensya, naa koy temporary limit sa AI service karon. 🙏\n\nPwede nimo:\n• Pag-antay og 20-30 segundos unya i-try pag-usab\n• O contact directly ang MAO:\n   📧 ${MAO_EMAIL}\n   📞 ${MAO_PHONE}\n\nSorry sa inconvenience!`;
        }
        
        return `Pasensya, naa koy problema sa pag-konekta sa AI service. Error: ${data.error.message || 'Unknown error'}. Pwede nimo i-contact directly ang MAO. 🙏`;
      }
      
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pasensya, wala ko kasabot sa imong pangutana. Pwede ba nimo i-rephrase o pili sa mga suggested questions sa ubos? 🙏';
    } catch (error) {
      console.error('AI API Error:', error);
      return 'Pasensya, naa koy technical problema karon. Pwede nimo i-try pag-usab o contact directly ang MAO sa ilang email ug phone number. Salamat sa imong pag-intindi! 🙏';
    }
  };

  const sendEmailToMAO = async () => {
    const conversationText = messages
      .map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`)
      .join('\n');

    const emailBody = `
FARMER SUPPORT REQUEST

Date: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}

FARMER INFORMATION:
Name: ${userInfo.name}
Contact: ${userInfo.phone}
Location: ${userInfo.location}

PROBLEM DESCRIPTION:
${conversationText}

CATEGORY: Complex Issue (AI Escalated)
PRIORITY: Medium

This request was escalated by AI Assistant because it requires MAO expert attention.
    `;

    try {
      // In production, this would send to your backend API which sends the email
      console.log('Sending email to MAO:', emailBody);
      
      // Generate ticket number
      const ticket = `TICKET-${Date.now().toString().slice(-6)}`;
      setTicketNumber(ticket);
      
      return { success: true, ticket };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, ticket: '' };
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
    setShowSuggestions(false);
    handleSendMessage(question);
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowSuggestions(false);

    // Check if escalation needed
    if (needsEscalation(textToSend)) {
      setTimeout(() => {
        const escalationMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Naintindihan ko nga kinahanglan ni og eksperto nga tabang gikan sa MAO staff. Tabangan tika nga makontak sila!',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, escalationMessage]);
        setShowEscalation(true);
        setIsLoading(false);
      }, 1000);
    } else {
      // Get AI response
      const aiResponseText = await getAIResponse(textToSend);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }
  };

  const handleEscalationYes = () => {
    setEscalationStep('form');
    const formMessage: Message = {
      id: Date.now().toString(),
      text: 'Sige! Para makontak ka sa MAO, palihug ihatag ang imong mga detalye:',
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, formMessage]);
  };

  const handleSubmitUserInfo = async () => {
    if (!userInfo.name || !userInfo.phone || !userInfo.location) {
      alert('Palihug puno-a ang tanan nga field');
      return;
    }

    const result = await sendEmailToMAO();
    
    if (result.success) {
      setEscalationStep('sent');
      const successMessage: Message = {
        id: Date.now().toString(),
        text: `✅ Nahuman na! Gipadala nako ang imong concern sa MAO.\n\nKontak-on ka nila sa ${userInfo.phone} sulod sa 24-48 oras.\n\nAng imong reference number: #${result.ticket}\n\nNaa bay laing matabangan ko nimo?`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
      setShowEscalation(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">EASY Abaca AI Assistant</h3>
              <p className="text-xs text-emerald-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Powered by Gemini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 shadow-md rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Escalation Contact Card */}
          {showEscalation && escalationStep === 'contact' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-emerald-200">
              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                MAO Contact Information
              </h4>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  <span>{MAO_EMAIL}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <span>{MAO_PHONE}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>MAO Culiram Office, Talacogon</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span>Mon-Fri, 8AM-5PM</span>
                </div>
              </div>
              <p className="text-gray-700 mb-4">Gusto ba nimo nga ipadala nako ang imong concern sa MAO karon?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleEscalationYes}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  Oo, Ipadala
                </button>
                <button
                  onClick={() => setShowEscalation(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Dili, Ako na lang
                </button>
              </div>
            </div>
          )}

          {/* User Info Form */}
          {showEscalation && escalationStep === 'form' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-emerald-200">
              <h4 className="font-bold text-lg text-gray-900 mb-4">Imong mga Detalye</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pangalan</label>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+63 912 345 6789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Farm Location</label>
                  <input
                    type="text"
                    value={userInfo.location}
                    onChange={(e) => setUserInfo({ ...userInfo, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Barangay, Municipality"
                  />
                </div>
                <button
                  onClick={handleSubmitUserInfo}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  Ipadala ang Request
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-gray-200 rounded-b-2xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Isulti ang imong pangutana..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
