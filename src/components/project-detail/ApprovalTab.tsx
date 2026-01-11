import { Edit2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ApprovalTab() {
  const approvers = [
    { id: 1, name: "Jack Bauer", status: "pending" },
    { id: 2, name: "Anna Jantar", status: "waiting" },
    { id: 3, name: "Jenny Abshire", status: "waiting" },
    { id: 4, name: "Wu Lei", status: "waiting" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Budget requested</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">USD 10 000,00</span>
            <button className="text-primary hover:text-primary/80">
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button className="text-sm text-primary hover:underline">
          Restart approval
        </button>
      </div>

      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        
        {approvers.map((approver, idx) => (
          <div key={approver.id} className="relative mb-8 last:mb-0">
            <div className="absolute -left-8 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${
                idx === 0 
                  ? "bg-warning text-warning-foreground border-4 border-background" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {idx + 1}
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{approver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{approver.name}</span>
                {idx === 0 && (
                  <span className="text-sm text-warning">Pending</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
