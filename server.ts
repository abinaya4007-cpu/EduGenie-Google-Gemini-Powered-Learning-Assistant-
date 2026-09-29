import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to sanitize markdown/json responses if needed
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// 1. Socratic / Deep Dive / Feynman / Analogy Chat API
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, level = 'Undergraduate', subject = 'General', mode = 'socratic', conceptToExplain } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    let systemInstruction = `You are EduGenie, an expert pedagogical learning assistant powered by Google Gemini.
Your student's target level is: ${level}.
Subject domain: ${subject}.

Pedagogical Core Principles:
- Tone: Warm, intellectually curious, encouraging, and razor-sharp clarity.
- Format responses cleanly with readable paragraphs, subtle bolding for key terms, and bullet points where helpful.
- Avoid unnecessary jargon without explanation. Ground abstract theories into tangible intuition.`;

    if (mode === 'socratic') {
      systemInstruction += `
MODE: Socratic Mentor.
- Do NOT simply deliver the complete answer right away.
- Break down the inquiry into intuitive stages.
- Ask 1-2 thought-provoking guiding questions to prompt the student to think through the next logical step.
- Celebrate correct intuition and gently scaffold misconceptions.`;
    } else if (mode === 'feynman') {
      systemInstruction += `
MODE: Feynman Technique Coach.
- The student is attempting to explain a concept in their own simple words.
- Concept: "${conceptToExplain || 'Selected topic'}".
- Analyze their explanation:
  1. What they understood accurately and intuitively.
  2. Jargon traps or vague hand-waving they relied on.
  3. Gaps or misconceptions.
  4. The "Golden Analogy": Provide a hyper-clear, relatable 2-sentence analogy a 10-year-old would immediately grasp.`;
    } else if (mode === 'analogies') {
      systemInstruction += `
MODE: Intuitive Analogies Architect.
- For the topic requested, generate 3 distinctive, vivid real-world analogies:
  1. Everyday Mechanical / Physical analogy.
  2. Biological / Natural world analogy.
  3. Social / Human dynamics analogy.
- For each, clearly explain the parallel mapping (what corresponds to what) and note where the analogy breaks down (limitations).`;
    } else {
      systemInstruction += `
MODE: Conceptual Deep Dive.
- Provide a masterclass-level breakdown: First Principles, Core Intuition, Real-World Application, Common Student Pitfalls, and a "Quick Self-Check" question.`;
    }

    // Convert messages to Gemini contents format
    // Map 'assistant' or 'model' to 'model'
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || '';
    res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate learning response.' });
  }
});

// 2. Step-by-Step Problem Solver
app.post('/api/solve-problem', async (req: Request, res: Response) => {
  try {
    const { problemText, subject = 'Mathematics', level = 'High School', assistanceType = 'step_by_step', userAttempt } = req.body;

    if (!problemText) {
      return res.status(400).json({ error: 'problemText is required.' });
    }

    const systemInstruction = `You are EduGenie's Senior Problem Solving Mentor.
You excel in breaking down complex quantitative, logical, and scientific problems for ${level} level in ${subject}.
Return pure JSON matching the requested structure.`;

    const prompt = `Problem Statement:
"${problemText}"

Student Level: ${level}
Subject: ${subject}
Assistance Type: ${assistanceType}
${userAttempt ? `Student's Prior Attempt: "${userAttempt}"` : ''}

Generate structured JSON with these exact fields:
- "problemSummary": A brief 1-sentence restatement highlighting what we are solving for and given inputs.
- "corePrinciples": Array of strings of mathematical/scientific/logical theorems or formulas needed.
- "hints": Array of 3 strings: [Hint 1: Gentle Nudge/Orientation, Hint 2: Strategic Clue/Method, Hint 3: Conceptual Reveal/Key equation].
- "steps": Array of objects: [
    {
      "stepNumber": number,
      "title": string,
      "explanation": string,
      "formulaOrCalculation": string,
      "pitfallToAvoid": string
    }
  ]
- "finalAnswer": string (concise final solution with units if applicable).
- "userAttemptFeedback": string (if userAttempt was provided, critique it constructively; otherwise empty string).
- "checkUnderstandingQuestion": string (a quick variation or conceptual check for the student to practice).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problemSummary: { type: Type.STRING },
            corePrinciples: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            hints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  formulaOrCalculation: { type: Type.STRING },
                  pitfallToAvoid: { type: Type.STRING },
                },
                required: ['stepNumber', 'title', 'explanation', 'formulaOrCalculation', 'pitfallToAvoid'],
              },
            },
            finalAnswer: { type: Type.STRING },
            userAttemptFeedback: { type: Type.STRING },
            checkUnderstandingQuestion: { type: Type.STRING },
          },
          required: ['problemSummary', 'corePrinciples', 'hints', 'steps', 'finalAnswer', 'checkUnderstandingQuestion'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
    res.json(parsed);
  } catch (error: any) {
    console.error('Solve error:', error);
    res.status(500).json({ error: error?.message || 'Failed to solve problem.' });
  }
});

// 3. Quiz Generator API
app.post('/api/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { topic, subject = 'General', level = 'Undergraduate', questionCount = 5, focusAreas } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 3), 10);

    const systemInstruction = `You are EduGenie's Diagnostic Assessment Engine.
Create high-quality, pedagogically sound multiple-choice questions that test conceptual understanding, application, and synthesis—not rote trivia.
Provide insightful explanations for why the correct answer is right AND why each distractor is incorrect.`;

    const prompt = `Generate a ${count}-question assessment on the topic: "${topic}".
Domain: ${subject}
Target Audience Level: ${level}
${focusAreas ? `Focus Areas: ${focusAreas}` : ''}

Every question MUST have:
- Exactly 4 options.
- An accurate correctAnswerIndex (0, 1, 2, or 3).
- Detailed rationale for the correct answer.
- 4 distractorReasons explaining the exact trap or misconception of each option.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overview: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  distractorReasons: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  keyConcept: { type: Type.STRING },
                },
                required: ['id', 'question', 'options', 'correctAnswerIndex', 'explanation', 'distractorReasons', 'keyConcept'],
              },
            },
          },
          required: ['title', 'overview', 'difficulty', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
    res.json(parsed);
  } catch (error: any) {
    console.error('Quiz error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate quiz.' });
  }
});

// 4. Flashcards Generator API
app.post('/api/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const { topicOrText, subject = 'General', level = 'Undergraduate', count = 8 } = req.body;

    if (!topicOrText) {
      return res.status(400).json({ error: 'topicOrText is required.' });
    }

    const cardCount = Math.min(Math.max(Number(count) || 8, 4), 16);

    const systemInstruction = `You are EduGenie's Memory Science Specialist using active recall and spaced repetition principles.
Craft punchy, high-retention flashcards. Fronts should be compelling prompts or questions; backs should be clear, memorable explanations with an optional mnemonic or visual memory hook.`;

    const prompt = `Create ${cardCount} flashcards for:
"${topicOrText}"

Subject: ${subject}
Level: ${level}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            deckDescription: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  mnemonicOrTip: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ['id', 'front', 'back', 'mnemonicOrTip', 'category'],
              },
            },
          },
          required: ['deckTitle', 'deckDescription', 'cards'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
    res.json(parsed);
  } catch (error: any) {
    console.error('Flashcards error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate flashcards.' });
  }
});

// 5. Concept Visualizer / Structural Diagram API
app.post('/api/generate-diagram', async (req: Request, res: Response) => {
  try {
    const { topic, diagramType = 'flowchart', subject = 'General', level = 'Undergraduate' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const systemInstruction = `You are EduGenie's Visual Pedagogical Architect.
Create structured conceptual diagrams and flow models to make abstract relationships crystal clear.
Output structured nodes and links, plus clean key takeaways.`;

    const prompt = `Generate a visual diagram model for topic: "${topic}" (${diagramType}).
Subject: ${subject}, Level: ${level}.
Provide:
- diagramTitle: string
- summary: string
- nodes: Array of { id: string, label: string, description: string, group: string, colorVariant: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' }
- links: Array of { from: string, to: string, relationshipLabel: string }
- keyTakeaways: Array of strings`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagramTitle: { type: Type.STRING },
            summary: { type: Type.STRING },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  group: { type: Type.STRING },
                  colorVariant: { type: Type.STRING },
                },
                required: ['id', 'label', 'description', 'group', 'colorVariant'],
              },
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                  relationshipLabel: { type: Type.STRING },
                },
                required: ['from', 'to', 'relationshipLabel'],
              },
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['diagramTitle', 'summary', 'nodes', 'links', 'keyTakeaways'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
    res.json(parsed);
  } catch (error: any) {
    console.error('Diagram error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate diagram.' });
  }
});

// 6. Text-to-Speech (Gemini 3.8 Flash Lite TTS)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    // Limit length for audio generation to keep latency crisp
    const cleanText = text.replace(/[*_#`[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);

    const validVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Warm, clear, articulation-focused educational professor',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from Gemini TTS.' });
    }

    res.json({ audioBase64: base64Audio, format: 'audio/wav' });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error?.message || 'TTS generation failed.' });
  }
});

// 7. Personalized Study Plan Generator
app.post('/api/generate-study-plan', async (req: Request, res: Response) => {
  try {
    const { goal, timeframeDays = 7, hoursPerDay = 2, currentLevel = 'Beginner' } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required.' });
    }

    const systemInstruction = `You are EduGenie's Curriculum Director and Learning Strategist.
Create an evidence-based, spaced-repetition study sprint with clear milestones, active practice sessions, and retention checkpoints.`;

    const prompt = `Create a ${timeframeDays}-day study roadmap for:
Goal: "${goal}"
Study Commitment: ${hoursPerDay} hours/day
Current Skill Level: ${currentLevel}

Structure into logical milestones, daily actionable tasks, and review checkpoints.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            strategyOverview: { type: Type.STRING },
            totalEstimatedHours: { type: Type.NUMBER },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  focusTopic: { type: Type.STRING },
                  learningObjectives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  tasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  activeRecallPrompt: { type: Type.STRING },
                },
                required: ['day', 'focusTopic', 'learningObjectives', 'tasks', 'activeRecallPrompt'],
              },
            },
            retentionTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['planTitle', 'strategyOverview', 'totalEstimatedHours', 'milestones', 'retentionTips'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
    res.json(parsed);
  } catch (error: any) {
    console.error('Study plan error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate study plan.' });
  }
});

// Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`EduGenie server listening on port ${port}`);
  });
}

startServer();
