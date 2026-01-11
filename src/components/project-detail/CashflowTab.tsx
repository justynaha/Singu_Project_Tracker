import React, { useState, useCallback, useEffect } from "react";
import { TimelineItem, ProjectCost } from "@/hooks/useProjectDetail";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CashflowTabProps {
  timelineItems: TimelineItem[];
  costs: ProjectCost[];
  totalBudget: number;
}

interface CashflowItem {
  id: string;
  name: string;
  budget: number;
  forecasted: number;
  contracted: number;
  invoiced: number;
}

interface MilestoneCashflow {
  id: string;
  timeline_item_id: string;
  budget: number;
  forecasted: number;
  contracted: number;
  invoiced: number;
}

// Editable cell component that formats only on blur
function EditableCell({ 
  value, 
  onChange, 
  className 
}: { 
  value: number; 
  onChange: (val: number) => void; 
  className: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const formatNumber = (num: number) => {
    if (num === 0) return "";
    return num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseNumber = (str: string): number => {
    // Remove spaces and replace comma with dot for parsing
    const cleaned = str.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleFocus = () => {
    setIsEditing(true);
    setInputValue(value === 0 ? "" : value.toString());
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseNumber(inputValue);
    onChange(parsed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      className={className}
      value={isEditing ? inputValue : (value === 0 ? "" : formatNumber(value))}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="--"
    />
  );
}

export default function CashflowTab({ timelineItems, costs, totalBudget }: CashflowTabProps) {
  const [cashflowItems, setCashflowItems] = useState<CashflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cashflow data from database
  useEffect(() => {
    const loadCashflowData = async () => {
      // Only show milestones that have include_in_cashflow set to true
      const milestones = timelineItems.filter(item => item.type === "milestone" && item.include_in_cashflow);
      if (milestones.length === 0) {
        setCashflowItems([]);
        setLoading(false);
        return;
      }

      const milestoneIds = milestones.map(m => m.id);
      
      const { data: savedData, error } = await supabase
        .from('milestone_cashflow')
        .select('*')
        .in('timeline_item_id', milestoneIds);

      if (error) {
        console.error('Error loading cashflow data:', error);
      }

      const savedMap = new Map<string, MilestoneCashflow>();
      if (savedData) {
        savedData.forEach((item: MilestoneCashflow) => {
          savedMap.set(item.timeline_item_id, item);
        });
      }

      const items: CashflowItem[] = milestones.map(milestone => {
        const saved = savedMap.get(milestone.id);
        if (saved) {
          return {
            id: milestone.id,
            name: milestone.name,
            budget: Number(saved.budget) || 0,
            forecasted: Number(saved.forecasted) || 0,
            contracted: Number(saved.contracted) || 0,
            invoiced: Number(saved.invoiced) || 0,
          };
        }
        
        // Default values for new milestones
        const itemCosts = costs.filter(c => c.timeline_item_id === milestone.id);
        const totalSpent = itemCosts.reduce((sum, c) => sum + Number(c.amount), 0);
        return {
          id: milestone.id,
          name: milestone.name,
          budget: 0,
          forecasted: 0,
          contracted: totalSpent,
          invoiced: totalSpent,
        };
      });

      setCashflowItems(items);
      setLoading(false);
    };

    loadCashflowData();
  }, [timelineItems, costs]);

  // Save cashflow data to database
  const saveCashflowItem = useCallback(async (item: CashflowItem) => {
    const { error } = await supabase
      .from('milestone_cashflow')
      .upsert({
        timeline_item_id: item.id,
        budget: item.budget,
        forecasted: item.forecasted,
        contracted: item.contracted,
        invoiced: item.invoiced,
      }, {
        onConflict: 'timeline_item_id'
      });

    if (error) {
      console.error('Error saving cashflow data:', error);
    }
  }, []);

  const calculateTotals = () => {
    return cashflowItems.reduce(
      (acc, item) => ({
        budget: acc.budget + item.budget,
        forecasted: acc.forecasted + item.forecasted,
        contracted: acc.contracted + item.contracted,
        invoiced: acc.invoiced + item.invoiced,
      }),
      { budget: 0, forecasted: 0, contracted: 0, invoiced: 0 }
    );
  };

  const totals = calculateTotals();
  const unassignedBudget = totalBudget - totals.budget;

  const handleFieldChange = (itemId: string, field: keyof Omit<CashflowItem, 'id' | 'name'>, value: number) => {
    setCashflowItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const newItem = { ...item, [field]: value };
          // Save to database
          saveCashflowItem(newItem);
          return newItem;
        }
        return item;
      });
      return updated;
    });
  };

  const formatNumberAlways = (num: number) => {
    return num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return "x";
    return Math.round((value / total) * 100);
  };

  const cellBorder = "border border-border";
  const inputClass = "w-full bg-transparent text-right outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-2";

  const budgetExceeded = totals.budget > totalBudget;

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Expenditures</h2>
        <div className="text-muted-foreground">Loading cashflow data...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Expenditures</h2>
      
      {budgetExceeded && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>
            Sum of milestone budgets ({formatNumberAlways(totals.budget)}) exceeds project budget ({formatNumberAlways(totalBudget)})
          </span>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-border">
          <thead>
            <tr>
              <th className={`text-left py-3 px-4 font-medium text-muted-foreground ${cellBorder} min-w-[200px]`}>Milestone</th>
              <th className={`text-right py-3 px-4 font-medium text-muted-foreground ${cellBorder} bg-primary/25 min-w-[120px]`}>Budget</th>
              <th className={`text-right py-3 px-4 font-medium text-muted-foreground ${cellBorder} bg-muted/40 min-w-[120px]`}>Forecasted</th>
              <th className={`text-right py-3 px-4 font-medium text-muted-foreground ${cellBorder} bg-muted/60 min-w-[120px]`}>Contracted</th>
              <th className={`text-right py-3 px-4 font-medium text-muted-foreground ${cellBorder} bg-muted/80 min-w-[120px]`}>Invoiced</th>
              <th className={`text-right py-3 px-4 font-medium text-muted-foreground ${cellBorder} bg-primary/25 min-w-[120px]`}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {cashflowItems.length > 0 ? (
              cashflowItems.map((item) => {
                const remaining = item.budget - item.contracted;
                return (
                  <tr key={item.id}>
                    <td className={`py-2 px-4 font-medium ${cellBorder} min-w-[200px]`}>{item.name}</td>
                    <td className={`py-0 px-2 ${cellBorder} bg-primary/25 min-w-[120px]`}>
                      <EditableCell
                        value={item.budget}
                        onChange={(val) => handleFieldChange(item.id, 'budget', val)}
                        className={inputClass}
                      />
                    </td>
                    <td className={`py-0 px-2 ${cellBorder} bg-muted/40 min-w-[120px]`}>
                      <EditableCell
                        value={item.forecasted}
                        onChange={(val) => handleFieldChange(item.id, 'forecasted', val)}
                        className={inputClass}
                      />
                    </td>
                    <td className={`py-0 px-2 ${cellBorder} bg-muted/60 min-w-[120px]`}>
                      <EditableCell
                        value={item.contracted}
                        onChange={(val) => handleFieldChange(item.id, 'contracted', val)}
                        className={inputClass}
                      />
                    </td>
                    <td className={`py-0 px-2 ${cellBorder} bg-muted/80 min-w-[120px]`}>
                      <EditableCell
                        value={item.invoiced}
                        onChange={(val) => handleFieldChange(item.id, 'invoiced', val)}
                        className={inputClass}
                      />
                    </td>
                    <td className={`py-2 px-4 text-right ${cellBorder} bg-primary/25 min-w-[120px] font-medium ${remaining < 0 ? 'text-destructive' : ''}`}>
                      {formatNumberAlways(remaining)}
                    </td>
                  </tr>
                );
              })
            ) : null}
            {/* Unassigned Budget Row */}
            <tr className="bg-muted/50">
              <td className={`py-2 px-4 font-medium ${cellBorder} min-w-[200px]`}>Unassigned Budget (Other Works)</td>
              <td className={`py-2 px-4 text-right font-medium ${cellBorder} bg-primary/25 min-w-[120px]`}>
                {formatNumberAlways(unassignedBudget)}
              </td>
              <td className={`py-2 px-4 text-right ${cellBorder} min-w-[120px]`}>--</td>
              <td className={`py-2 px-4 text-right ${cellBorder} min-w-[120px]`}>--</td>
              <td className={`py-2 px-4 text-right ${cellBorder} min-w-[120px]`}>--</td>
              <td className={`py-2 px-4 text-right font-medium ${cellBorder} bg-primary/25 min-w-[120px]`}>
                {formatNumberAlways(unassignedBudget)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="font-medium">
              <td className={`py-4 px-4 border-l-4 border-l-yellow-400 ${cellBorder} min-w-[200px]`}>Total Expenditures</td>
              <td className={`py-4 px-4 text-right ${cellBorder} bg-primary/25 min-w-[120px]`}>
                <div>{formatNumberAlways(totalBudget)}</div>
              </td>
              <td className={`py-4 px-4 text-right ${cellBorder} bg-muted/40 min-w-[120px]`}>
                <div>{formatNumberAlways(totals.forecasted)}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {getPercentage(totals.forecasted, totalBudget)}% of Budget
                </div>
              </td>
              <td className={`py-4 px-4 text-right ${cellBorder} bg-muted/60 min-w-[120px]`}>
                <div>{formatNumberAlways(totals.contracted)}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {getPercentage(totals.contracted, totalBudget)}% of Budget
                </div>
              </td>
              <td className={`py-4 px-4 text-right ${cellBorder} bg-muted/80 min-w-[120px]`}>
                <div>{formatNumberAlways(totals.invoiced)}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {getPercentage(totals.invoiced, totalBudget)}% of Budget
                </div>
              </td>
              <td className={`py-4 px-4 text-right ${cellBorder} bg-primary/25 min-w-[120px] ${totalBudget - totals.contracted < 0 ? 'text-destructive' : ''}`}>
                <div>{formatNumberAlways(totalBudget - totals.contracted)}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {getPercentage(totalBudget - totals.contracted, totalBudget)}% of Budget
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
