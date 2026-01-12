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
              className="gap-2 bg-transparent border-[#4ECDC4] text-foreground hover:bg-[#4ECDC4]/20 hover:text-foreground"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ECDC4" />
                    <stop offset="50%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" stroke="url(#sparkleGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
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
