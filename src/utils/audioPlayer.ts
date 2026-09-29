class AudioService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;
  private onStateChangeListeners: Array<(isPlaying: boolean, currentTime: number, duration: number) => void> = [];

  public async playBase64Audio(base64: string, playbackRate = 1.0): Promise<void> {
    this.stop();

    const audioUrl = `data:audio/wav;base64,${base64}`;
    this.currentUrl = audioUrl;
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackRate;
    this.currentAudio = audio;

    audio.ontimeupdate = () => {
      this.notifyListeners(true, audio.currentTime, audio.duration || 0);
    };

    audio.onended = () => {
      this.notifyListeners(false, 0, audio.duration || 0);
      this.cleanup();
    };

    audio.onerror = (e) => {
      console.error('Audio playback error', e);
      this.notifyListeners(false, 0, 0);
      this.cleanup();
    };

    await audio.play();
    this.notifyListeners(true, 0, audio.duration || 0);
  }

  public pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.notifyListeners(false, this.currentAudio.currentTime, this.currentAudio.duration || 0);
    }
  }

  public resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
      this.notifyListeners(true, this.currentAudio.currentTime, this.currentAudio.duration || 0);
    }
  }

  public setSpeed(rate: number): void {
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    }
  }

  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.notifyListeners(false, 0, 0);
    }
    this.cleanup();
  }

  public isPlaying(): boolean {
    return !!this.currentAudio && !this.currentAudio.paused;
  }

  public subscribe(callback: (isPlaying: boolean, currentTime: number, duration: number) => void): () => void {
    this.onStateChangeListeners.push(callback);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(isPlaying: boolean, currentTime: number, duration: number): void {
    for (const listener of this.onStateChangeListeners) {
      listener(isPlaying, currentTime, duration);
    }
  }

  private cleanup(): void {
    this.currentAudio = null;
    this.currentUrl = null;
  }
}

export const audioService = new AudioService();
