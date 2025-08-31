import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  pomodoroCount: number;
  timeSpent: number;
  tags: string[];
  projectId?: string;
  folderId?: string;
  createdAt: string;
}

interface TimerSettings {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

interface TaskTimerProps {
  task: Task;
  onComplete: (pomodoroCount: number, timeSpent: number) => void;
  onClose: () => void;
}

export function TaskTimer({ task, onComplete, onClose }: TaskTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [sessionPomodoros, setSessionPomodoros] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);

  // Load timer settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("timer-settings");
    if (savedSettings) {
      const settings: TimerSettings = JSON.parse(savedSettings);
      const focusTimeSeconds = settings.focusTime * 60;
      setTimeLeft(focusTimeSeconds);
      setTotalTime(focusTimeSeconds);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        setSessionTime(prev => prev + 1);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handlePomodoroComplete();
    }
  }, [timeLeft, isRunning]);

  const handlePomodoroComplete = () => {
    const newPomodoroCount = task.pomodoroCount + sessionPomodoros + 1;
    const newTimeSpent = task.timeSpent + Math.floor(sessionTime / 60);
    
    setSessionPomodoros(prev => prev + 1);
    setIsRunning(false);
    
    // Reset timer for another session
    const savedSettings = localStorage.getItem("timer-settings");
    if (savedSettings) {
      const settings: TimerSettings = JSON.parse(savedSettings);
      const focusTimeSeconds = settings.focusTime * 60;
      setTimeLeft(focusTimeSeconds);
    }
    
    // Update gamification
    const gamification = JSON.parse(localStorage.getItem("gamification") || '{"fish": 0, "leaves": 0}');
    gamification.fish += 1;
    localStorage.setItem("gamification", JSON.stringify(gamification));
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const savedSettings = localStorage.getItem("timer-settings");
    if (savedSettings) {
      const settings: TimerSettings = JSON.parse(savedSettings);
      const focusTimeSeconds = settings.focusTime * 60;
      setTimeLeft(focusTimeSeconds);
      setTotalTime(focusTimeSeconds);
    }
  };

  const completeTask = () => {
    const newPomodoroCount = task.pomodoroCount + sessionPomodoros;
    const newTimeSpent = task.timeSpent + Math.floor(sessionTime / 60);
    onComplete(newPomodoroCount, newTimeSpent);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
        <p className="text-sm text-muted-foreground">
          Current session: {sessionPomodoros} 🍅 + {Math.floor(sessionTime / 60)} minutes
        </p>
      </div>

      <Card className={`${isRunning ? 'timer-focus' : 'bg-card'} transition-smooth`}>
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-4xl font-mono font-bold">
            {formatTime(timeLeft)}
          </div>
          
          <Progress value={getProgress()} className="h-2" />
          
          <div className="flex justify-center gap-3">
            <Button
              onClick={toggleTimer}
              className="bg-nature-gradient hover:opacity-90"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              onClick={resetTimer}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button 
          onClick={completeTask}
          className="bg-success-gradient"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Task
        </Button>
      </div>
    </div>
  );
}