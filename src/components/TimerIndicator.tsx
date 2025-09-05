import { Clock } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function TimerIndicator() {
  const { timer, formatTime, getModeTitle } = useTimer();
  const navigate = useNavigate();

  // Don't show if timer isn't running
  if (!timer.isRunning) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/")}
      className="flex items-center gap-2 text-xs hover:bg-muted transition-smooth"
    >
      <Clock className="h-3 w-3" />
      <span>{formatTime(timer.timeLeft)}</span>
      <span className="hidden sm:inline text-muted-foreground">
        • {getModeTitle()}
      </span>
    </Button>
  );
}