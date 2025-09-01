import { useState, useEffect } from "react";
import { Calendar, Clock, Target, ChevronLeft, ChevronRight } from "lucide-react";
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

  const renderDayDetail = (date: string) => {
    const blocks = getDayBlocks(date);
    const hours = Array.from({ length: 24 }, (_, i) => i);

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
          <div className="space-y-2">
            {hours.map(hour => {
              const hourBlocks = blocks.filter(block => {
                const startHour = new Date(block.startTime).getHours();
                return startHour === hour;
              });

              return (
                <div key={hour} className="flex items-center gap-4 py-2 border-b border-border/50">
                  <div className="w-16 text-sm font-mono text-muted-foreground">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 min-h-[32px] flex items-center gap-2">
                    {hourBlocks.map(block => (
                      <div
                        key={block.id}
                        className={`px-3 py-1 rounded text-sm font-medium ${getProjectColor(block.projectName, block.folderName)}`}
                      >
                        {block.taskName} ({Math.round(block.duration)}m)
                        {block.type === 'focus' && ' 🍅'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const todayStats = getTodayStats();
  const monthStats = getCurrentMonthStats();
  const monthDays = getMonthDays();

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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