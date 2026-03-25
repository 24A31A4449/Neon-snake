/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music, Trophy, RefreshCw, Volume2, Activity, Zap, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS = [
  { id: 1, title: "SIGNAL_LOST", artist: "NULL_PTR", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "BUFFER_OVERFLOW", artist: "VOID_MAIN", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "KERNEL_PANIC", artist: "ROOT_ACCESS", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

// --- Components ---

const SnakeGame = ({ onScoreChange, onGameOver }: { onScoreChange: (s: number) => void, onGameOver: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = snake.some(segment => segment.x === newFood?.x && segment.y === newFood?.y);
      if (!onSnake) break;
    }
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood());
    setScore(0);
    setGameOver(false);
    onScoreChange(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (isPaused || gameOver) return;

    const moveSnake = () => {
      const newHead = {
        x: (snake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (snake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        onGameOver();
        return;
      }

      const newSnake = [newHead, ...snake];

      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange(newScore);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [snake, direction, food, isPaused, gameOver, score, onScoreChange, onGameOver, generateFood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Background - Deep Void with Trail
    ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid - Jarring Cyan Lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Food - Glitch Crosshair
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    const fx = food.x * cellSize + cellSize / 2;
    const fy = food.y * cellSize + cellSize / 2;
    ctx.fillRect(fx - 8, fy - 2, 16, 4);
    ctx.fillRect(fx - 2, fy - 8, 4, 16);
    ctx.shadowBlur = 0;

    // Snake - Cyan Segments
    snake.forEach((segment, i) => {
      const isHead = i === 0;
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      
      if (isHead) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellSize, cellSize);
      } else {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.fillRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
        ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      }
      ctx.shadowBlur = 0;
    });

  }, [snake, food]);

  return (
    <div className="relative brutal-border bg-black p-1">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="block"
      />
      
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50"
          >
            <h2 className="text-4xl font-pixel text-[#ff00ff] mb-4 glitch-text">
              FATAL_ERROR
            </h2>
            <p className="font-mono text-xl text-[#00ffff] mb-8 uppercase tracking-widest">DATA_LOSS: {score}</p>
            <button
              onClick={resetGame}
              className="px-8 py-4 bg-[#00ffff] text-black font-pixel text-sm hover:bg-[#ff00ff] transition-colors uppercase brutal-border"
            >
              REBOOT_SYSTEM
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isPaused && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <p className="font-pixel text-2xl text-[#00ffff] glitch-text">SYSTEM_HALTED</p>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    }
    if (isPlaying) {
      setTimeout(() => audioRef.current?.play(), 0);
    }
  };

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ffff] font-mono selection:bg-[#ff00ff]/30 overflow-hidden flex flex-col items-center justify-center relative p-4">
      <div className="noise" />
      <div className="scanline" />
      <div className="grid-floor" />

      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12 z-10"
      >
        <h1 className="text-4xl lg:text-6xl font-pixel cyber-heading mb-4 uppercase leading-tight" data-text="PROTO_SNAKE_v2.0">
          PROTO_SNAKE_v2.0
        </h1>
        <div className="flex items-center justify-center gap-4 text-xs tracking-[0.4em] text-[#00ffff]/60 uppercase">
          <Terminal size={14} />
          <span>CONNECTED_TO_VOID</span>
          <Zap size={14} className="animate-pulse" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-8 w-full max-w-7xl z-10">
        
        {/* Left: Telemetry */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="brutal-border bg-black p-6 flex flex-col justify-between h-[450px]"
        >
          <div>
            <div className="flex items-center gap-2 mb-8 border-b border-[#00ffff]/20 pb-4">
              <Activity size={16} className="text-[#ff00ff]" />
              <span className="font-pixel text-[10px] uppercase tracking-tighter">TELEMETRY_DATA</span>
            </div>
            
            <div className="space-y-8">
              <div className="section">
                <span className="text-[10px] text-[#00ffff]/40 uppercase tracking-widest block mb-2">CURRENT_YIELD</span>
                <div className="font-pixel text-4xl text-[#00ffff]">{score.toString().padStart(4, '0')}</div>
              </div>
              
              <div className="section">
                <span className="text-[10px] text-[#00ffff]/40 uppercase tracking-widest block mb-2">PEAK_YIELD</span>
                <div className="font-pixel text-4xl text-[#ff00ff]">{highScore.toString().padStart(4, '0')}</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#00ffff]/5 border border-[#00ffff]/20">
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={12} className="text-[#ff00ff]" />
              <span className="text-[10px] uppercase">CMD_LIST</span>
            </div>
            <p className="text-[10px] text-[#00ffff]/40 leading-relaxed uppercase">
              {">"} ARROW_KEYS: NAVIGATE<br />
              {">"} SPACE: HALT_SYSTEM<br />
              {">"} MAGENTA_CELLS: UPLINK
            </p>
          </div>
        </motion.div>

        {/* Center: Execution Chamber */}
        <div className="flex items-center justify-center">
          <SnakeGame 
            onScoreChange={setScore} 
            onGameOver={() => {}} 
          />
        </div>

        {/* Right: Audio Processor */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="brutal-border bg-black p-6 flex flex-col justify-between h-[450px]"
        >
          <div>
            <div className="flex items-center gap-2 mb-8 border-b border-[#00ffff]/20 pb-4">
              <Music size={16} className="text-[#ff00ff]" />
              <span className="font-pixel text-[10px] uppercase tracking-tighter">AUDIO_CORE</span>
            </div>

            <div className="relative aspect-square brutal-border bg-[#050505] flex items-center justify-center overflow-hidden mb-6">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#ff00ff_0%,transparent_70%)]" />
              
              {/* Radar rings */}
              <div className="absolute inset-4 border border-[#00ffff]/20 rounded-full" />
              <div className="absolute inset-12 border border-[#00ffff]/40 rounded-full" />
              <div className="absolute inset-20 border border-[#00ffff]/60 rounded-full" />
              
              {/* Radar sweep */}
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 origin-center"
                style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(0, 255, 255, 0.4) 100%)' }}
              />

              <Volume2 size={32} className={`relative z-10 ${isPlaying ? "text-[#00ffff] animate-pulse" : "text-[#00ffff]/20"}`} />

              {/* Visualizer */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end h-16 px-2 opacity-80">
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isPlaying ? [4, Math.random() * 50 + 10, 4] : 4 }}
                    transition={{ duration: 0.15, repeat: Infinity, delay: i * 0.03 }}
                    className="w-1 bg-[#ff00ff]"
                  />
                ))}
              </div>
            </div>

            <div className="border border-[#00ffff]/20 p-3 mb-6 bg-[#00ffff]/5">
              <div className="text-[10px] text-[#ff00ff] mb-1 font-pixel">NOW_DECODING:</div>
              <div className="text-sm font-pixel truncate text-[#00ffff]">{currentTrack.title}</div>
              <div className="text-[10px] text-[#00ffff]/40 mt-1 uppercase">SOURCE: {currentTrack.artist}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => skipTrack('prev')}
              className="w-10 h-10 flex items-center justify-center brutal-border hover:bg-[#00ffff] hover:text-black transition-colors"
            >
              <SkipBack size={16} />
            </button>
            <button 
              onClick={togglePlay}
              className="flex-1 h-10 flex items-center justify-center bg-[#00ffff] text-black font-pixel text-xs hover:bg-[#ff00ff] transition-colors uppercase"
            >
              {isPlaying ? "HALT" : "EXEC"}
            </button>
            <button 
              onClick={() => skipTrack('next')}
              className="w-10 h-10 flex items-center justify-center brutal-border hover:bg-[#00ffff] hover:text-black transition-colors"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <audio 
            ref={audioRef} 
            src={currentTrack.url} 
            onEnded={() => skipTrack('next')}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mt-12 pt-8 border-t border-[#00ffff]/10 flex justify-between items-center text-[10px] uppercase tracking-[0.3em] text-[#00ffff]/30">
        <div>SYSTEM_STATUS: NOMINAL</div>
        <div className="flex gap-8">
          <span>UPLINK_ESTABLISHED</span>
          <span className="text-[#ff00ff]">VOID_PROTOCOL_ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
