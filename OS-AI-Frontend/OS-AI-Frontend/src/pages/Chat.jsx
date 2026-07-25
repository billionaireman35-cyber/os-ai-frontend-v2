import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('general');
  const { user } = useAuth();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    try {
      const res = await api.post('/chat', { messages: newMessages, chat_id: 'chat_' + Date.now() });
      if (res.data.type === 'transaction') {
        // Handle transaction confirmation
        setMessages([...newMessages, { role: 'assistant', content: res.data.message, isTransaction: true, txData: res.data.tx_intent }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: res.data.content }]);
      }
    } catch (e) {
      console.error(e);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, an error occurred.' }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        {['general', 'coding', 'security'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium touch-target ${mode === m ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'}`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-purple-500/30' : 'glass-soft'}`}>
              {msg.content}
              {msg.isTransaction && (
                <div className="mt-2 flex gap-2">
                  <button className="bg-green-500 text-white px-4 py-1 rounded-full">Confirm</button>
                  <button className="bg-red-500 text-white px-4 py-1 rounded-full">Cancel</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask OS AI..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button onClick={sendMessage} className="bg-purple-500 text-white px-6 py-3 rounded-full touch-target">
          Send
        </button>
      </div>
    </div>
  );
}
