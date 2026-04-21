import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BudgetCardProps {
  budget: number;
  forecasted: number;
  contracted: number;
  invoiced: number;
  currency: string;
}

export default function BudgetCard({ 
  budget,
  forecasted,
  contracted,
  invoiced,
  currency,
}: BudgetCardProps) {
  // Budget Variance = Budget - max(Forecast, Contracted)
  const remaining = budget - Math.max(forecasted, contracted);
  const contractedPercent = budget > 0 ? (contracted / budget) * 100 : 0;
  const invoicedPercent = budget > 0 ? (invoiced / budget) * 100 : 0;
  const remainingPercent = budget > 0 ? (remaining / budget) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString("en-US", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/,/g, ' ')}`;
  };

  return (
    <div className="w-96 border-l border-border pl-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-foreground">
          Budget ({(100).toFixed(2).replace('.', ',')}%)
        </h3>
        <span className="text-lg font-bold text-foreground">{formatCurrency(budget)}</span>
      </div>

      {/* Contracted row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-amber-500" />
        <span className="text-sm text-muted-foreground">
          Contracted ({contractedPercent.toFixed(1).replace('.', ',')}%)
        </span>
        <span className="ml-auto text-sm font-medium text-foreground">{formatCurrency(contracted)}</span>
      </div>

      {/* Invoiced row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span className="text-sm text-muted-foreground">
          Invoiced ({invoicedPercent.toFixed(1).replace('.', ',')}%)
        </span>
        <span className="ml-auto text-sm font-medium text-foreground">{formatCurrency(invoiced)}</span>
      </div>

      {/* Progress bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-2">
        <div 
          className="bg-blue-500 transition-all" 
          style={{ width: `${Math.min(invoicedPercent, 100)}%` }}
        />
        <div 
          className="bg-amber-500 transition-all"
          style={{ width: `${Math.min(contractedPercent - invoicedPercent, 100 - invoicedPercent)}%` }}
        />
        <div 
          className="bg-muted-foreground/30 transition-all"
          style={{ width: `${Math.max(0, remainingPercent)}%` }}
        />
      </div>

      {/* Budget Variance row */}
      <div className="flex justify-between text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground cursor-help">
                Budget Variance ({remainingPercent.toFixed(1).replace('.', ',')}%)
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Variance = Budget - max(Forcasted, Contracted)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className={`font-medium ${remaining < 0 ? "text-red-500" : "text-foreground"}`}>{formatCurrency(remaining)}</span>
      </div>
    </div>
  );
}
