import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Sparkles, 
  CheckSquare, 
  Square, 
  ArrowRight, 
  Loader2, 
  Clock, 
  Target, 
  Download, 
  BookOpen, 
  Lightbulb, 
  Check
} from 'lucide-react';
import { AcademicLevel, SubjectDomain, StudyPlan } from '../types';
import { storage } from '../utils/storage';

interface StudyPlannerProps {
  currentSubject: SubjectDomain;
  currentLevel: AcademicLevel;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({ currentSubject, currentLevel }) => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>('');

  // Form inputs
  const [goal, setGoal] = useState('');
  const [timeframeDays, setTimeframeDays] = useState(7);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPlan, setCopiedPlan] = useState(false);

  useEffect(() => {
    const saved = storage.getStudyPlans();
    setPlans(saved);
    if (saved.length > 0 && !activePlanId) {
      setActivePlanId(saved[0].id);
    }
  }, []);

  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          timeframeDays,
          hoursPerDay,
          currentLevel,
        }),
      });

      if (!res.ok) throw new Error('Study plan generation failed');
      const data = await res.json();

      const newPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        goal: goal.trim(),
        planTitle: data.planTitle || goal.trim(),
        strategyOverview: data.strategyOverview,
        totalEstimatedHours: data.totalEstimatedHours || timeframeDays * hoursPerDay,
        milestones: data.milestones.map((m: any) => ({
          ...m,
          completedTasks: m.tasks.map(() => false),
        })),
        retentionTips: data.retentionTips,
        createdAt: Date.now(),
      };

      const updated = [newPlan, ...plans];
      setPlans(updated);
      storage.saveStudyPlan(newPlan);
      setActivePlanId(newPlan.id);
      setGoal('');
    } catch (err: any) {
      console.error(err);
      alert('Could not generate study plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = (dayIndex: number, taskIndex: number) => {
    if (!activePlan) return;

    const updatedMilestones = activePlan.milestones.map((m, dIdx) => {
      if (dIdx !== dayIndex) return m;
      const completed = [...(m.completedTasks || m.tasks.map(() => false))];
      completed[taskIndex] = !completed[taskIndex];
      return { ...m, completedTasks: completed };
    });

    const updatedPlan = { ...activePlan, milestones: updatedMilestones };
    const updatedPlans = plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));

    setPlans(updatedPlans);
    storage.saveStudyPlan(updatedPlan);
  };

  const handleExportPlan = () => {
    if (!activePlan) return;
    const content = `# ${activePlan.planTitle}
Goal: ${activePlan.goal}
Total Estimated Commitment: ${activePlan.totalEstimatedHours} hours

## Strategy
${activePlan.strategyOverview}

## Daily Milestones
${activePlan.milestones
  .map(
    (m) => `### Day ${m.day}: ${m.focusTopic}
Objectives:
${m.learningObjectives.map((o) => ` - ${o}`).join('\n')}

Action Tasks:
${m.tasks.map((t, idx) => ` [${m.completedTasks?.[idx] ? 'x' : ' '}] ${t}`).join('\n')}

Active Recall Check:
> ${m.activeRecallPrompt}
`
  )
  .join('\n\n')}

## Evidence-Based Retention Tips
${activePlan.retentionTips.map((tip) => `- ${tip}`).join('\n')}
`;

    navigator.clipboard.writeText(content);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2000);
  };

  // Calculate overall task progress
  const totalTasks = activePlan?.milestones.reduce((acc, m) => acc + m.tasks.length, 0) || 0;
  const completedTasksCount =
    activePlan?.milestones.reduce(
      (acc, m) => acc + (m.completedTasks?.filter(Boolean).length || 0),
      0
    ) || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Plan Generator Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Personalized Study Sprint & Syllabus Roadmap
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {currentSubject} · {currentLevel}
          </span>
        </div>

        <p className="text-xs text-stone-500">
          EduGenie generates evidence-based study schedules calibrated with spaced repetition, active retrieval prompts, and actionable daily sprints.
        </p>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Your Learning Goal or Target Exam:
            </label>
            <input
              type="text"
              placeholder="e.g. 'Master Transformer models and Attention mechanisms for technical interviews' or 'Prepare for Calculus 2 final exam'..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Study Timeframe:
              </label>
              <select
                value={timeframeDays}
                onChange={(e) => setTimeframeDays(Number(e.target.value))}
                aria-label="Study Timeframe"
                className="w-full px-3 py-2 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value={3}>3 Days (Crash Course)</option>
                <option value={7}>7 Days (Intensive Sprint)</option>
                <option value={14}>14 Days (Comprehensive Mastery)</option>
                <option value={30}>30 Days (Full Semester Track)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Daily Study Commitment:
              </label>
              <select
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                aria-label="Daily Study Commitment"
                className="w-full px-3 py-2 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value={1}>1 hour / day</option>
                <option value={2}>2 hours / day</option>
                <option value={3}>3 hours / day</option>
                <option value={4}>4+ hours / day</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isGenerating || !goal.trim()}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Study Roadmap...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Build Study Roadmap</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Plan Roadmap */}
      {activePlan && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Plan Header Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <span className="text-[11px] font-mono text-indigo-700 uppercase tracking-wider font-semibold">
                  Study Sprint Roadmap
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-0.5">
                  {activePlan.planTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPlan}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Copy full study roadmap as markdown"
                >
                  {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{copiedPlan ? 'Copied' : 'Export Plan'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {activePlan.strategyOverview}
            </p>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">Sprint Task Completion:</span>
                <span className="font-mono text-stone-600">
                  {completedTasksCount} of {totalTasks} tasks ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily Milestones List */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Daily Milestones & Retrieval Prompts</span>
            </h4>

            <div className="space-y-4">
              {activePlan.milestones.map((milestone, dIdx) => (
                <div
                  key={milestone.day}
                  className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4"
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-bold font-mono text-xs flex items-center justify-center">
                        D{milestone.day}
                      </span>
                      <div>
                        <h5 className="text-sm font-bold text-stone-900">{milestone.focusTopic}</h5>
                      </div>
                    </div>
                  </div>

                  {/* Objectives */}
                  {milestone.learningObjectives && milestone.learningObjectives.length > 0 && (
                    <div className="text-xs text-stone-600 space-y-1">
                      <span className="font-semibold text-stone-700 block">Learning Objectives:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-600 pl-1">
                        {milestone.learningObjectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tasks with interactive checkboxes */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-stone-700 block">Action Tasks:</span>
                    <div className="space-y-1.5">
                      {milestone.tasks.map((task, tIdx) => {
                        const isDone = milestone.completedTasks?.[tIdx];
                        return (
                          <div
                            key={tIdx}
                            onClick={() => handleToggleTask(dIdx, tIdx)}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition-colors ${
                              isDone
                                ? 'bg-emerald-50/60 border-emerald-200 text-stone-400 line-through'
                                : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100'
                            }`}
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-400 shrink-0" />
                            )}
                            <span className="leading-snug">{task}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Recall Prompt */}
                  {milestone.activeRecallPrompt && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-900">Active Retrieval Check: </span>
                        <span>{milestone.activeRecallPrompt}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Retention Tips Card */}
          {activePlan.retentionTips && activePlan.retentionTips.length > 0 && (
            <div className="bg-stone-900 text-stone-200 rounded-2xl p-5 border border-stone-800 space-y-2.5 text-xs">
              <span className="font-mono text-amber-400 uppercase tracking-wider font-bold block">
                Evidence-Based Study Strategy Guidelines:
              </span>
              <ul className="space-y-1.5 leading-relaxed">
                {activePlan.retentionTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
