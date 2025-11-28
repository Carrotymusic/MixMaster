
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sliders, Zap, Volume2, RotateCcw, UploadCloud, FileAudio, AlertTriangle, Play, Pause, Headphones, Music, Download, Timer } from 'lucide-react';

const Game: React.FC = () => {
    const [step, setStep] = useState<'upload' | 'mixing' | 'processing' | 'result'>('upload');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Audio Data State
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    // State for the downloaded file
    const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);

    const [settings, setSettings] = useState({
        reverb: 30, // 0-100
        compression: 40, // 0-100
        saturation: 20, // 0-100 (Distortion)
        volume: 60, // 0-100 (Gain)
        speed: 50 // 0-100 (0.5x to 1.5x, 50 is normal)
    });

    // Loading Logic
    const loadingMessages = [
        "Symulowanie ciepła analogu...",
        "Usuwanie złych częstotliwości...",
        "Próba naprawy rytmu...",
        "Dodawanie 'Radiowej Magii'...",
        "Konsultacja z Bogami Audio...",
        "Uświadamianie sobie, że to wymaga profesjonalisty...",
        "Nakładanie 15 kompresorów...",
        "Tworzenie iluzji Dolby Atmos..."
    ];
    const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);

    // Audio Node Refs (for real-time updates)
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const dryGainNodeRef = useRef<GainNode | null>(null);
    const wetGainNodeRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const distortionRef = useRef<WaveShaperNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);

    // --- AUDIO UTILS ---

    // Create Impulse Response for Reverb
    const createImpulseResponse = (ctx: BaseAudioContext, duration: number, decay: number, reverse: boolean) => {
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        const impulse = ctx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = reverse ? length - i : i;
            // Simple noise impulse with decay
            left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        }
        return impulse;
    };

    // Create Distortion Curve for Saturation
    const makeDistortionCurve = (amount: number) => {
        const k = amount; // amount usually 0-100, we map it later
        // OPTIMIZATION: Reduced samples for smooth slider performance
        const n_samples = 256;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            // Classic soft clipping curve
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    };

    // WAV Encoder
    const bufferToWave = (abuffer: AudioBuffer, len: number) => {
        let numOfChan = abuffer.numberOfChannels,
            length = len * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [], i, sample, offset = 0, pos = 0;

        const setUint16 = (data: any) => {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        const setUint32 = (data: any) => {
            view.setUint32(pos, data, true);
            pos += 4;
        }

        // write WAVE header
        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"

        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2);                      // block-align
        setUint16(16);                                 // 16-bit (hardcoded in this example)

        setUint32(0x61746164);                         // "data" - chunk
        setUint32(length - pos - 4);                   // chunk length

        // write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < len) {
            for (i = 0; i < numOfChan; i++) {             // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(44 + offset, sample, true);
                offset += 2;
            }
            pos++;
        }

        return new Blob([buffer], { type: "audio/wav" });
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAudio();
            if (audioContext) audioContext.close();
        };
    }, []);

    const initAudioContext = () => {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        setAudioContext(ctx);
        return ctx;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFileName(file.name);

            // Decode Audio
            const ctx = audioContext || initAudioContext();
            const arrayBuffer = await file.arrayBuffer();

            try {
                const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
                setAudioBuffer(decodedBuffer);
                setTimeout(() => setStep('mixing'), 500);
            } catch (error) {
                console.error("Error decoding audio:", error);
                alert("Nie udało się zdekodować pliku audio. Spróbuj MP3 lub WAV.");
            }
        }
    };

    // Setup nodes based on settings (Dry code re-used for both Realtime and Offline)
    const configureNodes = (
        ctx: BaseAudioContext,
        dest: AudioNode,
        source: AudioNode,
        currentSettings: typeof settings
    ) => {
        const masterGain = ctx.createGain();
        const dryGain = ctx.createGain();
        const wetGain = ctx.createGain();
        const compressor = ctx.createDynamicsCompressor();
        const distortion = ctx.createWaveShaper();
        const convolver = ctx.createConvolver();

        convolver.buffer = createImpulseResponse(ctx, 2.5, 2.0, false);

        // --- APPLY SETTINGS ---
        // Volume
        masterGain.gain.value = (currentSettings.volume / 100) * 1.5;

        // Reverb Mix
        const mix = currentSettings.reverb / 100;
        wetGain.gain.value = mix;
        dryGain.gain.value = 1 - (mix * 0.5);

        // Saturation
        distortion.curve = makeDistortionCurve(currentSettings.saturation * 4);
        distortion.oversample = '4x';

        // Compression
        const ratio = 1 + (currentSettings.compression / 100) * 19;
        const threshold = -100 + (100 - currentSettings.compression);
        compressor.threshold.value = threshold;
        compressor.ratio.value = ratio;

        // --- CONNECT ---
        source.connect(compressor);
        compressor.connect(distortion);

        // Dry Path
        distortion.connect(dryGain);
        dryGain.connect(masterGain);

        // Wet Path
        distortion.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(masterGain);

        masterGain.connect(dest);

        return { masterGain, dryGain, wetGain, compressor, distortion };
    };

    const playAudio = () => {
        if (!audioBuffer) return;
        const ctx = audioContext || initAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;

        // Set Playback Rate (Speed/Pitch)
        // 50 = 1.0 (Normal), 0 = 0.5 (Slow), 100 = 1.5 (Fast)
        const rate = 0.5 + (settings.speed / 100);
        source.playbackRate.value = rate;

        // Use helper to configure graph connected to destination
        const nodes = configureNodes(ctx, ctx.destination, source, settings);

        // Store refs for realtime updates
        sourceRef.current = source;
        gainNodeRef.current = nodes.masterGain;
        dryGainNodeRef.current = nodes.dryGain;
        wetGainNodeRef.current = nodes.wetGain;
        compressorRef.current = nodes.compressor;
        distortionRef.current = nodes.distortion;

        // Start with offset
        // Adjust offset logic for speed changes if complex seeking was needed, 
        // but simple pause/play usually just resumes time.
        // However, changing speed affects how much buffer time corresponds to wall clock time.
        // For simple looping, resuming at 'pauseTime' is acceptable approximation.
        const offset = pauseTimeRef.current % audioBuffer.duration;
        source.start(0, offset);
        startTimeRef.current = ctx.currentTime - (offset / rate);
        // Note: startTime tracking with variable rate is complex, 
        // but for this simple app, we just start/stop.

        setIsPlaying(true);
    };

    const stopAudio = (retainProgress = true) => {
        if (sourceRef.current) {
            sourceRef.current.stop();
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (audioContext && retainProgress) {
            // Calculate approx position
            // currentTime - startTime gives 'wall clock' time passed.
            // Multiply by rate to get 'buffer time' passed? 
            // It's tricky if rate changed during playback. 
            // We'll simplify and just reset to 0 or try to capture context time.
            // For a mini-game, restarting or rough pause is fine.
            pauseTimeRef.current = (audioContext.currentTime - startTimeRef.current) * (0.5 + settings.speed / 100);
        } else {
            pauseTimeRef.current = 0;
        }
        setIsPlaying(false);
    };

    const togglePlay = () => {
        if (isPlaying) {
            stopAudio();
        } else {
            playAudio();
        }
    };

    // Update logic for realtime sliders
    const updateNodesRealtime = (currentSettings: typeof settings) => {
        if (!audioContext) return;
        const now = audioContext.currentTime;

        if (gainNodeRef.current) gainNodeRef.current.gain.setTargetAtTime((currentSettings.volume / 100) * 1.5, now, 0.1);

        const mix = currentSettings.reverb / 100;
        if (wetGainNodeRef.current) wetGainNodeRef.current.gain.setTargetAtTime(mix, now, 0.1);
        if (dryGainNodeRef.current) dryGainNodeRef.current.gain.setTargetAtTime(1 - (mix * 0.5), now, 0.1);

        if (distortionRef.current) distortionRef.current.curve = makeDistortionCurve(currentSettings.saturation * 4);

        const ratio = 1 + (currentSettings.compression / 100) * 19;
        const threshold = -100 + (100 - currentSettings.compression);
        if (compressorRef.current) {
            compressorRef.current.threshold.setTargetAtTime(threshold, now, 0.1);
            compressorRef.current.ratio.setTargetAtTime(ratio, now, 0.1);
        }

        if (sourceRef.current) {
            const rate = 0.5 + (currentSettings.speed / 100);
            sourceRef.current.playbackRate.setTargetAtTime(rate, now, 0.1);
        }
    };

    useEffect(() => {
        if (isPlaying) {
            updateNodesRealtime(settings);
        }
    }, [settings, isPlaying]);

    const handleProcess = async () => {
        stopAudio(false);
        setStep('processing');

        // OFFLINE RENDERING LOGIC
        if (audioBuffer) {
            try {
                // Calculate duration based on speed
                // If slowed down (rate < 1), duration increases.
                const rate = 0.5 + (settings.speed / 100);
                const originalDuration = audioBuffer.duration;
                const newDuration = originalDuration / rate;

                const offlineCtx = new OfflineAudioContext(
                    audioBuffer.numberOfChannels,
                    newDuration * audioBuffer.sampleRate, // Adjust length for speed
                    audioBuffer.sampleRate
                );

                const offlineSource = offlineCtx.createBufferSource();
                offlineSource.buffer = audioBuffer;
                offlineSource.playbackRate.value = rate;

                // Connect same graph but to offline destination
                configureNodes(offlineCtx, offlineCtx.destination, offlineSource, settings);

                offlineSource.start(0);
                const renderedBuffer = await offlineCtx.startRendering();

                // Convert to WAV Blob
                const blob = bufferToWave(renderedBuffer, renderedBuffer.length);
                const url = URL.createObjectURL(blob);
                setProcessedAudioUrl(url);

            } catch (e) {
                console.error("Offline rendering failed", e);
            }
        }

        // Fake Delay UI
        let i = 0;
        const interval = setInterval(() => {
            setLoadingMsg(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
            i++;
            if (i > 5) { // shorter delay
                clearInterval(interval);
                setStep('result');
            }
        }, 600);
    };

    const handleReset = () => {
        setStep('upload');
        setFileName(null);
        setAudioBuffer(null);
        setProcessedAudioUrl(null);
        setSettings({ reverb: 30, compression: 40, saturation: 20, volume: 60, speed: 50 });
        pauseTimeRef.current = 0;
        stopAudio(false);
    };

    // --- CUSTOM INTERACTIVE SLIDER COMPONENT ---
    const InteractiveFader = ({ label, icon: Icon, value, onChange, minLabel, maxLabel }: { label: string, icon: any, value: number, onChange: (v: number) => void, minLabel?: string, maxLabel?: string }) => {
        const trackRef = useRef<HTMLDivElement>(null);
        const [isDragging, setIsDragging] = useState(false);

        const handleInteraction = useCallback((clientX: number) => {
            if (!trackRef.current) return;
            const rect = trackRef.current.getBoundingClientRect();
            const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
            onChange(Math.round(percent * 100));
        }, [onChange]);

        const handleMouseDown = (e: React.MouseEvent) => {
            setIsDragging(true);
            handleInteraction(e.clientX);
        };

        useEffect(() => {
            const handleMouseMove = (e: MouseEvent) => {
                if (isDragging) handleInteraction(e.clientX);
            };
            const handleMouseUp = () => setIsDragging(false);

            if (isDragging) {
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
            }
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }, [isDragging, handleInteraction]);

        // Touch support
        const handleTouchMove = (e: React.TouchEvent) => {
            handleInteraction(e.touches[0].clientX);
        };

        return (
            <div className="mb-6 select-none">
                <div className="flex justify-between items-center mb-2 font-syne text-xs uppercase tracking-widest text-gray-400">
                    <div className="flex items-center gap-2">
                        <Icon size={14} className="text-carroty" /> {label}
                    </div>
                    <div className="font-mono text-carroty">{value}%</div>
                </div>

                <div
                    ref={trackRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => setIsDragging(false)}
                    className="h-8 bg-black/40 border border-white/10 rounded cursor-pointer relative overflow-hidden group hover:border-white/30 transition-colors"
                >
                    {/* Fill Bar */}
                    <div
                        className="h-full bg-carroty/80 transition-all duration-75 ease-out relative"
                        style={{ width: `${value}%` }}
                    >
                        {/* Glow Effect on End */}
                        <div className="absolute right-0 top-0 h-full w-2 bg-white/50 blur-[4px] opacity-50"></div>
                    </div>

                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="w-[1px] h-full bg-white"></div>
                        ))}
                    </div>

                    {/* Center marker for speed or balanced controls */}
                    <div className="absolute left-1/2 top-0 h-full w-[2px] bg-white/20 -translate-x-1/2"></div>
                </div>
                {minLabel && maxLabel && (
                    <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-1 uppercase">
                        <span>{minLabel}</span>
                        <span>{maxLabel}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-28 pb-10 px-4 max-w-6xl mx-auto flex flex-col items-center justify-center">

            <div className="text-center mb-8 animate-fade-in-up">
                <h1 className="font-syne text-3xl md:text-5xl font-bold uppercase mb-2">
                    <span className="text-stroke hover:text-carroty transition-colors duration-300">Symulator Mixu</span>
                </h1>
                <p className="font-grotesk text-gray-400 max-w-lg mx-auto text-sm md:text-base mb-2">
                    Wgraj swój plik. Zepsuj go efektami. Zobacz, dlaczego nas potrzebujesz.
                </p>
                <p className="font-syne text-carroty font-bold text-sm uppercase tracking-wider">
                    Miks i mastering samemu bez profesjonalisty? Całkowicie za darmo.
                </p>
            </div>

            <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 md:p-8 relative overflow-hidden shadow-2xl min-h-[500px] flex flex-col justify-center">

                {/* Background FX */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-carroty to-transparent opacity-50"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-carroty blur-[150px] opacity-10 pointer-events-none"></div>

                {/* --- STAGE 1: UPLOAD --- */}
                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse ring-1 ring-white/10">
                            <UploadCloud size={32} className="text-carroty" />
                        </div>
                        <h2 className="font-syne text-xl md:text-2xl mb-2 text-white text-center">Upuść Swój Utwór</h2>
                        <p className="text-gray-500 mb-8 font-grotesk text-xs text-center max-w-xs">
                            Obsługuje .mp3 i .wav. Będziemy go odtwarzać dla Ciebie.
                        </p>

                        <label className="cursor-pointer group relative overflow-hidden">
                            <input type="file" className="hidden" accept="audio/*,.mp3,.wav,audio/mpeg,audio/wav,audio/x-wav" onChange={handleFileUpload} />
                            <div className="px-8 py-3 bg-transparent border border-carroty text-carroty font-bold uppercase font-syne tracking-widest transition-all duration-300 group-hover:bg-carroty group-hover:text-black shadow-[0_0_15px_rgba(255,72,0,0.3)]">
                                Wybierz Plik
                            </div>
                        </label>
                    </div>
                )}

                {/* --- STAGE 2: MIXING --- */}
                {step === 'mixing' && (
                    <div className="animate-fade-in w-full h-full flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center">
                                    <FileAudio size={20} className="text-white/50" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-carroty uppercase font-bold tracking-wider">Teraz Miksujesz</div>
                                    <div className="text-white font-mono text-sm max-w-[150px] md:max-w-xs truncate">{fileName}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={togglePlay}
                                    className={`flex items-center gap-2 px-6 py-2 rounded font-bold uppercase text-xs transition-all ${isPlaying ? 'bg-carroty text-black animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    {isPlaying ? <><Pause size={14} /> Pauza</> : <><Play size={14} /> Odtwórz</>}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                            {/* Monitor Info */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-black/50 rounded-xl border border-white/10 h-48 relative overflow-hidden flex items-center justify-center">

                                    {/* Simple Visualizer Bars */}
                                    <div className="flex items-end gap-1 h-3/4 w-full px-4 pb-2">
                                        {[...Array(20)].map((_, i) => {
                                            // Randomized height that reacts to volume setting roughly
                                            const baseHeight = isPlaying ? 20 + Math.random() * 60 : 5;
                                            const height = Math.min(100, baseHeight * (settings.volume / 50));

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex-1 rounded-t-sm transition-all duration-75 bg-carroty"
                                                    style={{ height: `${height}%`, opacity: isPlaying ? 0.8 : 0.2 }}
                                                ></div>
                                            );
                                        })}
                                    </div>

                                    {!isPlaying && <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-widest text-gray-500 font-mono">Audio Zatrzymane</div>}
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                        <Headphones size={12} /> Live Monitor
                                    </h4>
                                    <div className="text-sm font-mono text-gray-300 space-y-1">
                                        <p>{`> KOMPRESJA: ${settings.compression > 50 ? 'MOCNA' : 'LEKKA'}`}</p>
                                        <p>{`> REVERB: ${settings.reverb > 50 ? 'KATEDRA' : 'POKÓJ'}`}</p>
                                        <p>{`> SATURACJA: ${settings.saturation > 50 ? 'PRZESTER' : 'CIEPŁO'}`}</p>
                                        <p>{`> PRĘDKOŚĆ: ${settings.speed < 45 ? 'SLOWED' : settings.speed > 55 ? 'NIGHTCORE' : 'NORMAL'}`}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col justify-center bg-black/20 p-6 rounded-xl border border-white/5 relative">
                                <InteractiveFader
                                    label="Kompresja (Klejenie)" icon={Zap} value={settings.compression} onChange={(v) => setSettings({ ...settings, compression: v })}
                                />
                                <InteractiveFader
                                    label="Reverb (Przestrzeń)" icon={UploadCloud} value={settings.reverb} onChange={(v) => setSettings({ ...settings, reverb: v })}
                                />
                                <InteractiveFader
                                    label="Saturacja (Ciepło)" icon={Sliders} value={settings.saturation} onChange={(v) => setSettings({ ...settings, saturation: v })}
                                />
                                <InteractiveFader
                                    label="Prędkość (Slowed/Fast)" icon={Timer} value={settings.speed} onChange={(v) => setSettings({ ...settings, speed: v })}
                                    minLabel="Slow" maxLabel="Fast"
                                />
                                <InteractiveFader
                                    label="Głośność (Gain)" icon={Volume2} value={settings.volume} onChange={(v) => setSettings({ ...settings, volume: v })}
                                />

                                <button
                                    onClick={handleProcess}
                                    className="mt-6 w-full py-4 bg-carroty text-black font-syne font-black text-lg uppercase hover:bg-white transition-all duration-300 clip-path-button relative overflow-hidden group shadow-[0_0_20px_rgba(255,72,0,0.3)]"
                                >
                                    <span className="relative z-10">Wyrenderuj i Zakończ</span>
                                    <div className="absolute inset-0 bg-white transform translate-y-full transition-transform duration-300 group-hover:translate-y-0 z-0"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STAGE 3: PROCESSING --- */}
                {step === 'processing' && (
                    <div className="h-full flex flex-col items-center justify-center animate-fade-in py-20">
                        <div className="w-64 bg-gray-900 h-1 rounded-full overflow-hidden mb-6 relative">
                            <div className="absolute top-0 left-0 h-full bg-carroty animate-[loading_1.5s_ease-in-out_infinite] w-1/2"></div>
                        </div>
                        <h3 className="font-syne text-xl text-white mb-2 blink-animation">PRZETWARZANIE...</h3>
                        <p className="font-mono text-carroty text-xs uppercase tracking-widest">{loadingMsg}</p>
                        <style>{`
                    @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
                    .blink-animation { animation: blink 0.5s infinite alternate; }
                    @keyframes blink { 0% { opacity: 0.3; } 100% { opacity: 1; } }
                 `}</style>
                    </div>
                )}

                {/* --- STAGE 4: RESULT --- */}
                {step === 'result' && (
                    <div className="animate-fade-in pb-10">
                        <div className="text-center mb-10">
                            <h2 className="font-syne text-3xl font-bold uppercase mb-2">Werdykt</h2>
                            <p className="text-gray-500 text-sm">Porównanie zakończone.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative max-w-3xl mx-auto">
                            {/* VS Badge */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border-2 border-white w-14 h-14 flex items-center justify-center rounded-full z-10 font-black font-syne text-xl italic shadow-lg">VS</div>

                            {/* USER RESULT */}
                            <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-xl flex flex-col items-center text-center hover:border-red-500/50 transition-colors">
                                <div className="text-red-500 mb-4 animate-bounce">
                                    <AlertTriangle size={40} />
                                </div>
                                <h3 className="font-syne text-lg text-red-500 mb-4 uppercase tracking-widest border-b border-red-500/20 pb-2 w-full">Oczekiwania</h3>
                                <p className="font-grotesk text-sm text-gray-300 mb-4 leading-relaxed italic">
                                    "Ma potencjał..." <br />
                                    <span className="text-[12px] text-gray-400 font-bold">- Twoja Mama (prawdopodobnie)</span>
                                </p>
                                <p className="font-grotesk text-sm text-gray-300 mb-4 leading-relaxed">
                                    "Dla mnie brzmi dobrze!" <br />
                                    <span className="text-[12px] text-gray-400 font-bold">- Ty, zanim sprawdzisz mix w aucie.</span>
                                </p>

                                <div className="flex flex-col gap-2 w-full">
                                    <button
                                        onClick={togglePlay}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 border border-red-500/30 rounded text-xs uppercase text-red-400 hover:bg-red-500/10 transition-colors ${isPlaying ? 'bg-red-500/20' : ''}`}
                                    >
                                        {isPlaying ? <Pause size={12} /> : <Play size={12} />} Posłuchaj swojego Mixu
                                    </button>

                                    {processedAudioUrl && (
                                        <a
                                            href={processedAudioUrl}
                                            download={`moj_zmarnowany_mix_${Date.now()}.wav`}
                                            className="flex items-center justify-center gap-2 px-4 py-2 border border-white/20 bg-white/5 rounded text-xs uppercase text-white hover:bg-white/10 transition-colors"
                                        >
                                            <Download size={12} /> Pobierz Swój Mix
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* PRO RESULT */}
                            <div className="bg-carroty/10 border border-carroty/20 p-6 rounded-xl flex flex-col items-center text-center shadow-[0_0_20px_rgba(255,72,0,0.05)] hover:shadow-[0_0_30px_rgba(255,72,0,0.15)] hover:border-carroty/50 transition-all">
                                <div className="text-carroty mb-4">
                                    <Zap size={40} />
                                </div>
                                <h3 className="font-syne text-lg text-carroty mb-4 uppercase tracking-widest border-b border-carroty/20 pb-2 w-full">Rzeczywistość</h3>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center gap-3 bg-black/40 p-3 rounded border border-white/5">
                                        <div className="text-left">
                                            <div className="text-white font-bold text-sm">CARROTY MUSIC</div>
                                            <div className="text-xs text-gray-500">Profesjonalny Mix & Master</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        Zbalansowane. Dynamiczne. Radiowe. <br />
                                        <span className="text-carroty font-bold">On zrobi to świetnie.</span>
                                    </p>
                                </div>

                                <a href="https://www.fiverr.com/carrotymusic" target="_blank" rel="noreferrer" className="w-full py-3 bg-carroty text-black font-syne font-bold uppercase hover:bg-white transition-colors flex items-center justify-center gap-2 rounded text-sm shadow-[0_0_15px_rgba(255,72,0,0.4)]">
                                    Zatrudnij Profesjonalistę <Music size={16} />
                                </a>
                            </div>
                        </div>

                        <div className="flex justify-center mt-12">
                            <button onClick={handleReset} className="px-8 py-3 border border-white/20 hover:bg-white/10 text-white font-syne font-bold uppercase flex items-center justify-center gap-2 rounded text-sm transition-all">
                                <RotateCcw size={16} /> Spróbuj Inny Utwór
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Game;
