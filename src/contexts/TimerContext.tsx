import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { playFocusCompleteSound, playBreakCompleteSound, playLongBreakSound } from "@/utils/sounds";

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
  taskBlocks?: Record<string, TaskBlock[]>;
}

interface TimerContextType {
  timer: TimerState;
  settings: TimerSettings;
  statistics: Statistics;
  selectedTask: any;
  toggleTimer: () => void;
  resetTimer: () => void;
  setSelectedTask: (task: any) => void;
  completeCurrentTask: () => void;
  clearCurrentTask: () => void;
  updateSettings: (newSettings: TimerSettings) => void;
  formatTime: (seconds: number) => string;
  getTotalTime: () => number;
  getProgress: () => number;
  getModeTitle: () => string;
  getModeClass: () => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [settings, setSettings] = useState<TimerSettings>({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  });

  const [timer, setTimer] = useState<TimerState>({
    mode: "focus",
    timeLeft: 25 * 60,
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

  // Load initial data from localStorage
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
      const timerState = JSON.parse(savedTimer);
      // Prevent false completions on page reload - if timer was completed, reset it
      if (timerState.timeLeft === 0) {
        timerState.timeLeft = timerState.mode === "focus" 
          ? (savedSettings ? JSON.parse(savedSettings).focusTime * 60 : 25 * 60)
          : timerState.mode === "shortBreak" 
            ? (savedSettings ? JSON.parse(savedSettings).shortBreak * 60 : 5 * 60)
            : (savedSettings ? JSON.parse(savedSettings).longBreak * 60 : 15 * 60);
        timerState.isRunning = false;
        timerState.sessionStartTime = undefined;
      }
      setTimer(timerState);
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

  // Global timer countdown effect - runs regardless of current page
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
    // Use local date for Algeria timezone
    const localDate = new Date();
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    const today = localDate.toISOString().split('T')[0];
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
      
      // Update gamification (add leaves to tree)
      const gamification = JSON.parse(localStorage.getItem("gamification") || '{"fish": 0, "leaves": 0}');
      gamification.leaves += 1;
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

      // Play focus complete sound
      playFocusCompleteSound().catch(console.warn);
      
      // Check if next is long break to play special sound
      const nextCycle = timer.cycle + 1;
      if (nextCycle % settings.longBreakInterval === 0) {
        // Play long break sound after a delay
        setTimeout(() => playLongBreakSound().catch(console.warn), 1000);
        toast({
          title: "Focus session completed! 🏆",
          description: selectedTask 
            ? `Amazing work on "${selectedTask.title}"! Time for a long break!`
            : "Incredible focus! Time for a long break!",
        });
      } else {
        toast({
          title: "Focus session completed! 🌱",
          description: selectedTask 
            ? `Great work on "${selectedTask.title}"! Your tree has grown!`
            : "Your tree has grown!",
        });
      }
    } else {
      newStatistics.totalBreakTime += timer.mode === "shortBreak" ? settings.shortBreak : settings.longBreak;
      
      // Play break complete sound
      playBreakCompleteSound().catch(console.warn);
      
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
      
      const updatedTimer = {
        ...prev,
        isRunning: newIsRunning,
        sessionStartTime: newIsRunning && !prev.sessionStartTime ? now : prev.sessionStartTime,
      };
      
      localStorage.setItem("timer-state", JSON.stringify(updatedTimer));
      return updatedTimer;
    });
  };

  const resetTimer = () => {
    const timeLeft = timer.mode === "focus" 
      ? settings.focusTime * 60
      : timer.mode === "shortBreak" 
        ? settings.shortBreak * 60
        : settings.longBreak * 60;
        
    const updatedTimer = {
      ...timer,
      timeLeft,
      isRunning: false,
      sessionStartTime: undefined,
    };
    
    setTimer(updatedTimer);
    localStorage.setItem("timer-state", JSON.stringify(updatedTimer));
  };

  const completeCurrentTask = () => {
    if (!selectedTask) return;
    
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks);
      const updatedTasks = tasks.map((task: any) =>
        task.id === selectedTask.id
          ? { ...task, completed: true }
          : task
      );
      localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      
      // Add a leaf to the tree when completing a task
      const gamification = JSON.parse(localStorage.getItem("gamification") || '{"fish": 0, "leaves": 0}');
      gamification.leaves += 1;
      localStorage.setItem("gamification", JSON.stringify(gamification));
      
      toast({
        title: "Task completed! 🌱",
        description: `"${selectedTask.title}" marked as complete! A new leaf has been added to your tree!`,
      });
    }
    
    // Clear the current task
    clearCurrentTask();
  };

  const clearCurrentTask = () => {
    setSelectedTask(null);
    setTimer(prev => ({ ...prev, currentTask: undefined }));
    
    toast({
      title: "Task cleared",
      description: "No task selected for focus session",
    });
  };

  const updateSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    localStorage.setItem("timer-settings", JSON.stringify(newSettings));
    localStorage.setItem("settings-updated", Date.now().toString());
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

  const value = {
    timer,
    settings,
    statistics,
    selectedTask,
    toggleTimer,
    resetTimer,
    setSelectedTask,
    completeCurrentTask,
    clearCurrentTask,
    updateSettings,
    formatTime,
    getTotalTime,
    getProgress,
    getModeTitle,
    getModeClass,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}