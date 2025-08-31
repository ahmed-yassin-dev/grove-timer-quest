import { useState, useEffect } from "react";
import { Calendar, Clock, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Statistics {
  totalSessions: number;
  totalFocusTime: number;
  totalBreakTime: number;
  dailySessions: Record<string, number>;
  monthlySessions: Record<string, number>;
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics>({
    totalSessions: 0,
    totalFocusTime: 0,
    totalBreakTime: 0,
    dailySessions: {},
    monthlySessions: {},
  });

  useEffect(() => {
    const savedStats = localStorage.getItem("statistics");
    if (savedStats) {
      setStatistics(JSON.parse(savedStats));
    }

    const interval = setInterval(() => {
      const currentStats = localStorage.getItem("statistics");
      if (currentStats) {
        setStatistics(JSON.parse(currentStats));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? ` ${mins}m` : ""}`;
  };

  const getTodaysSessions = () => {
    const today = new Date().toISOString().split('T')[0];
    return statistics.dailySessions[today] || 0;
  };

  const getThisMonthsSessions = () => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return statistics.monthlySessions[thisMonth] || 0;
  };

  const getWeeklyAverage = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const weekSessions = last7Days.reduce((sum, date) => {
      return sum + (statistics.dailySessions[date] || 0);
    }, 0);

    return Math.round(weekSessions / 7 * 10) / 10;
  };

  const getRecentDays = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        sessions: statistics.dailySessions[date.toISOString().split('T')[0]] || 0,
      };
    }).reverse();

    return last30Days;
  };

  const recentDays = getRecentDays();
  const maxSessions = Math.max(...recentDays.map(d => d.sessions), 1);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 bg-nature-gradient bg-clip-text text-transparent">
            Statistics
          </h1>
          <p className="text-muted-foreground">
            Track your productivity and focus sessions
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {statistics.totalSessions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time focus sessions
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Focus Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatTime(statistics.totalFocusTime)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total focused minutes
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-pond-blue" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pond-blue">
                {getTodaysSessions()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sessions today
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-fish-orange" />
                Weekly Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fish-orange">
                {getWeeklyAverage()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sessions per day
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Heatmap */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-1">
              {recentDays.map((day, index) => {
                const intensity = day.sessions / maxSessions;
                const opacity = Math.max(0.1, intensity);
                
                return (
                  <div
                    key={index}
                    className="aspect-square rounded-sm bg-primary transition-all hover:scale-110 cursor-pointer relative group"
                    style={{ opacity }}
                    title={`${day.date}: ${day.sessions} sessions`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.day}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {[0.1, 0.3, 0.5, 0.7, 1].map((opacity, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-sm bg-primary"
                    style={{ opacity }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Monthly Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statistics.monthlySessions)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 6)
                  .map(([month, sessions]) => {
                    const date = new Date(month + '-01');
                    const monthName = date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    });
                    
                    return (
                      <div key={month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{monthName}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{
                                width: `${(sessions / Math.max(...Object.values(statistics.monthlySessions))) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold w-8 text-right">
                            {sessions}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Productivity Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5">
                <h4 className="font-medium text-primary mb-2">
                  🎯 Focus Streak
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your current daily streak: <span className="font-bold">{getTodaysSessions() > 0 ? '1 day' : '0 days'}</span>
                </p>
              </div>

              <div className="p-4 rounded-lg bg-accent/5">
                <h4 className="font-medium text-accent mb-2">
                  ⏱️ Average Session
                </h4>
                <p className="text-sm text-muted-foreground">
                  Based on your settings: <span className="font-bold">25 minutes</span>
                </p>
              </div>

              <div className="p-4 rounded-lg bg-pond-blue/5">
                <h4 className="font-medium text-pond-blue mb-2">
                  📈 This Month
                </h4>
                <p className="text-sm text-muted-foreground">
                  Total sessions: <span className="font-bold">{getThisMonthsSessions()}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}