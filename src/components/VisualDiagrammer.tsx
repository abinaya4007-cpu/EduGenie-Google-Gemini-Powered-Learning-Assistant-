import React, { useState } from 'react';
import { 
  Network, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  Volume2, 
  Info, 
  Share2, 
  Layers,
  ChevronRight,
  GitCommit
} from 'lucide-react';
import { AcademicLevel, SubjectDomain, ConceptDiagram, DiagramNode } from '../types';

interface VisualDiagrammerProps {
  currentSubject: SubjectDomain;
  currentLevel: AcademicLevel;
  activeVoice: string;
  onPlayAudio: (text: string) => void;
  prefillTopic?: string;
}

export const VisualDiagrammer: React.FC<VisualDiagrammerProps> = ({
  currentSubject,
  currentLevel,
  activeVoice,
  onPlayAudio,
  prefillTopic,
}) => {
  const [topic, setTopic] = useState(prefillTopic || '');
  const [diagramType, setDiagramType] = useState<'flowchart' | 'hierarchy' | 'cycle' | 'comparison'>('flowchart');
  const [isLoading, setIsLoading] = useState(false);
  const [diagram, setDiagram] = useState<ConceptDiagram | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const presets: Record<SubjectDomain, string[]> = {
    'Mathematics': ['Calculus Limits to Integrals Pipeline', 'Fourier Transform Signal Decomposition', 'Bayesian Probability Update Flow'],
    'Computer Science & AI': ['Transformer Self-Attention Mechanism', 'Git Feature Branch Rebase vs Merge', 'CPU Instruction Execution Pipeline'],
    'Physics': ['Carnot Engine Thermodynamic Cycle', 'Standard Model Elementary Particle Hierarchy', 'Special Relativity Light Clock Thought Experiment'],
    'Chemistry': ['Cellular Glycolysis to Krebs Cycle', 'Catalytic Hydrogenation Mechanism', 'Buffer Solution Equilibrium Shifts'],
    'Biology & Medicine': ['DNA Transcription & Translation Pipeline', 'Adaptive Immune Response to Viral Infection', 'Synaptic Neurotransmitter Release Cycle'],
    'Economics & Finance': ['Central Bank Quantitative Easing Transmission', 'Supply & Demand Shock Market Clearing', 'Bond Duration & Interest Rate Sensitivity'],
    'History & Humanities': ['The Columbian Exchange Ecological Web', 'Separation of Powers Constitutional Checks', 'Historical Spread of the Silk Road'],
    'General Science': ['Atmospheric Carbon Cycle & Sinks', 'Hydrological Water Cycle & Energy Transfer', 'Tectonic Plate Subduction & Volcanism'],
  };

  const currentPresets = presets[currentSubject] || presets['Computer Science & AI'];

  const handleGenerate = async (overrideTopic?: string) => {
    const t = overrideTopic || topic.trim();
    if (!t || isLoading) return;

    setIsLoading(true);
    setSelectedNodeId(null);

    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t,
          diagramType,
          subject: currentSubject,
          level: currentLevel,
        }),
      });

      if (!res.ok) throw new Error('Diagram generation failed');
      const data: ConceptDiagram = await res.json();
      setDiagram(data);
    } catch (err: any) {
      console.error(err);
      alert('Could not generate diagram model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedNode = diagram?.nodes.find((n) => n.id === selectedNodeId);

  // Find incoming & outgoing links for selected node
  const incomingLinks = diagram?.links.filter((l) => l.to === selectedNodeId) || [];
  const outgoingLinks = diagram?.links.filter((l) => l.from === selectedNodeId) || [];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'indigo':
        return 'bg-indigo-50 border-indigo-200 text-indigo-900 ring-indigo-500';
      case 'emerald':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900 ring-emerald-500';
      case 'amber':
        return 'bg-amber-50 border-amber-200 text-amber-900 ring-amber-500';
      case 'rose':
        return 'bg-rose-50 border-rose-200 text-rose-900 ring-rose-500';
      case 'sky':
      default:
        return 'bg-sky-50 border-sky-200 text-sky-900 ring-sky-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Input Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Visual Concept Architect
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {currentSubject} · {currentLevel}
          </span>
        </div>

        <p className="text-xs text-stone-500">
          Transform abstract systems, scientific cycles, and algorithmic pipelines into interactive mental models.
        </p>

        {/* Preset quick buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-400">Quick Models:</span>
          {currentPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTopic(preset);
                handleGenerate(preset);
              }}
              className="text-xs px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors font-medium"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input & Form */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={`Enter any system or process in ${currentSubject}...`}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />

          <select
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as any)}
            aria-label="Diagram Type"
            className="px-3 py-2.5 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="flowchart">Step-by-Step Flow</option>
            <option value="cycle">Feedback / Natural Cycle</option>
            <option value="hierarchy">Structural Hierarchy</option>
            <option value="comparison">System Comparison</option>
          </select>

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !topic.trim()}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Architecting Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Build Diagram</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Diagram Representation */}
      {diagram && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Title & Overview Banner */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">{diagram.diagramTitle}</h3>
                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                  {diagram.nodes.length} Components
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">{diagram.summary}</p>
            </div>

            <button
              onClick={() =>
                onPlayAudio(
                  `${diagram.diagramTitle}. Overview: ${diagram.summary}. Key components: ${diagram.nodes
                    .map((n) => n.label)
                    .join(', ')}`
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
              title="Listen to model explanation"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen ({activeVoice})</span>
            </button>
          </div>

          {/* Interactive Structural Node Map */}
          <div className="bg-stone-950 text-stone-100 rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800 space-y-6">
            <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-3">
              <span className="font-mono uppercase font-semibold text-indigo-400">
                Interactive Component Architecture
              </span>
              <span>Click any node to inspect upstream & downstream relationships</span>
            </div>

            {/* Nodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {diagram.nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isConnected =
                  selectedNodeId &&
                  (incomingLinks.some((l) => l.from === node.id) || outgoingLinks.some((l) => l.to === node.id));

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-900/60 border-indigo-400 ring-2 ring-indigo-400 shadow-lg'
                        : isConnected
                        ? 'bg-stone-800 border-indigo-500/50'
                        : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                        <span className="font-mono text-indigo-300 font-semibold">{node.group}</span>
                        {isSelected && (
                          <span className="text-[10px] text-indigo-300 uppercase font-mono bg-indigo-950 px-1.5 py-0.5 rounded">
                            Active Focus
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{node.label}</h4>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2">{node.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Click to inspect</span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Directed Links & Flow Transitions */}
            <div className="pt-4 border-t border-stone-800">
              <span className="text-xs font-mono font-semibold text-stone-400 uppercase tracking-wider block mb-3">
                Causal & Relational Transitions:
              </span>
              <div className="flex flex-wrap gap-2">
                {diagram.links.map((link, idx) => {
                  const fromNode = diagram.nodes.find((n) => n.id === link.from)?.label || link.from;
                  const toNode = diagram.nodes.find((n) => n.id === link.to)?.label || link.to;

                  const isHighlighted =
                    selectedNodeId && (link.from === selectedNodeId || link.to === selectedNodeId);

                  return (
                    <div
                      key={idx}
                      className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-colors ${
                        isHighlighted
                          ? 'bg-indigo-950 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400'
                          : 'bg-stone-900 border-stone-800 text-stone-300'
                      }`}
                    >
                      <span className="font-semibold text-white">{fromNode}</span>
                      <span className="text-[10px] font-mono text-amber-300 italic px-1">
                        —[{link.relationshipLabel}]→
                      </span>
                      <span className="font-semibold text-white">{toNode}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Focused Node Deep Inspection Panel */}
          {selectedNode && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-stone-900">
                    Component Focus: {selectedNode.label}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-xs text-stone-400 hover:text-stone-600"
                >
                  Close
                </button>
              </div>

              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {selectedNode.description}
              </p>

              {/* Upstream & Downstream influences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <span className="font-bold text-stone-600 block">Inputs & Causes (Upstream):</span>
                  {incomingLinks.length > 0 ? (
                    incomingLinks.map((l, i) => (
                      <div key={i} className="text-stone-600">
                        • Triggered by <span className="font-semibold">{diagram.nodes.find((n) => n.id === l.from)?.label}</span> via{' '}
                        <span className="italic font-mono text-indigo-600">"{l.relationshipLabel}"</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-stone-400 italic">Initiating primary entrypoint</span>
                  )}
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <span className="font-bold text-stone-600 block">Outcomes & Effects (Downstream):</span>
                  {outgoingLinks.length > 0 ? (
                    outgoingLinks.map((l, i) => (
                      <div key={i} className="text-stone-600">
                        • Leads to <span className="font-semibold">{diagram.nodes.find((n) => n.id === l.to)?.label}</span> via{' '}
                        <span className="italic font-mono text-indigo-600">"{l.relationshipLabel}"</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-stone-400 italic">Terminal outcome component</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Key Pedagogical Takeaways */}
          {diagram.keyTakeaways && diagram.keyTakeaways.length > 0 && (
            <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                Key Conceptual Axioms & Takeaways:
              </span>
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-800">
                {diagram.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0 mt-2" />
                    <span>{takeaway}</span>
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
