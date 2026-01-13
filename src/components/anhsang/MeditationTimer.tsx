import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Bell } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [
  { label: "5 phút", value: 5 * 60 },
  { label: "10 phút", value: 10 * 60 },
  { label: "15 phút", value: 15 * 60 },
  { label: "30 phút", value: 30 * 60 },
];

const MeditationTimer = () => {
  const [duration, setDuration] = useState(5 * 60);
  const [remaining, setRemaining] = useState(5 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - remaining) / duration) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    toast.success("🙏 Thiền định hoàn thành!", {
      description: "Cảm ơn con đã dành thời gian cho tâm hồn.",
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && remaining > 0) {
      interval = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remaining, handleComplete]);

  const handleStart = () => {
    if (remaining === 0) {
      setRemaining(duration);
    }
    setIsRunning(true);
    toast.info("🧘 Bắt đầu thiền định...", {
      description: "Hãy hít thở sâu và thả lỏng...",
    });
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemaining(duration);
  };

  const handlePresetChange = (value: number) => {
    setDuration(value);
    setRemaining(value);
    setIsRunning(false);
  };

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
          MEDITATION TIMER
        </h2>
        <p className="font-body text-muted-foreground">
          Dành thời gian để kết nối với bản thân và vũ trụ
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
        <div className="flex flex-col items-center">
          {/* Circular Progress */}
          <div className="relative w-64 h-64 mb-8">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            {/* Timer display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-5xl font-bold text-foreground tabular-nums">
                {formatTime(remaining)}
              </span>
              <span className="font-body text-sm text-muted-foreground mt-2">
                {isRunning ? "Đang thiền định..." : remaining === 0 ? "Hoàn thành!" : "Sẵn sàng"}
              </span>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={duration === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange(preset.value)}
                disabled={isRunning}
                className="font-mono"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-4">
            {!isRunning ? (
              <Button
                size="lg"
                onClick={handleStart}
                className="w-32 gap-2"
              >
                <Play className="w-5 h-5" />
                Bắt đầu
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                onClick={handlePause}
                className="w-32 gap-2"
              >
                <Pause className="w-5 h-5" />
                Tạm dừng
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Đặt lại
            </Button>
          </div>

          {/* Meditation tip */}
          <div className="mt-8 text-center max-w-md">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-heading text-sm font-semibold text-primary">
                Gợi ý thiền định
              </span>
            </div>
            <p className="font-body text-sm text-muted-foreground italic">
              "Hãy hít thở sâu, thả lỏng cơ thể, và để tâm trí trở nên yên tĩnh. 
              Cảm nhận năng lượng yêu thương của Cha Vũ Trụ đang bao bọc con."
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default MeditationTimer;
