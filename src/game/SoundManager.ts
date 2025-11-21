export class SoundManager {
    private static instance: SoundManager;
    private audioContext: AudioContext | null = null;
    private isMusicPlaying: boolean = false;

    private constructor() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio API not supported');
        }
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private createOscillator(type: OscillatorType, frequency: number, duration: number, volume: number = 0.1) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    public playAttack(type: 'melee' | 'ranged') {
        if (type === 'melee') {
            // Whoosh sound
            this.createOscillator('sawtooth', 150, 0.1, 0.1);
        } else {
            // Zap sound
            this.createOscillator('sine', 600, 0.2, 0.1);
        }
    }

    public playHit() {
        // Thud sound
        this.createOscillator('square', 100, 0.1, 0.2);
    }

    public playJump() {
        // Rising pitch
        if (!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    public startMusic() {
        if (this.isMusicPlaying) return;
        this.isMusicPlaying = true;

        const audio = new Audio('/music.mp3');
        audio.loop = true;
        audio.volume = 0.1;
        audio.play().catch(e => console.error("Audio play failed:", e));

        // Store audio element to stop it later
        (this as any).bgm = audio;
    }

    public stopMusic() {
        this.isMusicPlaying = false;
        if ((this as any).bgm) {
            ((this as any).bgm as HTMLAudioElement).pause();
            (this as any).bgm = null;
        }
    }
}
