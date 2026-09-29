import { FlashcardDeck, QuizAssessment, StudyPlan } from '../types';

const STORAGE_KEYS = {
  FLASHCARD_DECKS: 'edugenie_flashcard_decks',
  QUIZZES: 'edugenie_quizzes',
  STUDY_PLANS: 'edugenie_study_plans',
  STREAK_DATA: 'edugenie_streak_data',
  SETTINGS: 'edugenie_settings',
};

export interface StreakData {
  count: number;
  lastActiveDate: string; // YYYY-MM-DD
  cardsReviewedToday: number;
  quizzesCompleted: number;
  questionsSolved: number;
}

const DEFAULT_DECKS: FlashcardDeck[] = [
  {
    id: 'default-ml-101',
    title: 'Machine Learning & Transformer Foundations',
    description: 'Core intuitions behind self-attention, loss functions, and backpropagation.',
    subject: 'Computer Science & AI',
    createdAt: Date.now() - 86400000 * 2,
    cards: [
      {
        id: 'c1',
        front: 'What does Self-Attention calculate in a Transformer?',
        back: 'It computes pairwise compatibility weights between every token in a sequence, allowing each word to dynamically incorporate contextual meaning from all other words simultaneously.',
        mnemonicOrTip: 'Think of a cocktail party where everyone adjusts what they say based on how relevant everyone else in the room is to their conversation.',
        category: 'Architecture',
        state: 'learning',
      },
      {
        id: 'c2',
        front: 'Why do Transformers need Positional Encodings?',
        back: 'Self-attention is permutation-invariant: it treats order like an unordered bag of tokens. Positional encodings add trigonometric vectors so the model knows token order (e.g. "dog bit man" vs "man bit dog").',
        mnemonicOrTip: 'Without page numbers, an attention mechanism reads a shuffled book all at once.',
        category: 'Architecture',
        state: 'mastered',
      },
      {
        id: 'c3',
        front: 'What is the role of the Softmax temperature parameter (T)?',
        back: 'Higher T (> 1.0) flattens logits into a uniform distribution, producing diverse/creative samples. Lower T (< 1.0) sharpens logits, making the model more deterministic and confident in top tokens.',
        mnemonicOrTip: 'High Temperature = energetic gas molecules (chaos); Low Temperature = frozen crystals (rigidity).',
        category: 'Inference',
        state: 'new',
      },
      {
        id: 'c4',
        front: 'How does Gradient Clipping prevent exploding gradients?',
        back: 'If the Euclidean norm of the gradients vector exceeds a threshold threshold, it rescales the vector proportionally to that threshold without altering its direction.',
        mnemonicOrTip: 'A speed governor on a steep downhill slope: keeps direction unchanged, caps maximum speed.',
        category: 'Optimization',
        state: 'new',
      },
    ],
  },
  {
    id: 'default-calc-101',
    title: 'Calculus & Mathematical Intuitions',
    description: 'First principles of limits, derivatives, integrals, and Taylor series.',
    subject: 'Mathematics',
    createdAt: Date.now() - 86400000 * 4,
    cards: [
      {
        id: 'calc1',
        front: 'What is the geometric and physical meaning of the Derivative f\'(x)?',
        back: 'Geometrically, it is the slope of the tangent line to the curve at x. Physically, it is the instantaneous rate of change of f with respect to x (like instantaneous speedometer speed vs average trip speed).',
        mnemonicOrTip: 'A snapshot freeze-frame measuring change right at this single microsecond.',
        category: 'Derivatives',
        state: 'mastered',
      },
      {
        id: 'calc2',
        front: 'What is the Fundamental Theorem of Calculus in plain intuition?',
        back: 'Differentiation and Integration are inverse operations. Accumulating rates of change (integrating f\') restores the net total change between the bounds: ∫[a to b] f\'(t) dt = f(b) - f(a).',
        mnemonicOrTip: 'If you record every speedometer reading over a trip, adding them up gives your odometer change.',
        category: 'Integration',
        state: 'learning',
      },
      {
        id: 'calc3',
        front: 'Why does Euler\'s formula e^(iπ) + 1 = 0 connect 5 fundamental constants?',
        back: 'Multiplying by imaginary unit i rotates vectors 90° in the complex plane. Growing continuously at right angles produces circular motion (cos θ + i sin θ). At π radians, you rotate 180° to -1.',
        mnemonicOrTip: 'Imaginary growth is just rotation in disguise.',
        category: 'Complex Analysis',
        state: 'new',
      },
    ],
  },
];

export const storage = {
  getDecks(): FlashcardDeck[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FLASHCARD_DECKS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.FLASHCARD_DECKS, JSON.stringify(DEFAULT_DECKS));
        return DEFAULT_DECKS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_DECKS;
    }
  },

  saveDecks(decks: FlashcardDeck[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FLASHCARD_DECKS, JSON.stringify(decks));
    } catch (e) {
      console.error('Failed to save decks', e);
    }
  },

  saveDeck(deck: FlashcardDeck): void {
    const decks = this.getDecks();
    const existingIndex = decks.findIndex((d) => d.id === deck.id);
    if (existingIndex >= 0) {
      decks[existingIndex] = deck;
    } else {
      decks.unshift(deck);
    }
    this.saveDecks(decks);
  },

  deleteDeck(deckId: string): void {
    const decks = this.getDecks().filter((d) => d.id !== deckId);
    this.saveDecks(decks);
  },

  getQuizzes(): QuizAssessment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQuiz(quiz: QuizAssessment): void {
    const quizzes = this.getQuizzes();
    quizzes.unshift(quiz);
    try {
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes.slice(0, 30)));
    } catch (e) {
      console.error('Failed to save quiz', e);
    }
  },

  getStudyPlans(): StudyPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_PLANS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveStudyPlan(plan: StudyPlan): void {
    const plans = this.getStudyPlans();
    const idx = plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      plans[idx] = plan;
    } else {
      plans.unshift(plan);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(plans));
    } catch (e) {
      console.error('Failed to save study plan', e);
    }
  },

  getStreak(): StreakData {
    const today = new Date().toISOString().split('T')[0];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      if (!data) {
        return { count: 3, lastActiveDate: today, cardsReviewedToday: 12, quizzesCompleted: 2, questionsSolved: 5 };
      }
      const parsed: StreakData = JSON.parse(data);
      // Check if last active was yesterday or today
      return parsed;
    } catch {
      return { count: 1, lastActiveDate: today, cardsReviewedToday: 0, quizzesCompleted: 0, questionsSolved: 0 };
    }
  },

  incrementCardReview(): void {
    const streak = this.getStreak();
    streak.cardsReviewedToday += 1;
    this.saveStreak(streak);
  },

  incrementQuizCompleted(): void {
    const streak = this.getStreak();
    streak.quizzesCompleted += 1;
    this.saveStreak(streak);
  },

  incrementProblemSolved(): void {
    const streak = this.getStreak();
    streak.questionsSolved += 1;
    this.saveStreak(streak);
  },

  saveStreak(streak: StreakData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(streak));
    } catch (e) {
      console.error('Failed to save streak', e);
    }
  },
};
