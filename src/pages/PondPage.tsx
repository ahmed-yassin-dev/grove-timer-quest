import { useState, useEffect } from "react";
import { Waves, Fish } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Gamification {
  fish: number;
  leaves: number;
  lastFed?: string;
}

export default function PondPage() {
  const { toast } = useToast();
  const [gamification, setGamification] = useState<Gamification>({
    fish: 0,
    leaves: 0,
  });
  const [feeding, setFeeding] = useState(false);

  useEffect(() => {
    const loadGamification = () => {
      const saved = localStorage.getItem("gamification");
      if (saved) {
        setGamification(JSON.parse(saved));
      }
    };

    loadGamification();
    
    // Listen for updates
    const interval = setInterval(loadGamification, 1000);
    return () => clearInterval(interval);
  }, []);

  const canFeedFish = () => {
    if (!gamification.lastFed) return true;
    const lastFed = new Date(gamification.lastFed);
    const now = new Date();
    const hoursSinceLastFeed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastFeed >= 4; // Can feed every 4 hours
  };

  const feedFish = () => {
    if (!canFeedFish() || gamification.fish === 0) return;
    
    setFeeding(true);
    const newGamification = {
      ...gamification,
      lastFed: new Date().toISOString(),
    };
    
    setGamification(newGamification);
    localStorage.setItem("gamification", JSON.stringify(newGamification));
    
    toast({
      title: "Fish fed! 🐠",
      description: "Your fish are happy and energized!",
    });

    setTimeout(() => setFeeding(false), 2000);
  };

  const getNextFeedTime = () => {
    if (!gamification.lastFed) return null;
    const lastFed = new Date(gamification.lastFed);
    const nextFeed = new Date(lastFed.getTime() + 4 * 60 * 60 * 1000);
    return nextFeed;
  };

  const getPondLevel = () => {
    const fish = gamification.fish;
    if (fish < 5) return { level: "small", description: "Tiny Puddle" };
    if (fish < 15) return { level: "medium", description: "Growing Pond" };
    if (fish < 30) return { level: "large", description: "Beautiful Lake" };
    if (fish < 60) return { level: "huge", description: "Vast Ocean" };
    return { level: "legendary", description: "Mystical Waters" };
  };

  const getFishTypes = () => {
    const fish = gamification.fish;
    const types = [];
    
    if (fish >= 1) types.push({ name: "Goldfish", emoji: "🐠", count: Math.min(fish, 10) });
    if (fish >= 10) types.push({ name: "Tropical Fish", emoji: "🐟", count: Math.min(fish - 10, 15) });
    if (fish >= 25) types.push({ name: "Angel Fish", emoji: "🪼", count: Math.min(fish - 25, 20) });
    if (fish >= 45) types.push({ name: "Rare Fish", emoji: "🦈", count: Math.min(fish - 45, 15) });
    
    return types;
  };

  const { level, description } = getPondLevel();
  const fishTypes = getFishTypes();
  const nextFeedTime = getNextFeedTime();

  // Generate fish positions for animation
  const fishPositions = Array.from({ length: Math.min(gamification.fish, 20) }, (_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    top: `${20 + Math.random() * 60}%`,
    delay: Math.random() * 4,
    size: 0.8 + Math.random() * 0.4,
    type: i % 4, // Different fish types
  }));

  const fishEmojis = ["🐠", "🐟", "🪼", "🦈"];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 bg-pond-gradient bg-clip-text text-transparent">
            Your Focus Pond
          </h1>
          <p className="text-muted-foreground">
            Every completed pomodoro adds a fish to your pond
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pond Visualization */}
          <div className="lg:col-span-2">
            <Card className="shadow-pond">
              <CardContent className="p-8">
                <div className="relative mx-auto" style={{ maxWidth: '400px', height: '300px' }}>
                  {/* Water background */}
                  <div className="absolute inset-0 bg-pond-gradient rounded-lg opacity-80" />
                  
                  {/* Water surface effects */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent rounded-lg" />
                  
                  {/* Ripple effects */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-20 h-20 border-2 border-white/20 rounded-full animate-ripple"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                          animationDelay: `${i * 2}s`,
                          animationDuration: '4s',
                        }}
                      />
                    ))}
                  </div>
                  
                   {/* Fish */}
                   {gamification.fish === 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center">
                       <div className="text-center text-white/80">
                         <Waves className="w-16 h-16 mx-auto mb-4 animate-float" />
                         <p className="text-lg font-medium">Empty Pond</p>
                         <p className="text-sm">Complete pomodoros to add fish!</p>
                       </div>
                     </div>
                   ) : (
                     fishPositions.map((fish) => (
                       <div
                         key={fish.id}
                         className="absolute transition-all duration-1000 animate-fish-swim cursor-pointer hover:scale-110"
                         style={{
                           left: fish.left,
                           top: fish.top,
                           animationDelay: `${fish.delay}s`,
                           transform: `scale(${fish.size})`,
                         }}
                         title={`Fish ${fish.id + 1}`}
                       >
                         <div className={`text-2xl ${feeding ? 'animate-grow' : ''}`}>
                           {fishEmojis[fish.type]}
                         </div>
                       </div>
                     ))
                   )}
                  
                  {/* Bubbles */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-white/40 rounded-full animate-float"
                        style={{
                          left: `${Math.random() * 100}%`,
                          bottom: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 3}s`,
                          animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Food animation when feeding */}
                  {feeding && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-4xl animate-bounce">🍞</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pond Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5 text-pond-blue" />
                  Pond Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Pond Level</div>
                  <div className="text-xl font-bold text-pond-blue">
                    {description}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Total Fish</div>
                  <div className="text-2xl font-bold text-fish-orange">
                    {gamification.fish}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Fish Species</div>
                  <div className="text-lg font-medium text-primary">
                    {fishTypes.length} Types
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fish Species */}
            {fishTypes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fish Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fishTypes.map((type, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{type.emoji}</span>
                          <span className="text-sm font-medium">{type.name}</span>
                        </div>
                        <span className="text-sm font-bold">{type.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feed Fish */}
            <Card>
              <CardHeader>
                <CardTitle>Feed Your Fish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={feedFish}
                  disabled={!canFeedFish() || gamification.fish === 0 || feeding}
                  className="w-full bg-pond-gradient hover:opacity-90"
                >
                  <Fish className="h-4 w-4 mr-2" />
                  {feeding ? "Feeding..." : "Feed Fish"}
                </Button>
                
                {!canFeedFish() && nextFeedTime && (
                  <p className="text-xs text-muted-foreground text-center">
                    Next feeding available at{" "}
                    {nextFeedTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                )}
                
                {gamification.fish === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Complete pomodoro sessions to add fish to your pond!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}