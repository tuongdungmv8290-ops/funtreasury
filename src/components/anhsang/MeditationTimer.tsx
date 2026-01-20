import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Bell } from "lucide-react";
import { toast } from "sonner";

const MeditationTimer = () => {
  const { t } = useTranslation();
  
  const PRESETS = [
    { label: `5 ${t('anhsang.meditation.minutes')}`, value: 5 * 60 },
    { label: `10 ${t('anhsang.meditation.minutes')}`, value: 10 * 60 },
    { label: `15 ${t('anhsang.meditation.minutes')}`, value: 15 * 60 },
    { label: `30 ${t('anhsang.meditation.minutes')}`, value: 30 * 60 },
  ];

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
    toast.success(`🙏 ${t('anhsang.meditation.completeToast')}`, {
      description: t('anhsang.meditation.completeToastDesc'),
      duration: 5000,
    });
  }, [t]);

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
    toast.info(`🧘 ${t('anhsang.meditation.startToast')}`, {
      description: t('anhsang.meditation.startToastDesc'),
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

  const getStatusText = () => {
    if (isRunning) return t('anhsang.meditation.meditating');
    if (remaining === 0) return t('anhsang.meditation.completed');
    return t('anhsang.meditation.ready');
  };

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
          {t('anhsang.meditation.title')}
        </h2>
        <p className="font-body text-muted-foreground">
          {t('anhsang.meditation.subtitle')}
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
                {getStatusText()}
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
                {t('anhsang.meditation.start')}
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                onClick={handlePause}
                className="w-32 gap-2"
              >
                <Pause className="w-5 h-5" />
                {t('anhsang.meditation.pause')}
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {t('anhsang.meditation.reset')}
            </Button>
          </div>

          {/* Meditation tip */}
          <div className="mt-8 text-center max-w-md">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-heading text-sm font-semibold text-primary">
                {t('anhsang.meditation.tipTitle')}
              </span>
            </div>
            <p className="font-body text-sm text-muted-foreground italic">
              "{t('anhsang.meditation.tipContent')}"
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default MeditationTimer;