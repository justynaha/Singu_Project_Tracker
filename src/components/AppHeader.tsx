import { Bell, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const AppHeader = () => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded"></div>
          <h1 className="text-2xl font-bold tracking-tight">SINGU</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Star className="h-5 w-5" />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
              3
            </span>
          </button>
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
  );
};
