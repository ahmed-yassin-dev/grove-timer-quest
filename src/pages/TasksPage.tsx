import { useState, useEffect } from "react";
import { 
  Plus, 
  Timer, 
  Check, 
  Trash2, 
  FolderPlus, 
  Tag, 
  ChevronDown, 
  ChevronRight,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TaskTimer } from "@/components/TaskTimer";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  pomodoroCount: number;
  timeSpent: number; // in minutes
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
}

interface Folder {
  id: string;
  name: string;
  expanded: boolean;
}

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    const savedProjects = localStorage.getItem("projects");
    if (savedProjects) setProjects(JSON.parse(savedProjects));

    const savedFolders = localStorage.getItem("folders");
    if (savedFolders) setFolders(JSON.parse(savedFolders));
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("folders", JSON.stringify(folders));
  }, [folders]);

  const addTask = () => {
    if (!newTask.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      pomodoroCount: 0,
      timeSpent: 0,
      tags: [],
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, task]);
    setNewTask("");
  };

  const addProject = () => {
    if (!newProject.trim()) return;

    const project: Project = {
      id: Date.now().toString(),
      name: newProject,
      color: `hsl(${Math.floor(Math.random() * 360)}, 60%, 50%)`,
      expanded: true,
    };

    setProjects([...projects, project]);
    setNewProject("");
  };

  const addFolder = () => {
    if (!newFolder.trim()) return;

    const folder: Folder = {
      id: Date.now().toString(),
      name: newFolder,
      expanded: true,
    };

    setFolders([...folders, folder]);
    setNewFolder("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id && !task.completed) {
        // Add a leaf to the tree when completing a task
        const gamification = JSON.parse(localStorage.getItem("gamification") || '{"fish": 0, "leaves": 0}');
        gamification.leaves += 1;
        localStorage.setItem("gamification", JSON.stringify(gamification));
        
        toast({
          title: "Task completed! 🌱",
          description: "A new leaf has been added to your tree!",
        });
      }
      return task.id === id ? { ...task, completed: !task.completed } : task;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const startTimer = (task: Task) => {
    setSelectedTask(task);
    setTimerDialogOpen(true);
  };

  const onTimerComplete = (pomodoroCount: number, timeSpent: number) => {
    if (selectedTask) {
      setTasks(tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, pomodoroCount, timeSpent }
          : task
      ));
    }
    setTimerDialogOpen(false);
    setSelectedTask(null);
  };

  const moveTaskToProject = (taskId: string, projectId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, projectId, folderId: undefined } : task
    ));
  };

  const moveTaskToFolder = (taskId: string, folderId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, folderId, projectId: undefined } : task
    ));
  };

  const toggleProjectExpanded = (projectId: string) => {
    setProjects(projects.map(project =>
      project.id === projectId ? { ...project, expanded: !project.expanded } : project
    ));
  };

  const toggleFolderExpanded = (folderId: string) => {
    setFolders(folders.map(folder =>
      folder.id === folderId ? { ...folder, expanded: !folder.expanded } : folder
    ));
  };

  const getTasksByCategory = () => {
    const activeTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);
    
    return {
      orphanTasks: activeTasks.filter(task => !task.projectId && !task.folderId),
      projectTasks: projects.map(project => ({
        project,
        tasks: activeTasks.filter(task => task.projectId === project.id)
      })),
      folderTasks: folders.map(folder => ({
        folder,
        tasks: activeTasks.filter(task => task.folderId === folder.id)
      })),
      completedTasks
    };
  };

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const { orphanTasks, projectTasks, folderTasks, completedTasks } = getTasksByCategory();

  const TaskItem = ({ task, isNested = false }: { task: Task; isNested?: boolean }) => (
    <Card className={`${isNested ? 'ml-6 border-l-4 border-l-muted' : ''} transition-smooth hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleTask(task.id)}
              className={task.completed ? "text-accent" : ""}
            >
              <Check className={`h-4 w-4 ${task.completed ? "text-accent" : "text-muted-foreground"}`} />
            </Button>
            
            <div className="flex-1">
              <p className={`${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {task.pomodoroCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    🍅 {task.pomodoroCount}
                  </Badge>
                )}
                {task.timeSpent > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimeSpent(task.timeSpent)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!task.completed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTimer(task)}
                className="hover:bg-primary/10"
              >
                <Timer className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTask(task.id)}
              className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-nature-gradient bg-clip-text text-transparent">
            Tasks
          </h1>
          <Button
            variant="outline"
            onClick={() => setShowCompleted(!showCompleted)}
            className="transition-smooth"
          >
            {showCompleted ? "Hide" : "Show"} Completed ({completedTasks.length})
          </Button>
        </div>

        {/* Add new task */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTask()}
                className="flex-1"
              />
              <Button onClick={addTask} className="bg-nature-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add project and folder */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New project..."
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addProject()}
                />
                <Button onClick={addProject} variant="outline">
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New folder..."
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addFolder()}
                />
                <Button onClick={addFolder} variant="outline">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orphan tasks */}
        {orphanTasks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Tasks</h2>
            {orphanTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* Project tasks */}
        {projectTasks.map(({ project, tasks: projectTasksList }) => (
          <div key={project.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleProjectExpanded(project.id)}
              >
                {project.expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <h2 className="text-xl font-semibold" style={{ color: project.color }}>
                {project.name} ({projectTasksList.length})
              </h2>
            </div>
            {project.expanded && projectTasksList.map(task => (
              <TaskItem key={task.id} task={task} isNested />
            ))}
          </div>
        ))}

        {/* Folder tasks */}
        {folderTasks.map(({ folder, tasks: folderTasksList }) => (
          <div key={folder.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFolderExpanded(folder.id)}
              >
                {folder.expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <h2 className="text-xl font-semibold text-muted-foreground">
                📁 {folder.name} ({folderTasksList.length})
              </h2>
            </div>
            {folder.expanded && folderTasksList.map(task => (
              <TaskItem key={task.id} task={task} isNested />
            ))}
          </div>
        ))}

        {/* Completed tasks */}
        {showCompleted && completedTasks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-muted-foreground">
              Completed ({completedTasks.length})
            </h2>
            {completedTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* Task Timer Dialog */}
        <Dialog open={timerDialogOpen} onOpenChange={setTimerDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Focus Timer</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <TaskTimer
                task={selectedTask}
                onComplete={onTimerComplete}
                onClose={() => setTimerDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}