import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTimer } from "@/contexts/TimerContext";
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
  const navigate = useNavigate();
  const {
    timer,
    settings,
    statistics,
    selectedTask,
    toggleTimer,
    resetTimer,
    setSelectedTask,
    formatTime,
    getTotalTime,
    getProgress,
    getModeTitle,
    getModeClass,
  } = useTimer();

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