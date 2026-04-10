import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { sites } from "@/data/buildingsData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import EditSiteModal from "@/components/buildings/EditSiteModal";

const SiteDetail = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { siteId } = useParams<{ siteId: string }>();
  const site = sites.find((s) => s.id === siteId);

  if (!site) {
    return <div className="p-6">Site not found</div>;
  }

  const infoFields = [
    { label: "Name:", value: site.name },
    { label: "Address:", value: site.address },
    { label: "Default person resp. for orders:", value: site.defaultPersonRespForOrders },
    { label: "Documentation responsible person:", value: site.documentationResponsiblePerson },
    { label: "Default seller:", value: site.defaultSeller },
    { label: "General e-mail (informational only):", value: site.generalEmail },
    { label: "Mailbox:", value: site.mailbox },
    { label: "Info:", value: site.info },
    { label: "Cost center:", value: site.costCenter },
    { label: "Default tenant:", value: site.defaultTenant },
    { label: "Currency:", value: site.currency },
    { label: "Country:", value: site.country },
    { label: "Max cost for a one-step ticket closing:", value: site.maxCostOneStepTicket },
    { label: "Theme:", value: site.theme },
    { label: "Domain:", value: site.domain },
    { label: "Dictionary type:", value: site.dictionaryType },
    { label: "Fund ID:", value: site.fundId },
    { label: "Legal Entity:", value: site.legalEntity },
    { label: "CC Code:", value: site.ccCode },
    { label: "Area (sqm):", value: site.areaSqm },
  ];

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="text-sm mb-1">
        <Link to="/buildings/sites" className="text-primary hover:underline">Sites</Link>
        <span className="text-muted-foreground"> / {site.name}</span>
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-4">{site.name}</h1>

      <Tabs defaultValue="information">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
          <TabsTrigger value="information" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">
            Information
          </TabsTrigger>
          <TabsTrigger value="shifts" disabled className="rounded-none px-4 py-2 text-muted-foreground">
            Shifts
          </TabsTrigger>
          <TabsTrigger value="sla" disabled className="rounded-none px-4 py-2 text-muted-foreground">
            SLA
          </TabsTrigger>
          <TabsTrigger value="buildings" disabled className="rounded-none px-4 py-2 text-muted-foreground">
            Buildings
          </TabsTrigger>
          <TabsTrigger value="evacuation" disabled className="rounded-none px-4 py-2 text-muted-foreground">
            Evacuation confirmation template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="information">
          <div className="flex gap-8 mt-4">
            {/* Info table */}
            <div className="flex-1">
              <div className="border border-border rounded-md overflow-hidden">
                {infoFields.map((field, i) => (
                  <div
                    key={i}
                    className="flex border-b border-border last:border-b-0 min-h-[44px]"
                  >
                    <div className="w-[350px] px-4 py-3 text-sm font-medium text-foreground flex-shrink-0">
                      {field.label}
                    </div>
                    <div className="flex-1 px-4 py-3 text-sm text-muted-foreground">
                      {field.value || ""}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="default" size="sm" onClick={() => setIsEditOpen(true)}>Edit</Button>
              </div>
            </div>

            {/* Image placeholders */}
            <div className="w-[280px] flex-shrink-0">
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-md" />
                ))}
              </div>
              <div className="mt-2 h-16 bg-muted rounded-md" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteDetail;
