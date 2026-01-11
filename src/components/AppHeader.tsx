import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopilotPanel } from "./CopilotPanel";

export const AppHeader = () => {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded"></div>
            <h1 className="text-2xl font-bold tracking-tight">SINGU</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCopilotOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Ask Copilot
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face" />
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Anna Snow</span>
            </div>
          </div>
        </div>
      </header>

      <CopilotPanel 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)} 
      />
    </>
  );
};
