import { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('your-email@outlook.com');

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      const res = await axios.post('http://localhost:8000/chat', {
        user_email: email,
        message: currentInput
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to Jarvis backend. Make sure FastAPI server is running on port 8000." }]);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif', padding: 20 }}>
      <h2 style={{ textAlign: 'center' }}>🤖 Jarvis AI Assistant</h2>
      
      <div style={{ marginBottom: 15 }}>
        <label style={{ fontSize: 12, fontWeight: 'bold' }}>User Email:</label>
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="User Email"
          style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ height: 400, border: '1px solid #ccc', borderRadius: 8, padding: 15, overflowY: 'auto', background: '#f9f9f9' }}>
        {messages.length === 0 && <p style={{ color: '#888', textAlign: 'center' }}>Start chatting with Jarvis...</p>}
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left', margin: '10px 0' }}>
            <div style={{ 
              display: 'inline-block', 
              padding: '8px 12px', 
              borderRadius: 8, 
              background: m.role === 'user' ? '#007bff' : '#e9ecef', 
              color: m.role === 'user' ? '#fff' : '#000',
              maxWidth: '80%'
            }}>
              <strong>{m.role === 'user' ? 'You' : 'Jarvis'}:</strong> {m.content}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Jarvis (e.g. Schedule a meeting tomorrow at 3pm)..."
          style={{ flex: 1, padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button onClick={sendMessage} style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Send
        </button>
      </div>
    </div>
  );
}