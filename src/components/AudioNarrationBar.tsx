import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2, FastForward } from 'lucide-react';
import { audioService } from '../utils/audioPlayer';

interface AudioNarrationBarProps {
  currentTextSnippet: string;
  onClose: () => void;
}

export const AudioNarrationBar: React.FC<AudioNarrationBarProps> = ({ currentTextSnippet, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  useEffect(() => {
    const unsubscribe = audioService.subscribe((playing, curr, dur) => {
      setIsPlaying(playing);
      setCurrentTime(curr);
      if (dur > 0) setDuration(dur);
    });
    return unsubscribe;
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioService.pause();
    } else {
      audioService.resume();
    }
  };

  const handleStop = () => {
    audioService.stop();
    onClose();
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 0.85];
    const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setSpeed(nextSpeed);
    audioService.setSpeed(nextSpeed);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-2xl bg-stone-900/95 text-stone-100 backdrop-blur-md rounded-2xl p-3 px-4 shadow-2xl border border-stone-800 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">Gemini Voice Narration</span>
              <span className="text-[10px] text-stone-400 font-mono">24kHz Audio</span>
            </div>
            <p className="text-xs text-stone-300 truncate max-w-md">
              "{currentTextSnippet.slice(0, 80)}..."
            </p>
          </div>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={cycleSpeed}
            title="Adjust narration speed"
            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded text-[11px] font-mono font-medium text-stone-300 flex items-center gap-1 transition-colors"
          >
            <FastForward className="w-3 h-3" />
            {speed}x
          </button>

          <button
            onClick={handleTogglePlay}
            className="h-8 w-8 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center transition-colors shadow-sm"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={handleStop}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
            title="Stop & Close"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-500 h-full transition-all duration-150 ease-linear rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
