/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Layers, 
  HelpCircle, 
  Network, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { AcademicLevel, SubjectDomain } from './types';
import { storage, StreakData } from './utils/storage';
import { audioService } from './utils/audioPlayer';
import { Header } from './components/Header';
import { SocraticTutor } from './components/SocraticTutor';
import { ProblemSolver } from './components/ProblemSolver';
import { FlashcardStudio } from './components/FlashcardStudio';
import { QuizArena } from './components/QuizArena';
import { VisualDiagrammer } from './components/VisualDiagrammer';
import { StudyPlanner } from './components/StudyPlanner';
import { AudioNarrationBar } from './components/AudioNarrationBar';

type MainTab = 'socratic' | 'solver' | 'flashcards' | 'quiz' | 'diagram' | 'planner';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('socratic');
  const [currentSubject, setCurrentSubject] = useState<SubjectDomain>('Computer Science & AI');
  const [currentLevel, setCurrentLevel] = useState<AcademicLevel>('Undergraduate');
  const [activeVoice, setActiveVoice] = useState('Kore');
  const [streak, setStreak] = useState<StreakData>(storage.getStreak());

  // Cross-module bridge data
  const [prefillTopic, setPrefillTopic] = useState('');

  // Audio narration state
  const [currentAudioText, setCurrentAudioText] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    setStreak(storage.getStreak());
  }, [activeTab]);

  const handlePlayAudio = async (text: string) => {
    setAudioError(null);
    try {
      setCurrentAudioText(text);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: activeVoice,
        }),
      });

      if (!res.ok) {
        throw new Error(`TTS server error (${res.status})`);
      }

      const data = await res.json();
      if (data.audioBase64) {
        await audioService.playBase64Audio(data.audioBase64);
      }
    } catch (err: any) {
      console.error('Audio playback failed', err);
      setAudioError('Voice narration unavailable. Continuing with text.');
      setTimeout(() => setAudioError(null), 3500);
    }
  };

  const handleSendToQuiz = (topicSnippet: string) => {
    setPrefillTopic(topicSnippet);
    setActiveTab('quiz');
  };

  const handleSendToFlashcard = (conceptSnippet: string) => {
    setPrefillTopic(conceptSnippet);
    setActiveTab('flashcards');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Top Header & Context Controls */}
      <Header
        currentSubject={currentSubject}
        onSubjectChange={setCurrentSubject}
        currentLevel={currentLevel}
        onLevelChange={setCurrentLevel}
        streak={streak}
        activeVoice={activeVoice}
        onVoiceChange={setActiveVoice}
      />

      {/* Main Feature Tabs Navigation */}
      <nav className="border-b border-stone-200/90 bg-white sticky top-[61px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
            <button
              onClick={() => setActiveTab('socratic')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'socratic'
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Socratic Tutor</span>
            </button>

            <button
              onClick={() => setActiveTab('solver')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'solver'
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Problem Solver</span>
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Smart Flashcards</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'quiz'
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Quiz Arena</span>
            </button>

            <button
              onClick={() => setActiveTab('diagram')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'diagram'
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Visual Architect</span>
            </button>

            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'planner'
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Study Planner</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Temporary Toast Error Notification */}
      {audioError && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-stone-100 text-xs px-4 py-2 rounded-xl shadow-lg border border-stone-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Info className="w-4 h-4 text-amber-400" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'socratic' && (
          <SocraticTutor
            currentSubject={currentSubject}
            currentLevel={currentLevel}
            activeVoice={activeVoice}
            onPlayAudio={handlePlayAudio}
            onSendToQuiz={handleSendToQuiz}
            onSendToFlashcard={handleSendToFlashcard}
          />
        )}

        {activeTab === 'solver' && (
          <ProblemSolver
            currentSubject={currentSubject}
            currentLevel={currentLevel}
            activeVoice={activeVoice}
            onPlayAudio={handlePlayAudio}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardStudio
            currentSubject={currentSubject}
            currentLevel={currentLevel}
            activeVoice={activeVoice}
            onPlayAudio={handlePlayAudio}
            prefillTopic={prefillTopic}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizArena
            currentSubject={currentSubject}
            currentLevel={currentLevel}
            activeVoice={activeVoice}
            onPlayAudio={handlePlayAudio}
            prefillTopic={prefillTopic}
          />
        )}

        {activeTab === 'diagram' && (
          <VisualDiagrammer
            currentSubject={currentSubject}
            currentLevel={currentLevel}
            activeVoice={activeVoice}
            onPlayAudio={handlePlayAudio}
            prefillTopic={prefillTopic}
          />
        )}

        {activeTab === 'planner' && (
          <StudyPlanner
            currentSubject={currentSubject}
            currentLevel={currentLevel}
          />
        )}
      </main>

      {/* Floating Audio Narration Bar when voice is playing */}
      {currentAudioText && (
        <AudioNarrationBar
          currentTextSnippet={currentAudioText}
          onClose={() => setCurrentAudioText(null)}
        />
      )}

      {/* Quiet Scholarly Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-4 px-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-stone-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>EduGenie Learning Assistant</span>
            <span className="text-stone-300">·</span>
            <span>Gemini 3.8 Flash & TTS</span>
          </div>

          <div className="flex items-center gap-3 text-stone-400">
            <span>Socratic Scaffolding</span>
            <span>·</span>
            <span>Spaced Retrieval</span>
            <span>·</span>
            <span>Feynman Mastery</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
