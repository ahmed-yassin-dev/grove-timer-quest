import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface TimerSettings {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

interface TimerState {
  mode: "focus" | "shortBreak" | "longBreak";
  timeLeft: number;
  isRunning: boolean;
  cycle: number;
  currentTask?: string;
  sessionStartTime?: string;
}

interface TaskBlock {
  id: string;
  taskName: string;
  projectName?: string;
  folderName?: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
}

interface Statistics {
  totalSessions: number;
  totalFocusTime: number;
  totalBreakTime: number;
  dailySessions: Record<string, number>;
  monthlySessions: Record<string, number>;
  taskBlocks?: Record<string, TaskBlock[]>; // date -> array of task blocks
}

export default function PomodoroPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [settings, setSettings] = useState<TimerSettings>({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  });

  const [timer, setTimer] = useState<TimerState>({
    mode: "focus",
    timeLeft: 25 * 60, // 25 minutes in seconds
    isRunning: false,
    cycle: 1,
  });

  const [statistics, setStatistics] = useState<Statistics>({
    totalSessions: 0,
    totalFocusTime: 0,
    totalBreakTime: 0,
    dailySessions: {},
    monthlySessions: {},
  });

  // Load settings, statistics, and selected task from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("timer-settings");
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setTimer(prev => ({
        ...prev,
        timeLeft: parsed.focusTime * 60,
      }));
    }

    const savedStats = localStorage.getItem("statistics");
    if (savedStats) {
      setStatistics(JSON.parse(savedStats));
    }

    const savedTimer = localStorage.getItem("timer-state");
    if (savedTimer) {
      setTimer(JSON.parse(savedTimer));
    }

    // Load selected task and clear from storage
    const savedSelectedTask = localStorage.getItem("selectedTask");
    if (savedSelectedTask) {
      const task = JSON.parse(savedSelectedTask);
      setSelectedTask(task);
      setTimer(prev => ({ ...prev, currentTask: task.title }));
      localStorage.removeItem("selectedTask");
    }
  }, []);

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const savedSettings = localStorage.getItem("timer-settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        if (!timer.isRunning) {
          setTimer(prev => ({
            ...prev,
            timeLeft: parsed.focusTime * 60,
          }));
        }
      }
    };

    window.addEventListener("storage", handleSettingsUpdate);
    
    const interval = setInterval(() => {
      const lastUpdate = localStorage.getItem("settings-updated");
      if (lastUpdate && parseInt(lastUpdate) > Date.now() - 1000) {
        handleSettingsUpdate();
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleSettingsUpdate);
      clearInterval(interval);
    };
  }, [timer.isRunning]);

  // Timer countdown effect
  useEffect(() => {
    if (!timer.isRunning || timer.timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        const newTimeLeft = prev.timeLeft - 1;
        const updatedTimer = { ...prev, timeLeft: newTimeLeft };
        localStorage.setItem("timer-state", JSON.stringify(updatedTimer));
        return updatedTimer;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.timeLeft]);

  // Handle timer completion
  useEffect(() => {
    if (timer.timeLeft === 0 && timer.isRunning) {
      handleTimerComplete();
    }
  }, [timer.timeLeft, timer.isRunning]);

  const handleTimerComplete = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);
    const now = new Date().toISOString();

    let newStatistics = { ...statistics };
    
    // Ensure taskBlocks exists
    if (!newStatistics.taskBlocks) {
      newStatistics.taskBlocks = {};
    }
    if (!newStatistics.taskBlocks[today]) {
      newStatistics.taskBlocks[today] = [];
    }
    
    // Log task block with time details
    if (timer.sessionStartTime) {
      const startTime = new Date(timer.sessionStartTime);
      const endTime = new Date(now);
      const duration = (endTime.getTime() - startTime.getTime()) / 60000; // minutes
      
      // Get task project/folder info
      let projectName, folderName;
      if (selectedTask) {
        const savedTasks = localStorage.getItem("tasks");
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks);
          const task = tasks.find((t: any) => t.id === selectedTask.id);
          if (task) {
            projectName = task.project;
            folderName = task.folder;
          }
        }
      }
      
      const taskBlock = {
        id: `${now}-${Math.random()}`,
        taskName: timer.currentTask || 'Untitled Session',
        projectName,
        folderName,
        startTime: timer.sessionStartTime,
        endTime: now,
        duration,
        type: timer.mode as 'focus' | 'break',
        completed: timer.mode === 'focus'
      };
      
      newStatistics.taskBlocks[today].push(taskBlock);
    }
    
    if (timer.mode === "focus") {
      newStatistics.totalSessions += 1;
      newStatistics.totalFocusTime += settings.focusTime;
      newStatistics.dailySessions[today] = (newStatistics.dailySessions[today] || 0) + 1;
      newStatistics.monthlySessions[thisMonth] = (newStatistics.monthlySessions[thisMonth] || 0) + 1;
      
      // Update gamification (add fish to pond)
      const gamification = JSON.parse(localStorage.getItem("gamification") || '{"fish": 0, "leaves": 0}');
      gamification.fish += 1;
      localStorage.setItem("gamification", JSON.stringify(gamification));
      
      // Update selected task pomodoro count
      if (selectedTask) {
        const savedTasks = localStorage.getItem("tasks");
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks);
          const updatedTasks = tasks.map((task: any) =>
            task.id === selectedTask.id
              ? { ...task, pomodoroCount: task.pomodoroCount + 1, timeSpent: task.timeSpent + settings.focusTime }
              : task
          );
          localStorage.setItem("tasks", JSON.stringify(updatedTasks));
        }
      }
      
      toast({
        title: "Focus session completed! 🎣",
        description: selectedTask 
          ? `Great work on "${selectedTask.title}"! A new fish has been added to your pond!`
          : "A new fish has been added to your pond!",
      });
    } else {
      newStatistics.totalBreakTime += timer.mode === "shortBreak" ? settings.shortBreak : settings.longBreak;
      
      toast({
        title: "Break completed! ✨",
        description: "Ready for another focus session?",
      });
    }

    setStatistics(newStatistics);
    localStorage.setItem("statistics", JSON.stringify(newStatistics));

    // Determine next timer mode
    let nextMode: "focus" | "shortBreak" | "longBreak";
    let nextCycle = timer.cycle;
    
    if (timer.mode === "focus") {
      if (timer.cycle % settings.longBreakInterval === 0) {
        nextMode = "longBreak";
      } else {
        nextMode = "shortBreak";
      }
    } else {
      nextMode = "focus";
      if (timer.mode === "shortBreak" || timer.mode === "longBreak") {
        nextCycle += 1;
      }
    }

    const nextTimeLeft = nextMode === "focus" 
      ? settings.focusTime * 60
      : nextMode === "shortBreak" 
        ? settings.shortBreak * 60
        : settings.longBreak * 60;

    setTimer({
      mode: nextMode,
      timeLeft: nextTimeLeft,
      isRunning: false,
      cycle: nextCycle,
      currentTask: timer.currentTask,
      sessionStartTime: undefined,
    });
  }, [timer, settings, statistics, selectedTask, toast]);

  const toggleTimer = () => {
    setTimer(prev => {
      const newIsRunning = !prev.isRunning;
      const now = new Date().toISOString();
      
      return {
        ...prev,
        isRunning: newIsRunning,
        sessionStartTime: newIsRunning && !prev.sessionStartTime ? now : prev.sessionStartTime,
      };
    });
  };

  const resetTimer = () => {
    const timeLeft = timer.mode === "focus" 
      ? settings.focusTime * 60
      : timer.mode === "shortBreak" 
        ? settings.shortBreak * 60
        : settings.longBreak * 60;
        
    setTimer(prev => ({
      ...prev,
      timeLeft,
      isRunning: false,
      sessionStartTime: undefined,
    }));
    localStorage.removeItem("timer-state");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalTime = () => {
    return timer.mode === "focus" 
      ? settings.focusTime * 60
      : timer.mode === "shortBreak" 
        ? settings.shortBreak * 60
        : settings.longBreak * 60;
  };

  const getProgress = () => {
    return ((getTotalTime() - timer.timeLeft) / getTotalTime()) * 100;
  };

  const getModeTitle = () => {
    switch (timer.mode) {
      case "focus": return "Focus Session";
      case "shortBreak": return "Short Break";
      case "longBreak": return "Long Break";
    }
  };

  const getModeClass = () => {
    switch (timer.mode) {
      case "focus": return timer.isRunning ? "timer-focus" : "bg-card";
      case "shortBreak": 
      case "longBreak": 
        return timer.isRunning ? "timer-break" : "bg-card";
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 bg-nature-gradient bg-clip-text text-transparent">
            Pomodoro Timer
          </h1>
          <p className="text-muted-foreground">
            Stay focused with the Pomodoro Technique
          </p>
        </div>

        <Card className={`${getModeClass()} transition-smooth shadow-card`}>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {getModeTitle()} - Cycle {timer.cycle}
            </CardTitle>
            {timer.currentTask && (
              <div className="mt-2 p-3 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Working on:</p>
                <p className="font-medium">{timer.currentTask}</p>
                {selectedTask && (
                  <div className="flex gap-2 mt-2 justify-center">
                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                      🍅 {selectedTask.pomodoroCount || 0} cycles
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/tasks")}
                      className="text-xs h-6"
                    >
                      Back to Tasks
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl font-mono font-bold">
              {formatTime(timer.timeLeft)}
            </div>
            
            <Progress 
              value={getProgress()} 
              className="h-3"
            />
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={toggleTimer}
                size="lg"
                className="bg-nature-gradient hover:opacity-90 transition-smooth"
              >
                {timer.isRunning ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className="transition-smooth"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {statistics.totalSessions}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Sessions
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">
                {Math.floor(statistics.totalFocusTime / 60)}h {statistics.totalFocusTime % 60}m
              </div>
              <div className="text-sm text-muted-foreground">
                Focus Time
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-pond-blue">
                {Object.values(statistics.dailySessions).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Today's Sessions
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}