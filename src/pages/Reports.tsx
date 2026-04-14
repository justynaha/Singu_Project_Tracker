import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ContractsList from "./ContractsList";
import MonthlyBreakdownList from "./MonthlyBreakdownList";

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "contracts";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Reports</h1>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="contracts">Contract Tracker</TabsTrigger>
            <TabsTrigger value="monthly-breakdown">Monthly Breakdown</TabsTrigger>
          </TabsList>
          <TabsContent value="contracts">
            <ContractsList embedded />
          </TabsContent>
          <TabsContent value="monthly-breakdown">
            <MonthlyBreakdownList embedded />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
