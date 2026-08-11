import React, { useState, useEffect, useRef } from 'react';
import './ai-chat-interface_App.css';

const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a Python script to scrape a webpage",
  "How do React 18 Concurrent features work?",
  "Draft a professional email asking for project extension"
];

const MOCK_RESPONSES = {
  quantum: "Quantum computing utilizes qubits that exist in superpositions. Unlike classical binary bits (0 or 1), a qubit can represent 0, 1, or any quantum proportion of both simultaneously, granting exponential parallel processing speed for specific cryptographic and simulation algorithms.",
  python: "Here is a clean Python script using `requests` and `BeautifulSoup`:\n\n```python\nimport requests\nfrom bs4 import BeautifulSoup\n\nurl = 'https://news.ycombinator.com'\nresponse = requests.get(url)\nsoup = BeautifulSoup(response.text, 'html.parser')
\nfor item in soup.select('.titleline > a'):\n    print(item.text)\n```",
  react: "React 18 introduces concurrent rendering, allowing React to pause, resume, or abandon rendering updates. Key features include `useTransition` for non-urgent state updates, `useDeferredValue`, and automatic batching.",
  default: "I am your AI assistant! I can assist you with software engineering, architecture, code generation, refactoring, and creative technical problem solving. How can I help you today?"
};

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_chat_history');
      return saved ? JSON.parse(saved) : [
        {
          id: 'm1',
          sender: 'ai',
          text: 'Hello! I am your AI assistant. How can I help you build or design today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    } catch (e) {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('ai_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAiResponseText = (prompt) => {
    const p = prompt.toLowerCase();
    if (p.includes('quantum')) return MOCK_RESPONSES.quantum;
    if (p.includes('python') || p.includes('script') || p.includes('scrape')) return MOCK_RESPONSES.python;
    if (p.includes('react')) return MOCK_RESPONSES.react;
    return MOCK_RESPONSES.default;
  };

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || isGenerating) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsGenerating(true);

    const fullText = getAiResponseText(query);
    const aiMsgId = (Date.now() + 1).toString();

    // Create empty AI response placeholder
    const aiMsg = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, aiMsg]);

    let charIndex = 0;
    timerRef.current = setInterval(() => {
      if (charIndex < fullText.length) {
        const nextChunk = fullText.slice(0, charIndex + 3);
        charIndex += 3;
        setMessages(prev =>
          prev.map(m => m.id === aiMsgId ? { ...m, text: nextChunk } : m)
        );
      } else {
        clearInterval(timerRef.current);
        setIsGenerating(false);
      }
    }, 25);
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all chat conversation history?')) {
      handleStop();
      setMessages([]);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="ai-app">
      {/* Top Header */}
      <header className="ai-header">
        <div className="ai-brand">
          <span className="ai-logo-icon">🤖</span>
          <div>
            <h1>Nexus AI Assistant</h1>
            <span className="ai-status">● Online (GPT-4o Stream Simulator)</span>
          </div>
        </div>

        <button className="ai-btn-clear" onClick={handleClear}>🗑️ Clear Chat</button>
      </header>

      {/* Chat Messages Body */}
      <main className="ai-chat-body">
        {messages.length === 0 ? (
          <div className="ai-welcome">
            <h2>What would you like to explore today?</h2>
            <div className="ai-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="ai-sug-card" onClick={() => handleSend(s)}>
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-msg-row ${msg.sender}`}>
                <div className="ai-msg-avatar">
                  {msg.sender === 'user' ? '👤' : '🤖'}
                </div>
                <div className="ai-msg-content">
                  <div className="ai-msg-header">
                    <span className="ai-msg-sender-name">{msg.sender === 'user' ? 'You' : 'Nexus AI'}</span>
                    <span className="ai-msg-time">{msg.timestamp}</span>
                  </div>
                  <div className="ai-msg-text">
                    {msg.text ? (
                      <pre className="ai-pre">{msg.text}</pre>
                    ) : (
                      <span className="ai-typing-dots">Thinking<span>.</span><span>.</span><span>.</span></span>
                    )}
                  </div>
                  {msg.sender === 'ai' && msg.text && (
                    <button
                      className="ai-btn-copy"
                      onClick={() => handleCopy(msg.text, msg.id)}
                    >
                      {copiedId === msg.id ? '✓ Copied' : '📋 Copy'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </main>

      {/* Input Bottom Bar */}
      <footer className="ai-footer">
        {isGenerating && (
          <div className="ai-stop-bar">
            <button className="ai-btn-stop" onClick={handleStop}>⏹ Stop Generation</button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="ai-input-form"
        >
          <input
            type="text"
            placeholder="Type your message or prompt..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            className="ai-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="ai-btn-send"
          >
            Send ➔
          </button>
        </form>
      </footer>
    </div>
  );
}
