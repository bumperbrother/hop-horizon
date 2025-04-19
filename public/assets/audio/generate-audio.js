// This script generates placeholder audio files for the game
// Run this in a browser console to generate the audio files

// Function to generate a tone
function generateTone(frequency, duration, type = 'sine', volume = 0.5) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  
  // Add fade in/out to avoid clicks
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration - 0.01);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
  
  // Return a promise that resolves when the tone is finished
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(audioContext);
    }, duration * 1000);
  });
}

// Function to generate a more complex sound
async function generateSound(options) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  
  // Create an offline context for rendering
  const offlineContext = new OfflineAudioContext(
    2, // stereo
    audioContext.sampleRate * options.duration,
    audioContext.sampleRate
  );
  
  // Create a master gain for the offline context
  const offlineMasterGain = offlineContext.createGain();
  offlineMasterGain.connect(offlineContext.destination);
  
  // Add oscillators based on options
  const oscillators = [];
  
  for (const tone of options.tones) {
    const oscillator = offlineContext.createOscillator();
    const gainNode = offlineContext.createGain();
    
    oscillator.type = tone.type || 'sine';
    oscillator.frequency.setValueAtTime(tone.frequency, offlineContext.currentTime);
    
    // Apply frequency envelope if specified
    if (tone.frequencyEnvelope) {
      for (const point of tone.frequencyEnvelope) {
        oscillator.frequency.linearRampToValueAtTime(
          point.value,
          offlineContext.currentTime + point.time
        );
      }
    }
    
    // Set initial gain
    gainNode.gain.setValueAtTime(0, offlineContext.currentTime);
    
    // Apply amplitude envelope
    if (tone.amplitudeEnvelope) {
      for (const point of tone.amplitudeEnvelope) {
        gainNode.gain.linearRampToValueAtTime(
          point.value * (tone.volume || 1.0),
          offlineContext.currentTime + point.time
        );
      }
    } else {
      // Default envelope with fade in/out
      gainNode.gain.linearRampToValueAtTime(tone.volume || 1.0, offlineContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, offlineContext.currentTime + options.duration - 0.01);
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(offlineMasterGain);
    
    oscillator.start();
    oscillator.stop(offlineContext.currentTime + options.duration);
    
    oscillators.push({ oscillator, gainNode });
  }
  
  // Add noise if specified
  if (options.noise) {
    const bufferSize = offlineContext.sampleRate * options.duration;
    const noiseBuffer = offlineContext.createBuffer(1, bufferSize, offlineContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    
    // Generate noise data
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    // Create noise source
    const noiseSource = offlineContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    // Create filter if specified
    let noiseNode = noiseSource;
    
    if (options.noise.filter) {
      const filter = offlineContext.createBiquadFilter();
      filter.type = options.noise.filter.type || 'lowpass';
      filter.frequency.value = options.noise.filter.frequency || 1000;
      filter.Q.value = options.noise.filter.Q || 1;
      
      noiseSource.connect(filter);
      noiseNode = filter;
    }
    
    // Create gain node for noise
    const noiseGain = offlineContext.createGain();
    noiseGain.gain.setValueAtTime(0, offlineContext.currentTime);
    
    // Apply amplitude envelope
    if (options.noise.amplitudeEnvelope) {
      for (const point of options.noise.amplitudeEnvelope) {
        noiseGain.gain.linearRampToValueAtTime(
          point.value * (options.noise.volume || 0.3),
          offlineContext.currentTime + point.time
        );
      }
    } else {
      // Default envelope with fade in/out
      noiseGain.gain.linearRampToValueAtTime(options.noise.volume || 0.3, offlineContext.currentTime + 0.01);
      noiseGain.gain.linearRampToValueAtTime(0, offlineContext.currentTime + options.duration - 0.01);
    }
    
    noiseNode.connect(noiseGain);
    noiseGain.connect(offlineMasterGain);
    
    noiseSource.start();
    noiseSource.stop(offlineContext.currentTime + options.duration);
  }
  
  // Render audio
  const renderedBuffer = await offlineContext.startRendering();
  
  // Create a blob from the rendered buffer
  const audioData = exportWAV(renderedBuffer);
  const blob = new Blob([audioData], { type: 'audio/wav' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create an audio element to play the sound
  const audio = new Audio(url);
  
  // Create a download link
  const link = document.createElement('a');
  link.href = url;
  link.download = options.filename || 'sound.wav';
  link.textContent = `Download ${options.filename || 'sound.wav'}`;
  document.body.appendChild(link);
  
  console.log(`Generated ${options.filename || 'sound.wav'}`);
  
  return { audio, url, link };
}

// Function to export audio buffer as WAV
function exportWAV(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const buffer = audioBuffer;
  const numSamples = buffer.length;
  const dataSize = numSamples * numChannels * bytesPerSample;
  const bufferSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // size of fmt chunk
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  
  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write audio data
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += bytesPerSample;
    }
  }
  
  return arrayBuffer;
}

// Helper function to write a string to a DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generate all the audio files
async function generateAllAudio() {
  // Jump sound
  await generateSound({
    filename: 'jump.mp3',
    duration: 0.3,
    tones: [
      {
        type: 'sine',
        frequency: 400,
        volume: 0.5,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.01, value: 1 },
          { time: 0.1, value: 0.7 },
          { time: 0.3, value: 0 }
        ],
        frequencyEnvelope: [
          { time: 0, value: 400 },
          { time: 0.1, value: 600 },
          { time: 0.3, value: 500 }
        ]
      }
    ]
  });
  
  // Double jump sound
  await generateSound({
    filename: 'double-jump.mp3',
    duration: 0.4,
    tones: [
      {
        type: 'sine',
        frequency: 500,
        volume: 0.5,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.01, value: 1 },
          { time: 0.1, value: 0.7 },
          { time: 0.4, value: 0 }
        ],
        frequencyEnvelope: [
          { time: 0, value: 500 },
          { time: 0.1, value: 700 },
          { time: 0.2, value: 900 },
          { time: 0.4, value: 800 }
        ]
      },
      {
        type: 'sine',
        frequency: 700,
        volume: 0.3,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.05, value: 0.7 },
          { time: 0.2, value: 0.5 },
          { time: 0.4, value: 0 }
        ]
      }
    ]
  });
  
  // Land sound
  await generateSound({
    filename: 'land.mp3',
    duration: 0.3,
    tones: [
      {
        type: 'sine',
        frequency: 300,
        volume: 0.6,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.01, value: 1 },
          { time: 0.05, value: 0.8 },
          { time: 0.3, value: 0 }
        ],
        frequencyEnvelope: [
          { time: 0, value: 300 },
          { time: 0.05, value: 200 },
          { time: 0.3, value: 100 }
        ]
      }
    ],
    noise: {
      volume: 0.4,
      filter: {
        type: 'lowpass',
        frequency: 400
      },
      amplitudeEnvelope: [
        { time: 0, value: 0 },
        { time: 0.01, value: 1 },
        { time: 0.1, value: 0.5 },
        { time: 0.3, value: 0 }
      ]
    }
  });
  
  // Footstep sound
  await generateSound({
    filename: 'footstep.mp3',
    duration: 0.2,
    tones: [
      {
        type: 'sine',
        frequency: 200,
        volume: 0.3,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.01, value: 0.8 },
          { time: 0.05, value: 0.5 },
          { time: 0.2, value: 0 }
        ],
        frequencyEnvelope: [
          { time: 0, value: 200 },
          { time: 0.05, value: 150 },
          { time: 0.2, value: 100 }
        ]
      }
    ],
    noise: {
      volume: 0.2,
      filter: {
        type: 'lowpass',
        frequency: 300
      },
      amplitudeEnvelope: [
        { time: 0, value: 0 },
        { time: 0.01, value: 0.7 },
        { time: 0.05, value: 0.4 },
        { time: 0.2, value: 0 }
      ]
    }
  });
  
  // Checkpoint sound
  await generateSound({
    filename: 'checkpoint.mp3',
    duration: 0.8,
    tones: [
      {
        type: 'sine',
        frequency: 600,
        volume: 0.5,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.01, value: 1 },
          { time: 0.2, value: 0.7 },
          { time: 0.8, value: 0 }
        ],
        frequencyEnvelope: [
          { time: 0, value: 600 },
          { time: 0.1, value: 800 },
          { time: 0.2, value: 1000 },
          { time: 0.3, value: 1200 },
          { time: 0.8, value: 1400 }
        ]
      },
      {
        type: 'sine',
        frequency: 900,
        volume: 0.3,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.1, value: 0 },
          { time: 0.2, value: 0.7 },
          { time: 0.4, value: 0.5 },
          { time: 0.8, value: 0 }
        ]
      }
    ]
  });
  
  // Background music
  await generateSound({
    filename: 'background.mp3',
    duration: 10.0,
    tones: [
      // Bass
      {
        type: 'sine',
        frequency: 100,
        volume: 0.4,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.1, value: 0.8 },
          { time: 9.9, value: 0.8 },
          { time: 10.0, value: 0 }
        ],
        frequencyEnvelope: [
          { time: 0, value: 100 },
          { time: 2.5, value: 120 },
          { time: 5.0, value: 100 },
          { time: 7.5, value: 80 },
          { time: 10.0, value: 100 }
        ]
      },
      // Pad
      {
        type: 'sine',
        frequency: 300,
        volume: 0.2,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.5, value: 0.6 },
          { time: 9.5, value: 0.6 },
          { time: 10.0, value: 0 }
        ]
      },
      // Melody
      {
        type: 'sine',
        frequency: 400,
        volume: 0.3,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.1, value: 0.7 },
          { time: 0.5, value: 0 },
          { time: 1.0, value: 0.7 },
          { time: 1.5, value: 0 },
          { time: 2.0, value: 0.7 },
          { time: 2.5, value: 0 },
          { time: 3.0, value: 0.7 },
          { time: 3.5, value: 0 },
          { time: 4.0, value: 0.7 },
          { time: 4.5, value: 0 },
          { time: 5.0, value: 0.7 },
          { time: 5.5, value: 0 },
          { time: 6.0, value: 0.7 },
          { time: 6.5, value: 0 },
          { time: 7.0, value: 0.7 },
          { time: 7.5, value: 0 },
          { time: 8.0, value: 0.7 },
          { time: 8.5, value: 0 },
          { time: 9.0, value: 0.7 },
          { time: 9.5, value: 0 },
          { time: 10.0, value: 0 }
        ],
        frequencyEnvelope: [
          { time: 0, value: 400 },
          { time: 1.0, value: 500 },
          { time: 2.0, value: 600 },
          { time: 3.0, value: 500 },
          { time: 4.0, value: 400 },
          { time: 5.0, value: 500 },
          { time: 6.0, value: 600 },
          { time: 7.0, value: 700 },
          { time: 8.0, value: 600 },
          { time: 9.0, value: 500 },
          { time: 10.0, value: 400 }
        ]
      }
    ]
  });
  
  // Timer low warning sound
  await generateSound({
    filename: 'timer-low.mp3',
    duration: 1.0,
    tones: [
      {
        type: 'sine',
        frequency: 800,
        volume: 0.5,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.05, value: 0.8 },
          { time: 0.2, value: 0 },
          { time: 0.5, value: 0 },
          { time: 0.55, value: 0.8 },
          { time: 0.7, value: 0 },
          { time: 1.0, value: 0 }
        ]
      },
      {
        type: 'sine',
        frequency: 400,
        volume: 0.3,
        amplitudeEnvelope: [
          { time: 0, value: 0 },
          { time: 0.05, value: 0.6 },
          { time: 0.2, value: 0 },
          { time: 0.5, value: 0 },
          { time: 0.55, value: 0.6 },
          { time: 0.7, value: 0 },
          { time: 1.0, value: 0 }
        ]
      }
    ]
  });
  
  console.log('All audio files generated!');
}

// Call the function to generate all audio files
generateAllAudio();
