import { useState, useEffect } from "react";
import { TreePine, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import treeSeed from "@/assets/tree-seed.png";
import treeSprout from "@/assets/tree-sprout.png";
import treeSapling from "@/assets/tree-sapling.png";
import treeYoung from "@/assets/tree-young.png";
import treeMature from "@/assets/tree-mature.png";
import treeAncient from "@/assets/tree-ancient.png";

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

  const getTreeStage = () => {
    const leaves = gamification.leaves;
    if (leaves === 0) return "seed";
    if (leaves < 3) return "sprout";
    if (leaves < 8) return "sapling";
    if (leaves < 20) return "young";
    if (leaves < 40) return "mature";
    return "ancient";
  };

  const getTreeImage = () => {
    const stage = getTreeStage();
    switch (stage) {
      case "seed": return treeSeed;
      case "sprout": return treeSprout;
      case "sapling": return treeSapling;
      case "young": return treeYoung;
      case "mature": return treeMature;
      case "ancient": return treeAncient;
      default: return treeSeed;
    }
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

  const stage = getTreeStage();

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 bg-nature-gradient bg-clip-text text-transparent">
            Your Productivity Tree
          </h1>
          <p className="text-muted-foreground">
            Every completed task helps your tree grow
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tree Visualization */}
          <div className="lg:col-span-2">
            <Card className="shadow-nature">
              <CardContent className="p-8">
                <div className="relative mx-auto flex items-center justify-center" style={{ maxWidth: '400px', minHeight: '300px' }}>
                  <img 
                    src={getTreeImage()} 
                    alt={`${stage} tree`}
                    className="max-w-full max-h-full object-contain animate-fade-in"
                  />
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