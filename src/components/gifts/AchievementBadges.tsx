import { useUserAchievements } from '@/hooks/useAchievements';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AchievementBadgesProps {
  userId: string;
  maxShow?: number;
}

export function AchievementBadges({ userId, maxShow = 5 }: AchievementBadgesProps) {
  const { data: achievements } = useUserAchievements(userId);

  if (!achievements?.length) return null;

  const shown = achievements.slice(0, maxShow);
  const remaining = achievements.length - maxShow;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        {shown.map(ua => (
          <Tooltip key={ua.id}>
            <TooltipTrigger asChild>
              <span className="text-sm cursor-default" title={ua.achievement.name}>
                {ua.achievement.icon_emoji}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{ua.achievement.name}</p>
              <p className="text-xs text-muted-foreground">{ua.achievement.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remaining > 0 && (
          <span className="text-xs text-muted-foreground ml-1">+{remaining}</span>
        )}
      </div>
    </TooltipProvider>
  );
}
