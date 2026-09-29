import React, { useState } from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  Lightbulb, 
  Send, 
  Volume2, 
  Copy, 
  Check, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AcademicLevel, SubjectDomain, ProblemSolution } from '../types';
import { storage } from '../utils/storage';

interface ProblemSolverProps {
  currentSubject: SubjectDomain;
  currentLevel: AcademicLevel;
  activeVoice: string;
  onPlayAudio: (text: string) => void;
}

export const ProblemSolver: React.FC<ProblemSolverProps> = ({
  currentSubject,
  currentLevel,
  activeVoice,
  onPlayAudio,
}) => {
  const [problemText, setProblemText] = useState('');
  const [userAttempt, setUserAttempt] = useState('');
  const [assistanceType, setAssistanceType] = useState<'hint' | 'step_by_step' | 'verify_solution'>('hint');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [revealedHintIndex, setRevealedHintIndex] = useState(0);
  const [showFullSteps, setShowFullSteps] = useState(false);
  const [copied, setCopied] = useState(false);

  // Subject presets
  const problemPresets: Record<SubjectDomain, Array<{ title: string; text: string }>> = {
    'Mathematics': [
      {
        title: 'Calculus Optimization',
        text: 'A farmer has 1,200 meters of fencing and wants to enclose a rectangular field bordered on one side by a straight river (so no fencing is needed along the river). What dimensions maximize the enclosed area?',
      },
      {
        title: 'Probability / Bayes',
        text: 'A rare disease affects 0.1% of the population. A diagnostic test is 99% accurate (true positive rate) and has a 2% false positive rate. If a person tests positive, what is the probability they actually have the disease?',
      },
    ],
    'Computer Science & AI': [
      {
        title: 'Time Complexity Analysis',
        text: 'Given the recurrence relation T(n) = 3T(n/2) + O(n^2), determine the asymptotic time complexity using the Master Theorem.',
      },
      {
        title: 'Dynamic Programming',
        text: 'Given an array of positive integers representing coin denominations [1, 2, 5] and an amount 11, find the minimum number of coins needed to make up that amount.',
      },
    ],
    'Physics': [
      {
        title: 'Kinematics Projectile',
        text: 'A cannon fires a ball from ground level at an angle of 30° above the horizontal with an initial velocity of 40 m/s. Neglecting air resistance (g = 9.8 m/s²), calculate the maximum height and the total horizontal range.',
      },
      {
        title: 'Thermodynamics Carnot',
        text: 'A Carnot heat engine operates between a hot reservoir at 500 K and a cold reservoir at 300 K. If it absorbs 1,000 J of heat from the hot reservoir per cycle, how much net work does it perform?',
      },
    ],
    'Chemistry': [
      {
        title: 'Buffer pH Calculation',
        text: 'Calculate the pH of a buffer solution prepared by mixing 50 mL of 0.20 M acetic acid (CH3COOH, Ka = 1.8 × 10^-5) and 50 mL of 0.15 M sodium acetate (CH3COONa).',
      },
    ],
    'Biology & Medicine': [
      {
        title: 'Genetics Hardy-Weinberg',
        text: 'In a population in Hardy-Weinberg equilibrium, 9% of individuals express a recessive trait (q² = 0.09). What percentage of the population is expected to be heterozygous carriers?',
      },
    ],
    'Economics & Finance': [
      {
        title: 'Market Equilibrium & Deadweight Loss',
        text: 'Demand is given by Qd = 100 - 2P and supply by Qs = 20 + 2P. Calculate the equilibrium price and quantity. If a tax of $4 per unit is imposed on sellers, find the new market price paid by consumers.',
      },
    ],
    'History & Humanities': [
      {
        title: 'Historical Causation Analysis',
        text: 'Analyze the immediate vs underlying triggers of the 1929 Wall Street Crash. Was the collapse caused primarily by monetary policy, margin borrowing, or agricultural depression?',
      },
    ],
    'General Science': [
      {
        title: 'Orbital Mechanics & Escape Velocity',
        text: 'Derive the formula for the escape velocity of an object from Earth\'s surface starting from conservation of mechanical energy (kinetic + gravitational potential energy).',
      },
    ],
  };

  const currentPresets = problemPresets[currentSubject] || problemPresets['Mathematics'];

  const handleSolve = async (overrideProblem?: string) => {
    const text = overrideProblem || problemText.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setSolution(null);
    setRevealedHintIndex(0);
    setShowFullSteps(assistanceType === 'step_by_step');

    try {
      const res = await fetch('/api/solve-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText: text,
          subject: currentSubject,
          level: currentLevel,
          assistanceType,
          userAttempt: userAttempt.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Problem solver request failed');
      const data: ProblemSolution = await res.json();
      setSolution(data);
      storage.incrementProblemSolved();
    } catch (err: any) {
      console.error(err);
      alert('Could not solve the problem. Please verify the server connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySolution = () => {
    if (!solution) return;
    const textToCopy = `EduGenie Solution Breakdown:
Problem: ${solution.problemSummary}
Final Answer: ${solution.finalAnswer}

Steps:
${solution.steps.map((s) => `${s.stepNumber}. ${s.title}: ${s.explanation} | Formula: ${s.formulaOrCalculation}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleListenSolution = () => {
    if (!solution) return;
    const narrationText = `Here is the solution to your problem. Summary: ${solution.problemSummary}. The final answer is: ${solution.finalAnswer}. First principle used: ${solution.corePrinciples.join(', ')}. Here is step one: ${solution.steps[0]?.explanation || ''}`;
    onPlayAudio(narrationText);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Problem Input Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Step-by-Step Problem Solver
            </h2>
            <span className="text-xs text-stone-500 font-medium">
              {currentSubject} · {currentLevel}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Input a complex equation, word problem, or reasoning prompt. Choose whether you want guided hints or a full structural breakdown.
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-stone-400">Try an example:</span>
          {currentPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setProblemText(preset.text);
                handleSolve(preset.text);
              }}
              className="text-xs px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors font-medium"
            >
              {preset.title}
            </button>
          ))}
        </div>

        {/* Textarea for problem */}
        <div>
          <textarea
            rows={3}
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            placeholder="Type or paste your problem statement or equation here..."
            className="w-full p-3.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
          />
        </div>

        {/* Optional student attempt */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Your Attempt or Where You Got Stuck (Optional — helps pinpoint your mistake):
          </label>
          <input
            type="text"
            value={userAttempt}
            onChange={(e) => setUserAttempt(e.target.value)}
            placeholder="e.g. 'I set up the equation 2x + y = 1200, but I got stuck on how to relate area...'"
            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Assistance mode selection & Solve button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setAssistanceType('hint')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                assistanceType === 'hint'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
              Hints First
            </button>
            <button
              onClick={() => setAssistanceType('step_by_step')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                assistanceType === 'step_by_step'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
              Full Breakdown
            </button>
            <button
              onClick={() => setAssistanceType('verify_solution')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                assistanceType === 'verify_solution'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
              Verify My Work
            </button>
          </div>

          <button
            onClick={() => handleSolve()}
            disabled={isLoading || !problemText.trim()}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Problem...</span>
              </>
            ) : (
              <>
                <span>Solve with EduGenie</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Solution Display Area */}
      {solution && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Header summary banner */}
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-md border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                Problem Objective
              </span>
              <p className="text-sm font-medium text-stone-200">
                {solution.problemSummary}
              </p>
              {/* Core Principles */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-stone-400">Core Principles:</span>
                {solution.corePrinciples.map((cp, i) => (
                  <span key={i} className="text-xs bg-stone-800 text-stone-300 px-2.5 py-0.5 rounded-md font-mono">
                    {cp}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions: Listen & Copy */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleListenSolution}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
                title="Listen to solution with Gemini Voice"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen ({activeVoice})</span>
              </button>
              <button
                onClick={handleCopySolution}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
                title="Copy Solution"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* User Attempt Critique if applicable */}
          {solution.userAttemptFeedback && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Feedback on Your Prior Attempt:</span>
              </div>
              <p className="leading-relaxed">{solution.userAttemptFeedback}</p>
            </div>
          )}

          {/* Progressive Hint Reveal (If in Hint Mode or requested) */}
          {solution.hints && solution.hints.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Socratic Clues & Hints (Try solving before viewing the full answer!)
                  </span>
                </div>
                <span className="text-xs text-stone-500 font-mono">
                  {revealedHintIndex + 1} of {solution.hints.length} revealed
                </span>
              </div>

              <div className="space-y-2">
                {solution.hints.slice(0, revealedHintIndex + 1).map((hint, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs sm:text-sm text-stone-800 shadow-2xs animate-in fade-in"
                  >
                    <span className="font-bold text-amber-700 mr-2">Hint {idx + 1}:</span>
                    <span>{hint}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                {revealedHintIndex < solution.hints.length - 1 ? (
                  <button
                    onClick={() => setRevealedHintIndex((prev) => prev + 1)}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Reveal Next Hint ({revealedHintIndex + 2} of {solution.hints.length})
                  </button>
                ) : (
                  <span className="text-xs text-stone-500 italic">All hints unlocked.</span>
                )}

                <button
                  onClick={() => setShowFullSteps(!showFullSteps)}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                >
                  {showFullSteps ? 'Collapse Detailed Steps' : 'View Complete Step-by-Step Breakdown'}
                  {showFullSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Full Step Breakdown */}
          {showFullSteps && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Comprehensive Step Breakdown
              </h3>

              <div className="space-y-3">
                {solution.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <h4 className="text-sm font-bold text-stone-900">
                          {step.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      {step.explanation}
                    </p>

                    {/* Formula / Calculation */}
                    {step.formulaOrCalculation && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 font-mono text-xs text-indigo-900 font-medium overflow-x-auto">
                        {step.formulaOrCalculation}
                      </div>
                    )}

                    {/* Common Pitfall warning */}
                    {step.pitfallToAvoid && (
                      <div className="flex items-start gap-2 bg-rose-50/70 border border-rose-200/60 rounded-xl p-2.5 text-xs text-rose-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Common Pitfall: </span>
                          <span>{step.pitfallToAvoid}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Final Answer Banner */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 shadow-sm space-y-1 text-emerald-950">
                <span className="text-[11px] font-mono text-emerald-700 uppercase tracking-wider font-bold">
                  Definitive Final Answer
                </span>
                <div className="text-base sm:text-lg font-bold font-mono">
                  {solution.finalAnswer}
                </div>
              </div>
            </div>
          )}

          {/* Check Understanding Exercise */}
          {solution.checkUnderstandingQuestion && (
            <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Check Your Understanding Follow-Up:
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
                {solution.checkUnderstandingQuestion}
              </p>
              <p className="text-[11px] text-stone-500 italic">
                Try solving this variation in the input above or in the Socratic Tutor tab!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
