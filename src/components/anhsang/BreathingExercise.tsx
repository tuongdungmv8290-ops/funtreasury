import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind, Play, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale';

const INHALE_DURATION = 4;
const HOLD_DURATION = 7;
const EXHALE_DURATION = 8;

const phaseConfig = {
  idle: { label: "Sẵn sàng", color: "text-muted-foreground", duration: 0 },
  inhale: { label: "Hít vào", color: "text-blue-400", duration: INHALE_DURATION },
  hold: { label: "Giữ hơi", color: "text-primary", duration: HOLD_DURATION },
  exhale: { label: "Thở ra", color: "text-purple-400", duration: EXHALE_DURATION },
};

const BreathingExercise = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [targetCycles, setTargetCycles] = useState(4);

  const resetExercise = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setCountdown(0);
    setCycles(0);
  }, []);

  const startExercise = () => {
    setCycles(0);
    setPhase('inhale');
    setCountdown(INHALE_DURATION);
    setIsRunning(true);
  };

  const stopExercise = () => {
    resetExercise();
  };

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return HOLD_DURATION;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return EXHALE_DURATION;
          } else if (phase === 'exhale') {
            const newCycles = cycles + 1;
            setCycles(newCycles);
            
            if (newCycles >= targetCycles) {
              toast.success("🌬️ Bài tập thở hoàn thành!", {
                description: `Con đã hoàn thành ${targetCycles} vòng thở 4-7-8. Tâm con giờ đã bình an.`,
                duration: 5000,
              });
              resetExercise();
              return 0;
            }
            
            setPhase('inhale');
            return INHALE_DURATION;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase, cycles, targetCycles, resetExercise]);

  const getCircleScale = () => {
    if (phase === 'inhale') return 'scale-150';
    if (phase === 'hold') return 'scale-150';
    if (phase === 'exhale') return 'scale-100';
    return 'scale-100';
  };

  const getCircleGlow = () => {
    if (phase === 'inhale') return 'shadow-[0_0_60px_hsl(210,100%,70%,0.4)]';
    if (phase === 'hold') return 'shadow-[0_0_60px_hsl(46,65%,52%,0.4)]';
    if (phase === 'exhale') return 'shadow-[0_0_40px_hsl(270,60%,60%,0.3)]';
    return 'shadow-[0_0_20px_hsl(var(--primary)/0.2)]';
  };

  return (
    <section className="px-4 md:px-6">
      <Card className="treasury-card-gold overflow-hidden">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Wind className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl md:text-3xl font-serif text-primary">
              Bài Tập Thở 4-7-8
            </CardTitle>
            <Wind className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Kỹ thuật thở giúp giảm stress và thư giãn tâm trí
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Breathing Circle */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Outer glow ring */}
              <div 
                className={`absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-xl transition-all duration-1000 ${
                  isRunning ? 'opacity-100' : 'opacity-50'
                } ${getCircleScale()}`}
              />
              
              {/* Main circle */}
              <div 
                className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full 
                  bg-gradient-to-br from-card via-card to-background
                  border-2 border-primary/30
                  flex flex-col items-center justify-center
                  transition-all duration-1000 ease-in-out
                  ${getCircleScale()} ${getCircleGlow()}`}
              >
                <span className={`text-2xl md:text-3xl font-serif font-semibold ${phaseConfig[phase].color} transition-colors duration-300`}>
                  {phaseConfig[phase].label}
                </span>
                {isRunning && (
                  <span className="text-5xl md:text-6xl font-mono font-bold text-foreground mt-2">
                    {countdown}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cycle counter */}
          {isRunning && (
            <div className="text-center">
              <span className="text-lg text-muted-foreground">
                Vòng: <span className="text-primary font-semibold">{cycles + 1}</span> / {targetCycles}
              </span>
            </div>
          )}

          {/* Target cycles selector */}
          {!isRunning && (
            <div className="flex flex-col items-center gap-3">
              <span className="text-sm text-muted-foreground">Số vòng thở:</span>
              <div className="flex gap-2">
                {[2, 4, 6, 8].map((num) => (
                  <Button
                    key={num}
                    variant={targetCycles === num ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTargetCycles(num)}
                    className={targetCycles === num ? "bg-primary text-primary-foreground" : ""}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button 
                onClick={startExercise}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                <Play className="h-4 w-4 mr-2" />
                Bắt đầu
              </Button>
            ) : (
              <>
                <Button 
                  onClick={stopExercise}
                  variant="destructive"
                  className="px-6"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Dừng
                </Button>
                <Button 
                  onClick={resetExercise}
                  variant="outline"
                  className="px-6"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-primary/5 rounded-xl p-4 md:p-6 border border-primary/10">
            <h4 className="font-serif text-lg text-primary mb-3 text-center">Hướng dẫn kỹ thuật 4-7-8</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-3xl font-mono font-bold text-blue-400">4</div>
                <div className="text-sm text-muted-foreground">giây hít vào</div>
                <div className="text-xs text-muted-foreground/70">Hít sâu qua mũi</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-mono font-bold text-primary">7</div>
                <div className="text-sm text-muted-foreground">giây giữ hơi</div>
                <div className="text-xs text-muted-foreground/70">Giữ yên, thư giãn</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-mono font-bold text-purple-400">8</div>
                <div className="text-sm text-muted-foreground">giây thở ra</div>
                <div className="text-xs text-muted-foreground/70">Thở ra chậm qua miệng</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default BreathingExercise;
