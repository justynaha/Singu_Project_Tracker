import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import ContractsList from "./ContractsList";
import MonthlyBreakdownList from "./MonthlyBreakdownList";

const tabs = [
  { id: "contracts", label: "Contract Tracker" },
  { id: "monthly-breakdown", label: "CAPEX Tracker" },
];

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "contracts";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="bg-background flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-0 flex-shrink-0">
        <h1 className="text-3xl font-bold mb-6">Reports</h1>
      </div>
      <div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
        <div className="bg-card border border-border rounded-lg flex flex-col flex-1 min-h-0">
          <div className="border-b border-border flex gap-1 px-2 flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeTab === "contracts" && <ContractsList embedded />}
            {activeTab === "monthly-breakdown" && <MonthlyBreakdownList embedded />}
          </div>
        </div>
      </div>
    </div>
  );
}
