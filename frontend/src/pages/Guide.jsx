import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import client from '../services/api';

const SUGGESTED = [
  'Why is this my next step?',
  'Can I skip this module?',
  'What should I practice today?',
  'Why do I need this skill?',
  'How long will my route take?',
];

const MOCK_RESPONSES = {
  'Why is this my next step?': "Your next step is chosen based on your current skill proficiency and prerequisites. Completing prerequisite skills is necessary before moving to downstream advanced modules.",
  'Can I skip this module?': "Skipping prerequisite modules is not recommended because subsequent stages build directly on these foundations.",
  'What should I practice today?': "Focus on your current route milestone and hands-on projects associated with your current stage.",
  'Why do I need this skill?': "This skill bridges your current skill profile with the target career competencies required by industry standards.",
};

export default function Guide() {
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to RouteMaster Guide. I can answer questions about your personalized learning route, skill prerequisites, and recommended resources. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setErrorBanner(null);
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await client.post('/ai-guide/chat', {
        message: msg,
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((m) => [...m, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 400));
        const fallback = MOCK_RESPONSES[msg] || `Based on your route profile, focus on your active stage skills to unlock the next milestone.`;
        setMessages((m) => [...m, { role: 'assistant', content: fallback }]);
      } else {
        const errMsg = err.response?.data?.detail || err.message || 'Unable to connect to AI Guide service.';
        setErrorBanner(errMsg);
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            isError: true,
            content: `Error: ${errMsg} Please try again.`,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 h-full flex flex-col">
      {isDemo && (
        <div className="mb-4 px-4 py-2 bg-[#C89B5B]/10 border border-[#C89B5B]/40 rounded-lg text-xs text-[#C89B5B]">
          DEMO MODE ACTIVE: Guide responses may use fallback simulation when backend is unreachable.
        </div>
      )}

      {errorBanner && (
        <div className="mb-4 px-4 py-2.5 bg-[#A96A5F]/10 border border-[#A96A5F]/40 rounded-lg text-xs text-[#A96A5F] flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      <div className="mb-6">
        <div className="label mb-3">AI Guide</div>
        <h1 className="font-serif text-3xl text-[#F3F0E8] mb-2">RouteMaster Guide</h1>
        <p className="text-[#AAA89F]">Ask about your route, skill gaps, prerequisites, or why specific items are recommended.</p>
      </div>

      {/* Suggested questions */}
      <div className="mb-6">
        <div className="label mb-3">Suggested Questions</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 border border-[#383832] rounded-lg text-xs text-[#AAA89F] hover:text-[#F3F0E8] hover:border-[#C89B5B]/30 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 mb-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0 border ${
                  msg.isError
                    ? 'bg-[#A96A5F]/15 border-[#A96A5F]/40 text-[#A96A5F]'
                    : 'bg-[#C89B5B]/15 border-[#C89B5B]/30 text-[#C89B5B]'
                }`}
              >
                {msg.isError ? <AlertCircle size={12} /> : <Sparkles size={11} />}
              </div>
            )}
            <div
              className={`max-w-md rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#C89B5B]/10 border border-[#C89B5B]/20 text-[#F3F0E8]'
                  : msg.isError
                  ? 'bg-[#A96A5F]/10 border border-[#A96A5F]/30 text-[#A96A5F]'
                  : 'bg-[#22221E] border border-[#383832] text-[#AAA89F]'
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#C89B5B]/15 border border-[#C89B5B]/30 flex items-center justify-center">
              <Sparkles size={11} className="text-[#C89B5B]" />
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#C89B5B]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          placeholder="Ask about your route, skills, or next step..."
          className="flex-1 bg-[#171714] border border-[#383832] rounded-lg px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C89B5B] focus:outline-none"
        />
        <Button onClick={() => sendMessage()} icon={<Send size={14} />} disabled={!input.trim() || loading}>
          Send
        </Button>
      </div>
    </div>
  );
}
