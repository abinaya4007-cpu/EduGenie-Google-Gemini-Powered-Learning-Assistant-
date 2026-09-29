import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  ArrowRight, 
  Award, 
  Loader2, 
  BookOpen, 
  AlertCircle
} from 'lucide-react';
import { AcademicLevel, SubjectDomain, QuizAssessment, QuizQuestion } from '../types';
import { storage } from '../utils/storage';

interface QuizArenaProps {
  currentSubject: SubjectDomain;
  currentLevel: AcademicLevel;
  activeVoice: string;
  onPlayAudio: (text: string) => void;
  prefillTopic?: string;
}

export const QuizArena: React.FC<QuizArenaProps> = ({
  currentSubject,
  currentLevel,
  activeVoice,
  onPlayAudio,
  prefillTopic,
}) => {
  const [topic, setTopic] = useState(prefillTopic || '');
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizAssessment | null>(null);

  // Quiz running state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Subject quick quiz starters
  const quizStarters: Record<SubjectDomain, string[]> = {
    'Mathematics': ['Linear Algebra Vector Spaces', 'Multivariable Calculus & Gradients', 'Number Theory & Primes'],
    'Computer Science & AI': ['Transformer Architecture & Attention', 'Graph Algorithms (BFS/DFS/Dijkstra)', 'Operating Systems & Concurrency'],
    'Physics': ['Special Relativity & Spacetime', 'Quantum Mechanics Wave-Particle Duality', 'Classical Mechanics Lagrangian'],
    'Chemistry': ['Organic Reaction Mechanisms', 'Thermodynamics & Gibbs Free Energy', 'Periodic Trends & Orbitals'],
    'Biology & Medicine': ['Cellular Respiration & ATP Synthase', 'CRISPR & Gene Regulation', 'Cardiovascular Physiology'],
    'Economics & Finance': ['Macroeconomic Monetary Policy', 'Game Theory & Nash Equilibrium', 'Bond Valuation & Yield Curves'],
    'History & Humanities': ['The Scientific Revolution', 'World War II Geopolitics', 'Enlightenment Political Philosophy'],
    'General Science': ['Cosmology & The Big Bang', 'Plate Tectonics & Continental Drift', 'Climate Feedback Loops'],
  };

  const currentStarters = quizStarters[currentSubject] || quizStarters['Mathematics'];

  const handleGenerateQuiz = async (quizTopic?: string) => {
    const topicToUse = quizTopic || topic.trim();
    if (!topicToUse || isGenerating) return;

    setIsGenerating(true);
    setSelectedAnswers({});
    setRevealedQuestions({});
    setCurrentQuestionIndex(0);
    setIsQuizCompleted(false);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          subject: currentSubject,
          level: currentLevel,
          questionCount,
        }),
      });

      if (!res.ok) throw new Error('Quiz generation failed');
      const data = await res.json();

      const newQuiz: QuizAssessment = {
        id: `quiz-${Date.now()}`,
        title: data.title || `${topicToUse} Mastery Assessment`,
        overview: data.overview || `Diagnostic assessment on ${topicToUse}.`,
        difficulty: data.difficulty || currentLevel,
        questions: data.questions,
        subject: currentSubject,
        createdAt: Date.now(),
      };

      setActiveQuiz(newQuiz);
      storage.saveQuiz(newQuiz);
    } catch (err: any) {
      console.error(err);
      alert('Could not generate quiz. Please check server connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (revealedQuestions[questionIndex]) return; // already revealed

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleCheckAnswer = (questionIndex: number) => {
    setRevealedQuestions((prev) => ({
      ...prev,
      [questionIndex]: true,
    }));

    // If this is the last question, evaluate full quiz
    if (activeQuiz && questionIndex === activeQuiz.questions.length - 1) {
      evaluateFinalScore();
    }
  };

  const evaluateFinalScore = () => {
    setIsQuizCompleted(true);
    storage.incrementQuizCompleted();

    if (!activeQuiz) return;
    let correct = 0;
    activeQuiz.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctAnswerIndex) correct++;
    });

    const percent = (correct / activeQuiz.questions.length) * 100;
    if (percent >= 80) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const currentQ: QuizQuestion | undefined = activeQuiz?.questions[currentQuestionIndex];
  const isCurrentRevealed = revealedQuestions[currentQuestionIndex];
  const currentSelected = selectedAnswers[currentQuestionIndex];

  // Calculate score tally
  const correctCount = activeQuiz
    ? activeQuiz.questions.reduce((acc, q, i) => (selectedAnswers[i] === q.correctAnswerIndex ? acc + 1 : acc), 0)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Quiz Generator Input Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Interactive Quiz Arena
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {currentSubject} · {currentLevel}
          </span>
        </div>

        {/* Preset quick starters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-400">Quick Quizzes:</span>
          {currentStarters.map((starter, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTopic(starter);
                handleGenerateQuiz(starter);
              }}
              className="text-xs px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors font-medium"
            >
              {starter}
            </button>
          ))}
        </div>

        {/* Input & Question Count */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={`Enter any topic in ${currentSubject} (e.g. 'Photosynthesis', 'Bayesian Probability', 'TCP 3-Way Handshake')...`}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />

          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            aria-label="Question Count"
            className="px-3 py-2.5 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value={3}>3 Questions (Quick Check)</option>
            <option value={5}>5 Questions (Standard)</option>
            <option value={8}>8 Questions (Deep Assessment)</option>
          </select>

          <button
            onClick={() => handleGenerateQuiz()}
            disabled={isGenerating || !topic.trim()}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crafting Diagnostic Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Quiz Area */}
      {activeQuiz && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header of Active Quiz */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">{activeQuiz.title}</h3>
                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                  {activeQuiz.questions.length} Questions
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">{activeQuiz.overview}</p>
            </div>

            {/* Score tracker */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs text-stone-400 font-semibold uppercase">Score</div>
                <div className="text-base font-mono font-bold text-stone-800">
                  {correctCount} / {Object.keys(revealedQuestions).length} evaluated
                </div>
              </div>
            </div>
          </div>

          {/* Question Stepper Indicator */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {activeQuiz.questions.map((q, idx) => {
              const isRevealed = revealedQuestions[idx];
              const isSelected = selectedAnswers[idx] !== undefined;
              const isCorrect = isRevealed && selectedAnswers[idx] === q.correctAnswerIndex;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-8 min-w-[36px] px-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-indigo-600 bg-indigo-50 text-indigo-900'
                      : isRevealed
                      ? isCorrect
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                      : isSelected
                      ? 'bg-stone-200 text-stone-800'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  Q{idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question Card */}
          {currentQ && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Question Header & Voice Play */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span className="font-mono uppercase font-semibold text-indigo-600 tracking-wider">
                    Question {currentQuestionIndex + 1} of {activeQuiz.questions.length} · {currentQ.keyConcept}
                  </span>
                  <button
                    onClick={() => onPlayAudio(currentQ.question)}
                    className="flex items-center gap-1 text-stone-500 hover:text-indigo-600 text-xs transition-colors"
                    title="Listen to question"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>
                </div>

                <h4 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                  {currentQ.question}
                </h4>
              </div>

              {/* 4 Multiple Choice Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIndex) => {
                  const isSelected = currentSelected === optIndex;
                  const isCorrect = optIndex === currentQ.correctAnswerIndex;

                  let optionStyle = 'border-stone-200 hover:border-stone-300 bg-stone-50/50 text-stone-800';
                  if (isSelected && !isCurrentRevealed) {
                    optionStyle = 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600';
                  } else if (isCurrentRevealed) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-rose-500 bg-rose-50 text-rose-950 ring-1 ring-rose-500';
                    } else {
                      optionStyle = 'border-stone-200 bg-stone-50/30 text-stone-400';
                    }
                  }

                  return (
                    <div
                      key={optIndex}
                      onClick={() => handleSelectOption(currentQuestionIndex, optIndex)}
                      className={`p-4 rounded-2xl border text-sm font-medium transition-all flex items-start justify-between gap-3 cursor-pointer ${optionStyle}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-white border border-stone-300 text-stone-700 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </div>

                      {/* Revealed icon status */}
                      {isCurrentRevealed && (
                        <div className="shrink-0 pt-0.5">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-rose-600" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Check Answer / Reveal Button */}
              {!isCurrentRevealed ? (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleCheckAnswer(currentQuestionIndex)}
                    disabled={currentSelected === undefined}
                    className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <span>Check Answer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Detailed Educational Explanation & Distractor Analysis */
                <div className="space-y-4 pt-4 border-t border-stone-200 animate-in fade-in duration-200">
                  <div
                    className={`p-4 rounded-2xl border ${
                      currentSelected === currentQ.correctAnswerIndex
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5">
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                        {currentSelected === currentQ.correctAnswerIndex ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Correct! Excellent intuition.</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Not quite right. Let's understand why:</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => onPlayAudio(currentQ.explanation)}
                        className="text-stone-600 hover:text-indigo-700 text-xs flex items-center gap-1"
                        title="Listen to explanation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm leading-relaxed mt-1">
                      {currentQ.explanation}
                    </p>
                  </div>

                  {/* Why each option is wrong (Distractor Analysis) */}
                  {currentQ.distractorReasons && currentQ.distractorReasons.length > 0 && (
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                      <span className="font-bold text-stone-700 uppercase tracking-wider block">
                        Deep Distractor Analysis (Why other choices were traps):
                      </span>
                      <div className="space-y-1.5">
                        {currentQ.distractorReasons.map((reason, idx) => (
                          <div key={idx} className="text-stone-600 flex items-start gap-2">
                            <span className="font-mono font-bold text-stone-500">
                              Option {String.fromCharCode(65 + idx)}:
                            </span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation to next question */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 rounded-lg text-xs font-semibold"
                    >
                      Previous Question
                    </button>

                    {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={evaluateFinalScore}
                        className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Final Assessment Report</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Final Quiz Scorecard if finished */}
          {isQuizCompleted && (
            <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800 space-y-4 text-center animate-in zoom-in-95 duration-200">
              <Award className="w-12 h-12 text-amber-400 mx-auto" />
              <div>
                <h3 className="text-2xl font-extrabold tracking-tight">
                  Assessment Completed!
                </h3>
                <p className="text-stone-400 text-sm mt-1">
                  You scored <span className="text-white font-bold">{correctCount}</span> out of{' '}
                  <span className="text-white font-bold">{activeQuiz.questions.length}</span> (
                  {Math.round((correctCount / activeQuiz.questions.length) * 100)}%)
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedAnswers({});
                    setRevealedQuestions({});
                    setCurrentQuestionIndex(0);
                    setIsQuizCompleted(false);
                  }}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Quiz</span>
                </button>
                <button
                  onClick={() => handleGenerateQuiz()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>New Quiz on {activeQuiz.title}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
