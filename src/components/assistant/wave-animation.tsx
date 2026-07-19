import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// ============================================================
// WaveAnimation — Visualizador de Ondas Sonoras
// ============================================================
// Usa Web Audio API (AnalyserNode) para capturar frequências
// reais do microfone. Fallback para animação simulada quando
// o áudio real não está disponível.
// ============================================================

interface WaveAnimationProps {
  /** Se o microfone está ativo (inicia/para o analisador) */
  isListening: boolean;
  /** Número de barras (default: 24) */
  barCount?: number;
  /** Cor das barras em rgb (ex: "239, 68, 68" para red-500) */
  barColor?: string;
}

export function WaveAnimation({
  isListening,
  barCount = 24,
  barColor = "239, 68, 68",
}: WaveAnimationProps) {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, (_, i) => {
      const center = barCount / 2;
      const dist = Math.abs(i - center) / center;
      return Math.max(0.05, Math.sin((1 - dist) * Math.PI) * 0.12);
    })
  );

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ============================================================
  // Helpers: animação idle e simulada
  // ============================================================
  function stopIdleAnimation() {
    if (simIntervalRef.current !== null) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  }

  function startIdleAnimation() {
    stopIdleAnimation();
    let tick = 0;
    simIntervalRef.current = setInterval(() => {
      tick++;
      const phase = tick * 0.05;
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          const center = barCount / 2;
          const dist = Math.abs(i - center) / center;
          const wave = Math.sin(phase + i * 0.4) * 0.04;
          const envelope = Math.max(0.05, Math.sin((1 - dist) * Math.PI) * 0.1);
          return Math.max(0.03, envelope + wave);
        })
      );
    }, 80);
  }

  function startSimulatedListening() {
    stopIdleAnimation();
    let tick = 0;
    simIntervalRef.current = setInterval(() => {
      tick++;
      const phase = tick * 0.1;
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          const freq1 = Math.sin(phase + i * 0.6) * 0.3;
          const freq2 = Math.sin(phase * 1.7 + i * 0.3) * 0.2;
          const noise = Math.random() * 0.15;
          const envelope = Math.sin((i / barCount) * Math.PI) * 0.3 + 0.1;
          return Math.min(1, Math.max(0.05, envelope + freq1 + freq2 + noise));
        })
      );
    }, 50);
  }

  // ============================================================
  // Cleanup centralizado (reutilizado em vários lugares)
  // ============================================================
  function cleanupAnalyser() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    stopIdleAnimation();
  }

  // ============================================================
  // Effect principal: inicia/para o analisador de áudio
  // ============================================================
  useEffect(() => {
    if (!isListening) {
      cleanupAnalyser();
      startIdleAnimation();
      return;
    }

    // --- START: analisador de áudio real ---
    let cancelled = false;
    stopIdleAnimation();

    // Reseta para estado neutro sem setState síncrono no effect
    queueMicrotask(() => {
      if (!cancelled) {
        setHeights(Array.from({ length: barCount }, () => 0.05));
      }
    });

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as Partial<{ webkitAudioContext: typeof AudioContext }>).webkitAudioContext;
        if (!AudioContextClass) return;
        const audioContext = new AudioContextClass();
        if (cancelled) {
          audioContext.close();
          return;
        }
        audioContextRef.current = audioContext;

        // Navegadores como Chrome iniciam AudioContext suspenso
        audioContext.resume().catch(() => {});

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function update() {
          if (cancelled) return;
          analyser.getByteFrequencyData(dataArray);

          const step = Math.max(1, Math.floor(bufferLength / barCount));
          const newHeights = Array.from({ length: barCount }, (_, i) => {
            let sum = 0;
            const start = i * step;
            const end = Math.min(start + step, bufferLength);
            for (let j = start; j < end; j++) {
              sum += dataArray[j]!;
            }
            const avg = sum / (end - start);
            return Math.min(1, Math.pow(avg / 255, 0.6));
          });

          setHeights(newHeights);
          rafRef.current = requestAnimationFrame(update);
        }

        update();
      })
      .catch(() => {
        if (!cancelled) {
          startSimulatedListening();
        }
      });

    return () => {
      cancelled = true;
      cleanupAnalyser();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, barCount]);

  // ============================================================
  // Render: barras animadas
  // ============================================================
  return (
    <div className="flex items-end justify-center gap-[2px] h-8 w-full px-1">
      {heights.map((h, i) => {
        const pxHeight = Math.max(3, Math.min(28, h * 28));
        const opacity = Math.max(0.25, h * 0.8 + 0.2);

        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{
              height: pxHeight,
              background: `linear-gradient(to top, rgba(${barColor}, 0.4), rgba(${barColor}, ${opacity}))`,
              boxShadow:
                h > 0.5
                  ? `0 0 4px rgba(${barColor}, ${h * 0.4})`
                  : "none",
            }}
            animate={{ height: pxHeight }}
            transition={{ duration: 0.04, ease: "linear" }}
          />
        );
      })}
    </div>
  );
}
