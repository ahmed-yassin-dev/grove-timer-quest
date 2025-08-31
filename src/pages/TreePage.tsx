import { useState, useEffect } from "react";
import { TreePine, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Gamification {
  fish: number;
  leaves: number;
}

export default function TreePage() {
  const [gamification, setGamification] = useState<Gamification>({
    fish: 0,
    leaves: 0,
  });

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

  const getTreeSize = () => {
    const leaves = gamification.leaves;
    if (leaves < 5) return { size: "small", height: "h-32" };
    if (leaves < 15) return { size: "medium", height: "h-48" };
    if (leaves < 30) return { size: "large", height: "h-64" };
    return { size: "giant", height: "h-80" };
  };

  const getTreeStage = () => {
    const leaves = gamification.leaves;
    if (leaves === 0) return "seed";
    if (leaves < 3) return "sprout";
    if (leaves < 8) return "sapling";
    if (leaves < 20) return "young";
    if (leaves < 40) return "mature";
    return "ancient";
  };

  const getTreeDescription = () => {
    const stage = getTreeStage();
    switch (stage) {
      case "seed":
        return "Your productivity journey starts here. Complete tasks to plant your first seed!";
      case "sprout":
        return "A tiny sprout has emerged! Your consistency is taking root.";
      case "sapling":
        return "Your sapling is growing strong! Keep completing tasks to help it flourish.";
      case "young":
        return "A beautiful young tree! Your productivity habits are well established.";
      case "mature":
        return "A mature, magnificent tree! You've built incredible productivity momentum.";
      case "ancient":
        return "An ancient, wise tree! You are a master of productivity and focus.";
    }
  };

  const { size, height } = getTreeSize();
  const stage = getTreeStage();

  // Generate leaf positions for animation
  const leafPositions = Array.from({ length: Math.min(gamification.leaves, 50) }, (_, i) => ({
    id: i,
    left: `${20 + Math.random() * 60}%`,
    top: `${20 + Math.random() * 60}%`,
    delay: Math.random() * 2,
    size: 0.8 + Math.random() * 0.4,
  }));

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 bg-nature-gradient bg-clip-text text-transparent">
            Your Productivity Tree
          </h1>
          <p className="text-muted-foreground">
            Every completed task adds a leaf to your tree
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tree Visualization */}
          <div className="lg:col-span-2">
            <Card className="shadow-nature">
              <CardContent className="p-8">
                <div className="relative mx-auto" style={{ maxWidth: '400px', minHeight: '300px' }}>
                  {/* Sky background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-200 to-green-100 rounded-lg" />
                  
                  {/* Ground */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-tree-brown to-green-200 rounded-b-lg" />
                  
                  {/* Tree trunk - only show if sprout or higher */}
                  {stage !== "seed" && (
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-6 bg-tree-brown rounded-t-lg animate-float"
                         style={{ height: `${Math.min(gamification.leaves * 3, 80)}px` }} />
                  )}
                  
                  {/* Seed */}
                  {stage === "seed" && (
                    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                      <div className="w-3 h-3 bg-tree-brown rounded-full animate-grow" />
                    </div>
                  )}
                  
                  {/* Tree crown */}
                  {stage !== "seed" && (
                    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                      <div className={`relative ${height} w-40 mx-auto`}>
                        {/* Base tree shape */}
                        <TreePine 
                          className={`w-full h-full text-tree-green transition-all duration-1000 ${
                            stage === "sprout" ? "opacity-60" : "opacity-90"
                          }`}
                        />
                        
                        {/* Animated leaves */}
                        {leafPositions.map((leaf) => (
                          <div
                            key={leaf.id}
                            className="absolute animate-leaf-fall"
                            style={{
                              left: leaf.left,
                              top: leaf.top,
                              animationDelay: `${leaf.delay}s`,
                              transform: `scale(${leaf.size})`,
                            }}
                          >
                            <Leaf className="w-4 h-4 text-accent animate-float" 
                                  style={{ animationDelay: `${leaf.delay}s` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Floating particles */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-accent rounded-full animate-float opacity-60"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 3}s`,
                          animationDuration: `${3 + Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tree Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5 text-tree-green" />
                  Tree Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Stage</div>
                  <div className="text-xl font-bold capitalize text-tree-green">
                    {stage} Tree
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Total Leaves</div>
                  <div className="text-2xl font-bold text-accent">
                    {gamification.leaves}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Size</div>
                  <div className="text-lg font-medium capitalize text-primary">
                    {size}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {getTreeDescription()}
                  </p>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Next Stage</span>
                      <span>
                        {stage === "ancient" 
                          ? "Maxed!" 
                          : `${gamification.leaves}/${
                              stage === "seed" ? 1 :
                              stage === "sprout" ? 3 :
                              stage === "sapling" ? 8 :
                              stage === "young" ? 20 : 40
                            }`}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-nature-gradient h-2 rounded-full transition-all duration-500"
                        style={{
                          width: stage === "ancient" 
                            ? "100%" 
                            : `${Math.min(
                                (gamification.leaves / (
                                  stage === "seed" ? 1 :
                                  stage === "sprout" ? 3 :
                                  stage === "sapling" ? 8 :
                                  stage === "young" ? 20 : 40
                                )) * 100,
                                100
                              )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}