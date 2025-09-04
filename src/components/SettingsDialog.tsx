import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, Timer, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimerSettings {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  });

  useEffect(() => {
    const saved = localStorage.getItem("timer-settings");
    if (saved) {
      setTimerSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem("timer-settings", JSON.stringify(timerSettings));
    localStorage.setItem("settings-updated", Date.now().toString());
    toast({
      title: "Settings saved",
      description: "Your timer preferences have been updated.",
    });
    onOpenChange(false);
  };

  const exportData = () => {
    const data = {
      timerSettings,
      tasks: JSON.parse(localStorage.getItem("tasks") || "[]"),
      statistics: JSON.parse(localStorage.getItem("statistics") || "{}"),
      gamification: JSON.parse(localStorage.getItem("gamification") || "{}"),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focusflow-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported",
      description: "Your FocusFlow data has been downloaded.",
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.timerSettings) {
          localStorage.setItem("timer-settings", JSON.stringify(data.timerSettings));
          setTimerSettings(data.timerSettings);
        }
        if (data.tasks) {
          localStorage.setItem("tasks", JSON.stringify(data.tasks));
        }
        if (data.statistics) {
          localStorage.setItem("statistics", JSON.stringify(data.statistics));
        }
        if (data.gamification) {
          localStorage.setItem("gamification", JSON.stringify(data.gamification));
        }

        toast({
          title: "Data imported",
          description: "Your FocusFlow data has been restored.",
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid file format. Please select a valid FocusFlow backup file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timer Settings</CardTitle>
              <CardDescription>
                Customize your Pomodoro timer intervals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="focus-time">Focus Time (minutes)</Label>
                  <Input
                    id="focus-time"
                    type="number"
                    value={timerSettings.focusTime}
                    onChange={(e) =>
                      setTimerSettings({
                        ...timerSettings,
                        focusTime: parseInt(e.target.value) || 25,
                      })
                    }
                    min="1"
                    max="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short-break">Short Break (minutes)</Label>
                  <Input
                    id="short-break"
                    type="number"
                    value={timerSettings.shortBreak}
                    onChange={(e) =>
                      setTimerSettings({
                        ...timerSettings,
                        shortBreak: parseInt(e.target.value) || 5,
                      })
                    }
                    min="1"
                    max="60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="long-break">Long Break (minutes)</Label>
                  <Input
                    id="long-break"
                    type="number"
                    value={timerSettings.longBreak}
                    onChange={(e) =>
                      setTimerSettings({
                        ...timerSettings,
                        longBreak: parseInt(e.target.value) || 15,
                      })
                    }
                    min="1"
                    max="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="long-break-interval">
                    Long Break Interval (cycles)
                  </Label>
                  <Input
                    id="long-break-interval"
                    type="number"
                    value={timerSettings.longBreakInterval}
                    onChange={(e) =>
                      setTimerSettings({
                        ...timerSettings,
                        longBreakInterval: parseInt(e.target.value) || 4,
                      })
                    }
                    min="2"
                    max="10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Management</CardTitle>
              <CardDescription>
                Export and import your FocusFlow data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={exportData}
                  className="bg-nature-gradient hover:opacity-90 transition-smooth"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                    id="import-file"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("import-file")?.click()}
                    className="transition-smooth"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>
                Choose your preferred theme and color scheme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Theme Mode</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    className="flex-1"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className="flex-1"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Color Themes</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={theme === "nature" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("nature")}
                    className="justify-start"
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    Nature
                  </Button>
                  <Button
                    variant={theme === "ocean" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("ocean")}
                    className="justify-start"
                  >
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    Ocean
                  </Button>
                  <Button
                    variant={theme === "sunset" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("sunset")}
                    className="justify-start"
                  >
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    Sunset
                  </Button>
                  <Button
                    variant={theme === "forest" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("forest")}
                    className="justify-start"
                  >
                    <div className="w-3 h-3 rounded-full bg-emerald-600 mr-2"></div>
                    Forest
                  </Button>
                  <Button
                    variant={theme === "lavender" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("lavender")}
                    className="justify-start"
                  >
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    Lavender
                  </Button>
                  <Button
                    variant={theme === "cherry" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("cherry")}
                    className="justify-start"
                  >
                    <div className="w-3 h-3 rounded-full bg-pink-500 mr-2"></div>
                    Cherry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings} className="bg-nature-gradient">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}