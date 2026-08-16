import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, HelpCircle, FileText, Zap, Compass, RefreshCw } from 'lucide-react';

export default function CenterChat({
  selectedDoc,
  level,
  onCitationClick,
  onTriggerQuiz,
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Bonjour ! Je suis votre assistant pédagogique EduMind propulsé par CrewAI. Posez-moi vos questions ou demandez un résumé sur votre document.',
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = async (questionText = null) => {
    const query = questionText || input;
    if (!query.trim() || !selectedDoc || isStreaming) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage = {
      id: assistantMessageId,
      sender: 'assistant',
      text: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    if (!questionText) setInput('');
    setIsStreaming(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/chat/ask-stream/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: selectedDoc.id,
          question: query,
          level: level,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur de réponse du serveur.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6);
            if (dataContent === '[DONE]') {
              break;
            }
            // Unescape newline markers
            const unescaped = dataContent.replace(/\\n/g, '\n');
            accumulatedText += unescaped;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, text: accumulatedText }
                  : msg
              )
            );
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                text: msg.text || 'Une erreur est survenue lors du traitement de votre question.',
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  };

  // Format response text to turn [Source X, page Y] or [Source X] into clickable pills
  const renderFormattedMessage = (text) => {
    if (!text) return null;
    const regex = /\[Source\s+(\d+)(?:,\s*page\s*(\d+))?\]/gi;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const sourceNum = match[1];
      const pageNum = match[2] ? parseInt(match[2], 10) : 1;

      parts.push(
        <button
          key={`src-${match.index}`}
          onClick={() => onCitationClick(pageNum)}
          className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 mx-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium cursor-pointer transition"
          title={`Accéder à la page ${pageNum} du PDF`}
        >
          <FileText className="w-3 h-3 text-indigo-400" />
          <span>Source {sourceNum} {match[2] ? `(p.${pageNum})` : ''}</span>
        </button>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200">
        {parts}
      </div>
    );
  };

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950/40">
      {/* Header Info */}
      <div className="px-6 py-3 border-b border-slate-800/80 glass-panel flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>Session Pédagogique RAG — Niveau</span>
          <span className="font-semibold text-indigo-300 uppercase">{level}</span>
        </div>
        {selectedDoc && (
          <div className="text-xs text-slate-400">
            Base documentaire: <span className="text-white font-medium">{selectedDoc.name}</span>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!selectedDoc ? (
          <div className="text-center py-20 px-6 max-w-md mx-auto">
            <Compass className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60 animate-bounce" />
            <h3 className="text-base font-bold text-white mb-1">Sélectionnez un document</h3>
            <p className="text-xs text-slate-400">
              Pour interroger l'Assistant Pédagogique EduMind, veuillez sélectionner un document prêt dans la colonne de gauche.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-4 border ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'glass-panel border-slate-800 text-slate-200 shadow-lg'
                }`}
              >
                {renderFormattedMessage(msg.text)}

                {/* Follow-up actions under Assistant Messages */}
                {msg.sender === 'assistant' && msg.id !== 'welcome' && !msg.isStreaming && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleSend(`Peux-tu approfondir ce point en détail ?`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-indigo-300 flex items-center gap-1.5 transition"
                    >
                      <Zap className="w-3 h-3 text-indigo-400" /> Approfondir
                    </button>

                    <button
                      onClick={() => handleSend(`Peux-tu simplifier cette explication ?`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-amber-300 flex items-center gap-1.5 transition"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" /> Simplifier
                    </button>

                    <button
                      onClick={() => onTriggerQuiz(selectedDoc.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-xs text-indigo-200 flex items-center gap-1.5 transition"
                    >
                      <HelpCircle className="w-3 h-3 text-indigo-400" /> Générer un Quiz
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-800 glass-panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!selectedDoc || isStreaming}
            placeholder={
              selectedDoc
                ? `Posez votre question sur ${selectedDoc.name}...`
                : 'Sélectionnez un document d\'abord...'
            }
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !selectedDoc || isStreaming}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {isStreaming ? (
              <RefreshCw className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
