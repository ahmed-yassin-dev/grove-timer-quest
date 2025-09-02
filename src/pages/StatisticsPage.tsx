import { useState, useEffect } from "react";
import { Calendar, Clock, Target, ChevronLeft, ChevronRight, CheckCircle, CalendarDays, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

interface Project {
  id: string;
  name: string;
  color: string;
  expanded: boolean;
  folderId?: string;
  completed?: boolean;
}

interface Statistics {
  totalSessions: number;
  totalFocusTime: number;
  totalBreakTime: number;
  dailySessions: Record<string, number>;
  monthlySessions: Record<string, number>;
  dailyFocusTime: Record<string, number>;
  taskBlocks: Record<string, TaskBlock[]>; // date -> array of task blocks
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics>({
    totalSessions: 0,
    totalFocusTime: 0,
    totalBreakTime: 0,
    dailySessions: {},
    monthlySessions: {},
    dailyFocusTime: {},
    taskBlocks: {},
  });
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'detail'>('calendar');

  useEffect(() => {
    const loadData = () => {
      const savedStats = localStorage.getItem("statistics");
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        // Ensure all required fields exist
        if (!parsed.dailyFocusTime) {
          parsed.dailyFocusTime = {};
        }
        if (!parsed.taskBlocks) {
          parsed.taskBlocks = {};
        }
        setStatistics(parsed);
      }

      // Load tasks and projects
      const savedTasks = localStorage.getItem("tasks");
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      
      const savedProjects = localStorage.getItem("projects");
      if (savedProjects) setProjects(JSON.parse(savedProjects));
    };

    loadData();
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      sessions: statistics.dailySessions[today] || 0,
      focusTime: statistics.dailyFocusTime[today] || 0
    };
  };

  const getCurrentMonthStats = () => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const sessions = statistics.monthlySessions[thisMonth] || 0;
    const focusTime = Object.entries(statistics.dailyFocusTime)
      .filter(([date]) => date.startsWith(thisMonth))
      .reduce((sum, [, time]) => sum + time, 0);
    return { sessions, focusTime };
  };

  const getCompletedTaskCounts = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = getWeekStart(new Date());
    
    const completedTasks = tasks.filter(task => task.completed);
    const totalCompleted = completedTasks.length;
    
    const todayCompleted = completedTasks.filter(task => {
      const taskCompletedDate = new Date(task.createdAt).toISOString().split('T')[0];
      return taskCompletedDate === today;
    }).length;
    
    const weekCompleted = completedTasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= thisWeek && taskDate <= new Date();
    }).length;

    return { totalCompleted, todayCompleted, weekCompleted };
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const sessions = statistics.dailySessions[dateString] || 0;
      const focusTime = statistics.dailyFocusTime[dateString] || 0;
      
      days.push({
        day,
        date: dateString,
        sessions,
        focusTime,
        isToday: dateString === new Date().toISOString().split('T')[0],
      });
    }
    
    return days;
  };

  const getProjectColor = (projectName?: string, folderName?: string) => {
    const colors = [
      'bg-primary/20 text-primary',
      'bg-pond-blue/20 text-pond-blue', 
      'bg-tree-green/20 text-tree-green',
      'bg-fish-orange/20 text-fish-orange',
      'bg-accent/20 text-accent',
      'bg-secondary/20 text-secondary-foreground'
    ];
    
    const name = projectName || folderName || 'default';
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getDayBlocks = (date: string) => {
    return statistics.taskBlocks[date] || [];
  };

  // --- START: Updated Timeline Graph for Each Day ---
  const renderDayDetail = (date: string) => {
    const blocks = getDayBlocks(date);
    const uniqueTasks = Array.from(new Set(blocks.map(block => block.taskName)));
    // const maxTaskNameLength = Math.max(...uniqueTasks.map(name => name.length), 10);

    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
            <Button variant="outline" onClick={() => setViewMode('calendar')}>
              Back to Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Timeline Graph */}
            <div className="relative bg-muted/30 rounded-lg p-6 overflow-x-auto" style={{ minHeight: 600 }}>
              <div className="flex gap-4">
                {/* Y-axis (Hours) */}
                <div className="flex flex-col justify-between py-2" style={{ height: 480 }}>
                  {Array.from({ length: 25 }, (_, i) => (
                    <div key={i} className="text-xs text-muted-foreground font-mono min-h-[19px] flex items-center" style={{ height: 19.2 }}>
                      {i.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Graph Area */}
                <div
                  className="relative border-l border-border/50"
                  style={{ height: 480, minWidth: `${uniqueTasks.length * 120}px` }}
                >
                  {/* Vertical task columns */}
                  {uniqueTasks.map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-full border-l border-border/30"
                      style={{
                        left: `${(i / uniqueTasks.length) * 100}%`,
                        width: 0,
                      }}
                    />
                  ))}

                  {/* Horizontal hour grid lines */}
                  {Array.from({ length: 25 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute w-full border-t border-border/20"
                      style={{
                        top: `${(i / 24) * 100}%`,
                        left: 0,
                        right: 0,
                      }}
                    />
                  ))}

                  {/* Task blocks */}
                  {uniqueTasks.map((taskName, taskIdx) => {
                    const taskBlocks = blocks.filter((b) => b.taskName === taskName);
                    const left = (taskIdx / uniqueTasks.length) * 100;
                    const width = 100 / uniqueTasks.length;

                    return taskBlocks.map((block) => {
                      const start = new Date(block.startTime);
                      const end = new Date(block.endTime);
                      const startHour = start.getHours() + start.getMinutes() / 60;
                      const endHour = end.getHours() + end.getMinutes() / 60;
                      const topPercent = (startHour / 24) * 100;
                      const bottomPercent = (endHour / 24) * 100;
                      const blockHeight = Math.max(bottomPercent - topPercent, 2); // at least 2%

                      return (
                        <div
                          key={block.id}
                          className={`absolute flex items-center justify-center font-semibold text-xs rounded shadow-sm border border-current/40 ${getProjectColor(block.projectName, block.folderName)}`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            top: `${topPercent}%`,
                            height: `${blockHeight}%`,
                            minHeight: 18,
                            padding: 2,
                            transition: 'box-shadow 0.2s',
                            zIndex: 2,
                            textAlign: 'center'
                          }}
                          title={`${block.taskName}\n${start.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`}
                        >
                          <span style={{ width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {block.taskName}
                          </span>
                        </div>
                      );
                    });
                  })}

                  {/* X-axis task labels */}
                  <div className="absolute left-0 right-0 -bottom-10 flex" style={{ height: 28 }}>
                    {uniqueTasks.map((taskName, i) => (
                      <div
                        key={taskName}
                        className="text-xs font-medium text-center px-2 truncate"
                        style={{
                          width: `${100 / uniqueTasks.length}%`
                        }}
                        title={taskName}
                      >
                        {taskName}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* End Timeline Graph */}

            {/* Legend */}
            {uniqueTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tasks</h4>
                <div className="flex flex-wrap gap-2">
                  {uniqueTasks.map(taskName => {
                    const taskBlocks = blocks.filter(block => block.taskName === taskName);
                    const totalTime = taskBlocks.reduce((sum, block) => sum + block.duration, 0);
                    const projectName = taskBlocks[0]?.projectName;
                    const folderName = taskBlocks[0]?.folderName;
                    
                    return (
                      <div key={taskName} className={`px-3 py-1 rounded text-sm ${getProjectColor(projectName, folderName)}`}>
                        {taskName} ({formatTime(totalTime)})
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  // --- END: Updated Timeline Graph for Each Day ---

  const todayStats = getTodayStats();
  const monthStats = getCurrentMonthStats();
  const monthDays = getMonthDays();
  const completedCounts = getCompletedTaskCounts();

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 bg-nature-gradient bg-clip-text text-transparent">
            Statistics
          </h1>
          <p className="text-muted-foreground">Track your productivity and focus sessions</p>
        </div>

        {/* Enhanced Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Daily Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">{todayStats.sessions} sessions</div>
                <div className="text-lg font-medium text-accent">{formatTime(todayStats.focusTime)}</div>
                <p className="text-xs text-muted-foreground">Today's focus time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-pond-blue" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-pond-blue">{monthStats.sessions} sessions</div>
                <div className="text-lg font-medium text-fish-orange">{formatTime(monthStats.focusTime)}</div>
                <p className="text-xs text-muted-foreground">Monthly focus time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-tree-green" />
                All Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-tree-green">{statistics.totalSessions} sessions</div>
                <div className="text-lg font-medium text-accent">{formatTime(statistics.totalFocusTime)}</div>
                <p className="text-xs text-muted-foreground">Total focus time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Tasks Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">{completedCounts.todayCompleted}</div>
                <p className="text-xs text-muted-foreground">Completed today</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-pond-blue" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-pond-blue">{completedCounts.weekCompleted}</div>
                <p className="text-xs text-muted-foreground">Tasks completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-fish-orange" />
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-fish-orange">{completedCounts.totalCompleted}</div>
                <p className="text-xs text-muted-foreground">All time completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar/Detail View */}
        {viewMode === 'calendar' ? (
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activity Calendar</CardTitle>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[120px] text-center">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {monthDays.map((day, index) => (
                    <div
                      key={index}
                      className={`aspect-square p-2 rounded-lg border transition-colors cursor-pointer
                        ${!day ? 'invisible' : 'hover:bg-muted/50'}
                        ${day?.isToday ? 'bg-primary/10 border-primary' : 'border-border'}
                        ${selectedDate === day?.date ? 'bg-accent/20' : ''}
                      `}
                      onClick={() => {
                         if (day) {
                           setSelectedDate(day.date);
                           setViewMode('detail');
                         }
                       }}
                    >
                      {day && (
                        <div className="h-full flex flex-col items-center justify-center text-sm">
                          <span className="font-medium">{day.day}</span>
                          {day.sessions > 0 && (
                            <div className="text-xs mt-1 space-y-1">
                              <div className="text-primary font-medium">{day.sessions}</div>
                              <div className="text-muted-foreground">{formatTime(day.focusTime)}</div>
                            </div>
                          )}
                          {getDayBlocks(day.date).length > 0 && (
                            <div className="w-full mt-1 space-y-1">
                              {getDayBlocks(day.date).slice(0, 2).map(block => (
                                <div key={block.id} className={`text-xs px-1 py-0.5 rounded truncate ${getProjectColor(block.projectName, block.folderName)}`}>
                                  {block.taskName}
                                </div>
                              ))}
                              {getDayBlocks(day.date).length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{getDayBlocks(day.date).length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          selectedDate && renderDayDetail(selectedDate)
        )}
      </div>
    </div>
  );
}
