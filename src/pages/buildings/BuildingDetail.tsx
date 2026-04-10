import { useParams, Link } from "react-router-dom";
import { buildings, sites } from "@/data/buildingsData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="bg-muted px-4 py-2.5 text-sm font-medium text-foreground">
    {title}
  </div>
);

const InfoRow = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div className="flex border-b border-border min-h-[44px]">
    <div className="w-[350px] px-4 py-3 text-sm font-medium text-foreground flex-shrink-0">
      {label}
    </div>
    <div className="flex-1 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  </div>
);

const BuildingDetail = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const building = buildings.find((b) => b.id === buildingId);

  if (!building) {
    return <div className="p-6">Building not found</div>;
  }

  const parentSite = sites.find((s) => s.id === building.siteId);

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="text-sm mb-1">
        <Link to="/buildings" className="text-primary hover:underline">Buildings</Link>
        <span className="text-muted-foreground"> / {building.name}</span>
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-4">{building.name}</h1>

      <Tabs defaultValue="information">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
          <TabsTrigger value="information" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">
            Information
          </TabsTrigger>
          {["Taxes", "Locations", "Tenants", "Files", "Tickets", "Equipment", "Plans (4)", "Access zones"].map((tab) => (
            <TabsTrigger key={tab} value={tab} disabled className="rounded-none px-4 py-2 text-muted-foreground">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="information">
          {/* Sub-tabs */}
          <div className="flex gap-4 border-b border-border mt-2 mb-4">
            <button className="px-3 py-2 text-sm font-medium border-b-2 border-primary text-foreground">
              General information
            </button>
            <button className="px-3 py-2 text-sm text-muted-foreground" disabled>
              Building
            </button>
            <button className="px-3 py-2 text-sm text-muted-foreground" disabled>
              Departments
            </button>
          </div>

          <div className="border border-border rounded-md overflow-hidden">
            {/* Property data */}
            <SectionHeader title="Property data" />
            <InfoRow label="Name:">{building.name}</InfoRow>
            <InfoRow label="Site:">
              {parentSite ? (
                <div>
                  <Link to={`/buildings/sites/${parentSite.id}`} className="text-primary hover:underline">
                    {parentSite.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{parentSite.address}</div>
                </div>
              ) : building.site}
            </InfoRow>
            <InfoRow label="Type:">{building.type}</InfoRow>
            <InfoRow label="Customer:">{building.customer}</InfoRow>
            <InfoRow label="Property Manager:">{building.propertyManager}</InfoRow>
            <InfoRow label="Allowed roof snow weight limit">{building.allowedRoofSnowWeightLimit}</InfoRow>
            <InfoRow label="Billing no.:">{building.billingNo}</InfoRow>
            <InfoRow label="Comments:">{building.comments}</InfoRow>
            <InfoRow label="Amortization:">{building.amortization}</InfoRow>
            <InfoRow label="Mortgage register no.:">{building.mortgageRegisterNo}</InfoRow>
            <InfoRow label="Ownership type:">{building.ownershipType}</InfoRow>
            <InfoRow label="Special economic zone">{building.specialEconomicZone}</InfoRow>
            <InfoRow label="Active">{building.active ? <strong>YES</strong> : "NO"}</InfoRow>

            {/* Value */}
            <SectionHeader title="Value" />
            <InfoRow label="Expert valuation:">{""}</InfoRow>
            <InfoRow label="Date:">{""}</InfoRow>
            <InfoRow label="Offer price:">{""}</InfoRow>
            <InfoRow label="Date:">{""}</InfoRow>

            {/* Address */}
            <SectionHeader title="Address" />
            <InfoRow label="Street:">
              {building.street}
              {building.street && (
                <Button variant="outline" size="sm" className="ml-2">Show on the map</Button>
              )}
            </InfoRow>
            <InfoRow label="Zip code:">{building.zipCode}</InfoRow>
            <InfoRow label="City:">{building.city}</InfoRow>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="default" size="sm">Edit</Button>
          </div>

          {/* Certificates */}
          <div className="border border-border rounded-md overflow-hidden mt-6">
            <SectionHeader title="Certificates" />
            <div className="px-4 py-3 flex items-center gap-2">
              <Checkbox id="include-expired" disabled />
              <label htmlFor="include-expired" className="text-sm text-muted-foreground">Include expired</label>
            </div>
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No certificates
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="default" size="sm">+ New certificate</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BuildingDetail;
