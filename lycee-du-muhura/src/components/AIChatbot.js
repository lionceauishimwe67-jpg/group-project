import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import './AIChatbot.css';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I\'m your School Management Assistant. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // GPA calculation
    if (lowerMessage.includes('gpa') || lowerMessage.includes('calculate')) {
      return `To calculate GPA:\n\n1. Convert each grade to points:\n   A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0.0\n\n2. Multiply by course credits\n\n3. Sum all points\n\n4. Divide by total credits\n\nExample: If you have A(4.0) in Math(3cr) and B(3.0) in English(3cr):\n(4.0×3 + 3.0×3) ÷ 6 = 3.5 GPA`;
    }
    
    // Exam info
    if (lowerMessage.includes('exam') || lowerMessage.includes('test')) {
      return 'Exam Information:\n\n• Mid-term exams: Week 8\n• Final exams: Week 16\n• Registration deadline: 1 week before\n\nFor specific exam dates, check the Events page or contact your class teacher.';
    }
    
    // Grades
    if (lowerMessage.includes('grade') || lowerMessage.includes('score')) {
      return 'Grade Scale:\n\n• A: 90-100% (Excellent)\n• B: 80-89% (Good)\n• C: 70-79% (Average)\n• D: 60-69% (Pass)\n• F: Below 60% (Fail)\n\nYou can view your grades in the Student Portal.';
    }
    
    // Login help
    if (lowerMessage.includes('login') || lowerMessage.includes('password')) {
      return 'Login Help:\n\nStudent Portal:\n• Student ID: STU001\n• Password: password123\n\nTeacher Portal:\n• Username: teacher1\n• Password: teacher123\n\nAdmin:\n• Username: admin\n• Password: admin123\n\nIf you forgot your password, contact the IT department.';
    }
    
    // Contact info
    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
      return 'Contact Information:\n\n📍 Address: Kigali, Rwanda\n📞 Phone: +250 788 123 456\n✉️ Email: info@lyceedumuhura.edu.rw\n\nOffice Hours: Mon-Fri, 8:00 AM - 5:00 PM';
    }
    
    // Fees
    if (lowerMessage.includes('fee') || lowerMessage.includes('payment') || lowerMessage.includes('tuition')) {
      return 'Fee Information:\n\n• Tuition: Contact admin office\n• Payment methods: Bank transfer, Mobile money\n• Deadline: Beginning of each term\n\nFor fee structure details, visit the Admissions page.';
    }
    
    // Attendance
    if (lowerMessage.includes('attendance') || lowerMessage.includes('absent')) {
      return 'Attendance Policy:\n\n• Minimum 80% attendance required\n• Medical certificate needed for sick leave\n• Report absences to class teacher\n\nCheck your attendance in the Student Portal.';
    }
    
    // Courses
    if (lowerMessage.includes('course') || lowerMessage.includes('subject') || lowerMessage.includes('class')) {
      return 'Available Courses:\n\nSciences:\n• Mathematics\n• Physics\n• Chemistry\n• Biology\n\nArts:\n• English\n• French\n• History\n• Geography\n\nView all courses in the Academics section.';
    }
    
    // Schedule
    if (lowerMessage.includes('schedule') || lowerMessage.includes('timetable') || lowerMessage.includes('time')) {
      return 'School Schedule:\n\nMonday - Friday:\n• Morning: 7:30 AM - 12:30 PM\n• Lunch: 12:30 PM - 1:30 PM\n• Afternoon: 1:30 PM - 4:30 PM\n\nSaturday:\n• Clubs & Activities: 8:00 AM - 12:00 PM';
    }
    
    // General greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Hello! 👋 I\'m here to help with:\n\n• School information\n• GPA calculations\n• Exam schedules\n• Login help\n• Contact details\n\nWhat can I assist you with?';
    }
    
    // Thanks
    if (lowerMessage.includes('thank')) {
      return 'You\'re welcome! 😊 Feel free to ask if you need anything else.';
    }
    
    // Default response
    return `I'm not sure about that. I can help with:\n\n📚 GPA calculations\n📅 Exam schedules\n📝 Grades & scores\n🔑 Login help\n📞 Contact information\n💰 School fees\n📊 Attendance\n📖 Courses\n⏰ School schedule\n\nWhat would you like to know?`;
  };

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    
    // Simulate bot typing
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: getBotResponse(userMsg.text),
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ai-chatbot">
      {/* Chat Button */}
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <Bot size={20} />
              <span>School Assistant</span>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.type}`}
              >
                <div className="message-avatar">
                  {message.type === 'bot' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.text.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot typing">
                <div className="message-avatar">
                  <Bot size={16} />
                </div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-suggestions">
            <button onClick={() => setInputMessage('How to calculate GPA?')}>Calculate GPA</button>
            <button onClick={() => setInputMessage('When is the exam?')}>Exam schedule</button>
            <button onClick={() => setInputMessage('Login credentials')}>Login help</button>
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
            />
            <button onClick={handleSend} disabled={!inputMessage.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
