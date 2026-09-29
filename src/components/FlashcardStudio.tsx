import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Volume2, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  Shuffle, 
  Loader2,
  BookOpen
} from 'lucide-react';
import { AcademicLevel, SubjectDomain, Flashcard, FlashcardDeck } from '../types';
import { storage } from '../utils/storage';

interface FlashcardStudioProps {
  currentSubject: SubjectDomain;
  currentLevel: AcademicLevel;
  activeVoice: string;
  onPlayAudio: (text: string) => void;
  prefillTopic?: string;
}

export const FlashcardStudio: React.FC<FlashcardStudioProps> = ({
  currentSubject,
  currentLevel,
  activeVoice,
  onPlayAudio,
  prefillTopic,
}) => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // New deck generator state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateTopic, setGenerateTopic] = useState(prefillTopic || '');
  const [cardCount, setCardCount] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadedDecks = storage.getDecks();
    setDecks(loadedDecks);
    if (loadedDecks.length > 0 && !activeDeckId) {
      setActiveDeckId(loadedDecks[0].id);
    }
  }, []);

  useEffect(() => {
    if (prefillTopic) {
      setGenerateTopic(prefillTopic);
      setShowGenerateModal(true);
    }
  }, [prefillTopic]);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0];
  const activeCard: Flashcard | undefined = activeDeck?.cards[currentCardIndex];

  // Handle keyboard shortcuts (Space to flip, ArrowLeft/Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCardIndex, activeDeck]);

  const handleNextCard = () => {
    if (!activeDeck) return;
    setIsFlipped(false);
    if (currentCardIndex < activeDeck.cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      // Finished all cards in deck! Celebrate!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setCurrentCardIndex(0);
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const handleRateCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!activeDeck || !activeCard) return;

    let newState: 'new' | 'learning' | 'mastered' = 'learning';
    if (rating === 'easy') newState = 'mastered';
    if (rating === 'again') newState = 'new';

    const updatedCards = activeDeck.cards.map((c, i) =>
      i === currentCardIndex ? { ...c, state: newState, lastReviewed: Date.now() } : c
    );

    const updatedDeck = { ...activeDeck, cards: updatedCards };
    const updatedDecks = decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d));

    setDecks(updatedDecks);
    storage.saveDecks(updatedDecks);
    storage.incrementCardReview();

    handleNextCard();
  };

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateTopic.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicOrText: generateTopic,
          subject: currentSubject,
          level: currentLevel,
          count: cardCount,
        }),
      });

      if (!res.ok) throw new Error('Deck generation failed');
      const data = await res.json();

      const newDeck: FlashcardDeck = {
        id: `deck-${Date.now()}`,
        title: data.deckTitle || generateTopic,
        description: data.deckDescription || `AI-generated active recall deck for ${currentSubject}.`,
        subject: currentSubject,
        createdAt: Date.now(),
        cards: data.cards.map((c: any, index: number) => ({
          ...c,
          id: `card-${Date.now()}-${index}`,
          state: 'new',
        })),
      };

      const updated = [newDeck, ...decks];
      setDecks(updated);
      storage.saveDecks(updated);
      setActiveDeckId(newDeck.id);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setShowGenerateModal(false);
      setGenerateTopic('');
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate flashcard deck. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteDeck = (deckId: string) => {
    if (decks.length <= 1) {
      alert('You must have at least one deck in your library.');
      return;
    }
    if (confirm('Delete this flashcard deck?')) {
      const filtered = decks.filter((d) => d.id !== deckId);
      setDecks(filtered);
      storage.saveDecks(filtered);
      setActiveDeckId(filtered[0].id);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    if (!activeDeck) return;
    const shuffledCards = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    const updatedDeck = { ...activeDeck, cards: shuffledCards };
    const updatedDecks = decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d));
    setDecks(updatedDecks);
    storage.saveDecks(updatedDecks);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const masteredCount = activeDeck?.cards.filter((c) => c.state === 'mastered').length || 0;
  const learningCount = activeDeck?.cards.filter((c) => c.state === 'learning').length || 0;
  const newCount = activeDeck?.cards.filter((c) => c.state === 'new').length || 0;
  const totalCards = activeDeck?.cards.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header and Deck Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider shrink-0">
            Deck:
          </span>
          <select
            value={activeDeckId}
            onChange={(e) => {
              setActiveDeckId(e.target.value);
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
            aria-label="Active Deck"
            className="text-xs sm:text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer max-w-xs truncate"
          >
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} ({d.cards.length} cards)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleShuffle}
            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Shuffle Deck"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate New Deck</span>
          </button>

          {decks.length > 1 && (
            <button
              onClick={() => handleDeleteDeck(activeDeck.id)}
              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete this deck"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mastery Progress Bar */}
      {activeDeck && (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700">{activeDeck.title}</span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-emerald-700 font-semibold">{masteredCount} Mastered</span>
              <span className="text-stone-300">·</span>
              <span className="text-amber-700 font-semibold">{learningCount} Learning</span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-500">{newCount} New</span>
            </div>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${totalCards ? (masteredCount / totalCards) * 100 : 0}%` }}
              title="Mastered"
            />
            <div
              className="bg-amber-400 h-full transition-all"
              style={{ width: `${totalCards ? (learningCount / totalCards) * 100 : 0}%` }}
              title="Learning"
            />
          </div>
        </div>
      )}

      {/* The 3D Interactive Card View */}
      {activeCard ? (
        <div className="space-y-4">
          <div
            className="perspective-1000 w-full min-h-[340px] cursor-pointer select-none"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`relative w-full h-full min-h-[340px] duration-500 transform-style-preserve-3d transition-transform ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* CARD FRONT */}
              <div className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-md flex flex-col justify-between backface-hidden">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono uppercase tracking-wider font-semibold text-indigo-600">
                      {activeCard.category || 'Core Concept'}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{activeCard.state || 'New'}</span>
                  </div>
                  <span className="font-mono text-stone-400">
                    Card {currentCardIndex + 1} of {totalCards}
                  </span>
                </div>

                <div className="my-auto py-6 text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-snug">
                    {activeCard.front}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-400 pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-stone-400" />
                    <span>Click or press Space to flip</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayAudio(activeCard.front);
                    }}
                    className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-indigo-600 transition-colors"
                    title="Listen to question"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CARD BACK */}
              <div className="absolute inset-0 w-full h-full bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 p-8 sm:p-10 shadow-xl flex flex-col justify-between rotate-y-180 backface-hidden">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono uppercase tracking-wider font-semibold text-emerald-400">
                      Answer & Explanation
                    </span>
                  </div>
                  <span className="font-mono text-stone-400">
                    Card {currentCardIndex + 1} of {totalCards}
                  </span>
                </div>

                <div className="my-auto py-4 space-y-4">
                  <p className="text-base sm:text-lg font-medium text-stone-100 leading-relaxed">
                    {activeCard.back}
                  </p>

                  {/* Mnemonic / Memory Hook */}
                  {activeCard.mnemonicOrTip && (
                    <div className="p-3 bg-stone-800/80 rounded-xl border border-stone-700/60 text-xs sm:text-sm text-amber-200/90 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">Memory Hook: </span>
                        <span>{activeCard.mnemonicOrTip}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-stone-400 pt-3 border-t border-stone-800">
                  <span>Click to flip back</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayAudio(`${activeCard.back}. Memory hook: ${activeCard.mnemonicOrTip || ''}`);
                    }}
                    className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-emerald-400 transition-colors"
                    title="Listen to answer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation and Spaced Repetition Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Prev / Next buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors shadow-2xs"
                title="Previous Card (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-stone-500 font-semibold px-2">
                {currentCardIndex + 1} / {totalCards}
              </span>
              <button
                onClick={handleNextCard}
                className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
                title="Next Card (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Spaced repetition review grades */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleRateCard('again')}
                className="flex-1 sm:flex-initial px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-semibold transition-colors border border-rose-200 shadow-2xs"
                title="Review soon (1 day)"
              >
                Again (1d)
              </button>
              <button
                onClick={() => handleRateCard('hard')}
                className="flex-1 sm:flex-initial px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold transition-colors border border-amber-200 shadow-2xs"
                title="Moderate difficulty (2 days)"
              >
                Hard (2d)
              </button>
              <button
                onClick={() => handleRateCard('good')}
                className="flex-1 sm:flex-initial px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-semibold transition-colors border border-indigo-200 shadow-2xs"
                title="Understood well (4 days)"
              >
                Good (4d)
              </button>
              <button
                onClick={() => handleRateCard('easy')}
                className="flex-1 sm:flex-initial px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold transition-colors border border-emerald-200 shadow-2xs"
                title="Mastered concept (7 days)"
              >
                Easy (7d)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-lg font-bold text-stone-800">No cards in this deck</h3>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            Generate Cards with Gemini
          </button>
        </div>
      )}

      {/* Generate New Deck Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Generate Flashcard Deck
                </h3>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Topic, Chapter, or Paste Lecture Notes:
                </label>
                <textarea
                  rows={4}
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                  placeholder="e.g. 'Photosynthesis light-dependent reactions vs Calvin cycle' or paste your raw notes..."
                  className="w-full p-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Card Count:
                  </label>
                  <select
                    value={cardCount}
                    onChange={(e) => setCardCount(Number(e.target.value))}
                    aria-label="Card Count"
                    className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5 cards (Quick Sprint)</option>
                    <option value={8}>8 cards (Standard)</option>
                    <option value={12}>12 cards (Comprehensive)</option>
                  </select>
                </div>

                <div className="text-right text-xs text-stone-500 pt-4">
                  Domain: <span className="font-semibold text-stone-800">{currentSubject}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !generateTopic.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Memory Hooks...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Flashcard Deck</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
