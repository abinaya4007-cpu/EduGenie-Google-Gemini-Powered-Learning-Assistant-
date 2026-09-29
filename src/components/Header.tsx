import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Flame, Clock, Play, Pause, RotateCcw, Volume2, GraduationCap } from 'lucide-react';
import { AcademicLevel, SubjectDomain } from '../types';
import { StreakData } from '../utils/storage';

interface HeaderProps {
  currentSubject: SubjectDomain;
  onSubjectChange: (subj: SubjectDomain) => void;
  currentLevel: AcademicLevel;
  onLevelChange: (lvl: AcademicLevel) => void;
  streak: StreakData;
  activeVoice: string;
  onVoiceChange: (voice: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSubject,
  onSubjectChange,
  currentLevel,
  onLevelChange,
  streak,
  activeVoice,
  onVoiceChange,
}) => {
  // Pomodoro Focus Timer state
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Play a soft notification tone via Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } catch (e) {
        console.error(e);
      }
      if (timerMode === 'focus') {
        setTimerMode('break');
        setTimerSeconds(5 * 60);
      } else {
        setTimerMode('focus');
        setTimerSeconds(25 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, timerMode]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const subjects: SubjectDomain[] = [
    'Mathematics',
    'Computer Science & AI',
    'Physics',
    'Chemistry',
    'Biology & Medicine',
    'Economics & Finance',
    'History & Humanities',
    'General Science',
  ];

  const levels: AcademicLevel[] = [
    'Explain Like I\'m 5',
    'Middle School',
    'High School',
    'Undergraduate',
    'Graduate & Research',
  ];

  const voices = ['Kore', 'Puck', 'Zephyr', 'Fenrir', 'Charon'];

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-sm ring-1 ring-black/5">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900 font-sans">
                EduGenie
              </h1>
              <span className="text-xs text-stone-400 font-medium tracking-wide">
                by Google Gemini
              </span>
            </div>
            <p className="text-xs text-stone-500 font-normal">
              Socratic Mentor, Problem Solver & Interactive Study Studio
            </p>
          </div>
        </div>

        {/* Learning Context Controls (Domain & Academic Level) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject domain select */}
          <div className="flex items-center gap-1.5 bg-stone-100/90 rounded-lg px-2.5 py-1.5 border border-stone-200/80 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-500 font-medium">Domain:</span>
            <select
              value={currentSubject}
              onChange={(e) => onSubjectChange(e.target.value as SubjectDomain)}
              aria-label="Domain"
              className="bg-transparent text-stone-900 font-semibold focus:outline-none cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Level select */}
          <div className="flex items-center gap-1.5 bg-stone-100/90 rounded-lg px-2.5 py-1.5 border border-stone-200/80 text-xs">
            <GraduationCap className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-500 font-medium">Level:</span>
            <select
              value={currentLevel}
              onChange={(e) => onLevelChange(e.target.value as AcademicLevel)}
              aria-label="Academic Level"
              className="bg-transparent text-stone-900 font-semibold focus:outline-none cursor-pointer"
            >
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Voice selector for Gemini TTS */}
          <div className="hidden lg:flex items-center gap-1.5 bg-stone-100/90 rounded-lg px-2.5 py-1.5 border border-stone-200/80 text-xs">
            <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-stone-500 font-medium">Voice:</span>
            <select
              value={activeVoice}
              onChange={(e) => onVoiceChange(e.target.value)}
              aria-label="Voice"
              className="bg-transparent text-stone-900 font-semibold focus:outline-none cursor-pointer"
            >
              {voices.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Streak indicator */}
          <div
            title={`${streak.count} day streak! Reviewed ${streak.cardsReviewedToday} cards & completed ${streak.quizzesCompleted} quizzes.`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-900 font-semibold"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>{streak.count}d Streak</span>
          </div>

          {/* Pomodoro Focus Timer button */}
          <button
            onClick={() => setShowTimerModal(!showTimerModal)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isTimerRunning
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-stone-100 hover:bg-stone-200/70 border-stone-200 text-stone-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{formatTimer(timerSeconds)}</span>
          </button>
        </div>
      </div>

      {/* Focus Timer Dropdown Modal */}
      {showTimerModal && (
        <div className="absolute right-4 sm:right-10 top-16 w-72 bg-white rounded-xl shadow-xl border border-stone-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              {timerMode === 'focus' ? 'Deep Study Session' : 'Quick Rest Break'}
            </span>
            <span className="text-xs text-stone-400 font-medium">Pomodoro</span>
          </div>
          <div className="py-5 text-center">
            <div className="text-4xl font-extrabold text-stone-900 font-mono tracking-tight">
              {formatTimer(timerSeconds)}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {timerMode === 'focus' ? 'Zero distractions. Focus on mastery.' : 'Stand up, hydrate, and stretch.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isTimerRunning ? 'Pause' : 'Start Focus'}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(timerMode === 'focus' ? 25 * 60 : 5 * 60);
              }}
              className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
