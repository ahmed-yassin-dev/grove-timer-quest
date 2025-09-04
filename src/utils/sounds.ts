// Sound utilities for pomodoro timer events
export const createAudioTone = (frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Fade in and out to avoid clicks
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration - 0.01);

    oscillator.start(now);
    oscillator.stop(now + duration);

    return Promise.resolve();
  } catch (error) {
    console.warn('Audio not available:', error);
    return Promise.resolve();
  }
};

// Play focus session complete sound - gentle chime
export const playFocusCompleteSound = () => {
  return createAudioTone(523, 0.3) // C5 note
    .then(() => new Promise(resolve => setTimeout(resolve, 100)))
    .then(() => createAudioTone(659, 0.4)) // E5 note
    .then(() => new Promise(resolve => setTimeout(resolve, 100)))
    .then(() => createAudioTone(784, 0.5)); // G5 note
};

// Play break complete sound - energetic beep
export const playBreakCompleteSound = () => {
  return createAudioTone(440, 0.2) // A4 note
    .then(() => new Promise(resolve => setTimeout(resolve, 50)))
    .then(() => createAudioTone(440, 0.2));
};

// Play long break notification sound - triumphant melody
export const playLongBreakSound = () => {
  return createAudioTone(523, 0.3) // C5
    .then(() => new Promise(resolve => setTimeout(resolve, 100)))
    .then(() => createAudioTone(659, 0.3)) // E5
    .then(() => new Promise(resolve => setTimeout(resolve, 100)))
    .then(() => createAudioTone(784, 0.3)) // G5
    .then(() => new Promise(resolve => setTimeout(resolve, 100)))
    .then(() => createAudioTone(1047, 0.5)); // C6
};