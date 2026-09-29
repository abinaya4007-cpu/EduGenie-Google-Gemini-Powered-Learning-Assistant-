import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  HelpCircle, 
  Volume2, 
  Copy, 
  Check, 
  Compass, 
  BookOpen, 
  Lightbulb, 
  ArrowRight,
  RefreshCw,
  Loader2,
  Share2
} from 'lucide-react';
import { AcademicLevel, SubjectDomain, TutorMode, ChatMessage } from '../types';

interface SocraticTutorProps {
  currentSubject: SubjectDomain;
  currentLevel: AcademicLevel;
  activeVoice: string;
  onPlayAudio: (text: string) => void;
  onSendToQuiz: (topic: string) => void;
  onSendToFlashcard: (concept: string) => void;
}

export const SocraticTutor: React.FC<SocraticTutorProps> = ({
  currentSubject,
  currentLevel,
  activeVoice,
  onPlayAudio,
  onSendToQuiz,
  onSendToFlashcard,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to EduGenie! I am your AI learning companion powered by Google Gemini. 

How can we unlock your understanding today? You can ask me to:
- **Guide you Socratically** through a difficult concept without giving away the answer right away.
- **Deep dive** into fundamental axioms and intuitive models.
- **Test your understanding with the Feynman Technique**: explain it to me in your own words, and I'll pinpoint any gaps or jargon traps!`,
      timestamp: Date.now(),
      mode: 'socratic',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [tutorMode, setTutorMode] = useState<TutorMode>('socratic');
  const [feynmanConcept, setFeynmanConcept] = useState('');
  const [feynmanStudentExplanation, setFeynmanStudentExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Subject-specific curated starter questions
  const subjectStarterQuestions: Record<SubjectDomain, string[]> = {
    'Mathematics': [
      'Why does dividing by zero break mathematics?',
      'What is an Eigenvector geometrically?',
      'Why does negative times negative equal positive?',
      'How does Bayes\' Theorem update our beliefs with evidence?',
    ],
    'Computer Science & AI': [
      'How does backpropagation adjust neural network weights?',
      'Why is Dijkstra\'s algorithm greedy and how does it guarantee optimality?',
      'What is the difference between concurrency and parallelism?',
      'Explain how Transformer Self-Attention works step-by-step.',
    ],
    'Physics': [
      'Why does time dilate as you approach the speed of light?',
      'What does Heisenberg\'s Uncertainty Principle actually mean?',
      'Explain Entropy and the Arrow of Time intuitively.',
      'How does electromagnetic induction generate electricity?',
    ],
    'Chemistry': [
      'Why do chemical bonds form in terms of potential energy?',
      'What is the difference between SN1 and SN2 reaction mechanisms?',
      'Explain Le Chatelier\'s Principle with everyday analogies.',
      'Why is water\'s hydrogen bonding unique and vital to life?',
    ],
    'Biology & Medicine': [
      'How do mRNA vaccines teach the immune system without disease?',
      'Explain the sodium-potassium pump action in neuron firing.',
      'What is CRISPR-Cas9 and how does it cut DNA specifically?',
      'Why does natural selection require variation and selection pressure?',
    ],
    'Economics & Finance': [
      'How do central bank interest rates ripple through inflation and jobs?',
      'What is Comparative Advantage and why does trade benefit both sides?',
      'Explain Nash Equilibrium with the classic Prisoner\'s Dilemma.',
      'How does liquidity risk differ from solvency risk in banking?',
    ],
    'History & Humanities': [
      'What were the deep structural causes behind World War I?',
      'How did the printing press transform the European Renaissance?',
      'Explain Plato\'s Allegory of the Cave and its epistemology.',
      'What led to the collapse of the Roman Republic into an Empire?',
    ],
    'General Science': [
      'How do scientists know the age of the Earth and the Universe?',
      'Why is the sky blue during the day and red at sunset?',
      'Explain the scientific method vs confirmation bias.',
      'How do greenhouse gases trap thermal radiation in the atmosphere?',
    ],
  };

  const currentStarters = subjectStarterQuestions[currentSubject] || subjectStarterQuestions['Mathematics'];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      mode: tutorMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Prepare payload for /api/chat
      const conversationPayload = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationPayload,
          level: currentLevel,
          subject: currentSubject,
          mode: tutorMode,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response returned.',
        timestamp: Date.now(),
        mode: tutorMode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Apologies, I encountered a temporary connection glitch while consulting the learning core. Please check your network or try again in a moment.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeynmanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feynmanConcept.trim() || !feynmanStudentExplanation.trim() || isLoading) return;

    const formattedPrompt = `[FEYNMAN TECHNIQUE EVALUATION REQUEST]
Target Concept: "${feynmanConcept}"
My Explanation:
"${feynmanStudentExplanation}"

Please review my explanation using the Feynman technique. Did I use jargon? What was clear? Where are my conceptual blind spots?`;

    await handleSendMessage(formattedPrompt);
    setFeynmanStudentExplanation('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTtsPlayback = async (id: string, text: string) => {
    setAudioLoadingId(id);
    try {
      await onPlayAudio(text);
    } finally {
      setAudioLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
      {/* Top Learning Mode Segmented Bar */}
      <div className="border-b border-stone-200 px-4 py-3 bg-stone-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-xl">
          <button
            onClick={() => setTutorMode('socratic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tutorMode === 'socratic'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            Socratic Guidance
          </button>

          <button
            onClick={() => setTutorMode('deep_dive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tutorMode === 'deep_dive'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            Conceptual Deep Dive
          </button>

          <button
            onClick={() => setTutorMode('feynman')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tutorMode === 'feynman'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            Feynman Technique
          </button>

          <button
            onClick={() => setTutorMode('analogies')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tutorMode === 'analogies'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Analogy Architect
          </button>
        </div>

        {/* Clear chat button */}
        <button
          onClick={() => {
            if (confirm('Clear current dialogue session?')) {
              setMessages([
                {
                  id: 'welcome-reset',
                  role: 'assistant',
                  content: `Dialogue cleared. I am ready to guide your learning in **${currentSubject}** (${currentLevel}). What shall we explore?`,
                  timestamp: Date.now(),
                  mode: tutorMode,
                },
              ]);
            }
          }}
          className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors px-2 py-1"
        >
          <RefreshCw className="w-3 h-3" />
          Clear Dialogue
        </button>
      </div>

      {/* Feynman Mode Helper Banner if active */}
      {tutorMode === 'feynman' && (
        <div className="bg-amber-50/70 border-b border-amber-200/60 p-3 px-4 text-xs text-amber-900 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">The Feynman Technique Principle:</span> Richard Feynman taught that if you cannot explain a concept to a curious 10-year-old in simple, jargon-free words, you don't truly understand it yet. Enter your explanation below and EduGenie will test your conceptual integrity!
          </div>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[11px] text-stone-400 font-medium px-1">
                <span>{isAssistant ? 'EduGenie' : 'You'}</span>
                <span>·</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.mode && isAssistant && (
                  <>
                    <span>·</span>
                    <span className="capitalize text-stone-500 font-semibold">{msg.mode.replace('_', ' ')}</span>
                  </>
                )}
              </div>

              <div
                className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed transition-all ${
                  isAssistant
                    ? 'bg-stone-50 border border-stone-200/90 text-stone-800 shadow-sm'
                    : 'bg-indigo-600 text-white shadow-sm'
                }`}
              >
                {/* Formatted message content */}
                <div className="prose prose-stone max-w-none text-inherit leading-relaxed space-y-2 whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Assistant actions: Listen, Copy, Quiz Me, Flashcards */}
                {isAssistant && msg.id !== 'welcome' && (
                  <div className="mt-4 pt-3 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTtsPlayback(msg.id, msg.content)}
                        disabled={audioLoadingId === msg.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-200/60 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                        title="Listen to this explanation with Gemini 3.8 Flash Lite TTS"
                      >
                        {audioLoadingId === msg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>Listen ({activeVoice})</span>
                      </button>

                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-stone-200/60 text-stone-600 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Bridge to Quiz and Flashcards */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSendToQuiz(msg.content.slice(0, 100))}
                        className="text-stone-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1"
                        title="Generate Quiz from this dialogue"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Quiz Me</span>
                      </button>
                      <span className="text-stone-300">·</span>
                      <button
                        onClick={() => onSendToFlashcard(msg.content.slice(0, 100))}
                        className="text-stone-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1"
                        title="Turn into Flashcards"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Make Flashcards</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex flex-col items-start animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-1 text-[11px] text-stone-400 font-medium px-1">
              <span>EduGenie</span>
              <span>·</span>
              <span>Reasoning with Gemini...</span>
            </div>
            <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 sm:p-5 flex items-center gap-3 text-stone-600 text-sm shadow-sm">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-stone-500 font-medium text-xs">
                {tutorMode === 'socratic'
                  ? 'Formulating pedagogical question...'
                  : tutorMode === 'feynman'
                  ? 'Analyzing conceptual understanding and jargon...'
                  : tutorMode === 'analogies'
                  ? 'Synthesizing real-world analogies...'
                  : 'Synthesizing conceptual deep dive...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Inquiries (Starter prompts) */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-stone-50/50 border-t border-stone-100">
          <div className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Suggested {currentSubject} inquiries:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentStarters.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs text-left bg-white hover:bg-stone-100 text-stone-700 px-3 py-1 rounded-lg border border-stone-200 transition-colors shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-stone-200 p-3 sm:p-4 bg-white">
        {tutorMode === 'feynman' ? (
          /* Feynman specific two-box form */
          <form onSubmit={handleFeynmanSubmit} className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Target Concept (e.g. Backpropagation, Special Relativity, Photosynthesis)..."
                value={feynmanConcept}
                onChange={(e) => setFeynmanConcept(e.target.value)}
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Now explain it in your own words as if explaining to a curious 10-year-old..."
                value={feynmanStudentExplanation}
                onChange={(e) => setFeynmanStudentExplanation(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none pr-24"
              />
              <button
                type="submit"
                disabled={isLoading || !feynmanConcept.trim() || !feynmanStudentExplanation.trim()}
                className="absolute right-2.5 bottom-3.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Evaluate</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        ) : (
          /* Standard interactive chat input */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={
                tutorMode === 'socratic'
                  ? `Ask EduGenie about ${currentSubject}... (I will guide you step-by-step)`
                  : tutorMode === 'analogies'
                  ? `Enter a concept in ${currentSubject} to generate 3 vivid real-world analogies...`
                  : `Ask any question in ${currentSubject} for a deep dive...`
              }
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
