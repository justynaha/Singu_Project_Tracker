import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link, Image } from "lucide-react";
import type { Site } from "@/data/buildingsData";

interface EditSiteFormProps {
  site: Site;
  onCancel: () => void;
  initialBudget?: number | null;
  onSaved?: () => void;
}

const EditSiteForm = ({ site, onCancel, initialBudget, onSaved }: EditSiteFormProps) => {
  const { toast } = useToast();
  const [budget, setBudget] = useState<string>(
    initialBudget != null ? String(initialBudget) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const value = budget === "" ? 0 : Number(budget);
    const { error } = await (supabase as any)
      .from("site_budgets")
      .upsert(
        { site_id: site.id, budget_lc: value, currency: site.currency || "PLN" },
        { onConflict: "site_id" }
      );
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved" });
    onSaved ? onSaved() : onCancel();
  };

  return (
    <div>
      {/* Wizard steps */}
      <div className="flex border border-border rounded-t-md overflow-hidden mb-6">
        <div className="flex-1 px-6 py-3 text-sm font-medium flex items-center gap-2 bg-primary text-primary-foreground">
          <span className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold">1</span>
          Property — Basic information
        </div>
        <div className="flex-1 px-6 py-3 text-sm font-medium flex items-center gap-2 bg-muted text-muted-foreground">
          <span className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold">2</span>
          Property — Application settings
        </div>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input defaultValue={site.name} />
        </div>

        {/* Short name */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Short name</Label>
          <Input defaultValue="" />
        </div>

        {/* Address */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Address</Label>
          <Textarea defaultValue={site.address} rows={3} />
        </div>

        {/* General e-mail */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">General e-mail (informational only)</Label>
          <Input defaultValue={site.generalEmail} />
        </div>

        {/* Default person resp. for orders */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Default person resp. for orders</Label>
          <Select defaultValue={site.defaultPersonRespForOrders || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Choose or start typing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="John Smith">John Smith</SelectItem>
              <SelectItem value="Anna Kowalska">Anna Kowalska</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documentation responsible person */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Documentation responsible person</Label>
          <Select defaultValue={site.documentationResponsiblePerson || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Choose or start typing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Maria Nowak">Maria Nowak</SelectItem>
              <SelectItem value="Jan Kowalski">Jan Kowalski</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Default seller */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Default seller</Label>
          <Select defaultValue={site.defaultSeller || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="— Choose —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Seller A">Seller A</SelectItem>
              <SelectItem value="Seller B">Seller B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cost center */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Cost center</Label>
          <RadioGroup defaultValue={site.costCenter === "YES" ? "yes" : "no"} className="flex gap-6 pt-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="cc-yes" />
              <Label htmlFor="cc-yes" className="font-normal">YES</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="cc-no" />
              <Label htmlFor="cc-no" className="font-normal">NO</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Default tenant */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Default tenant</Label>
          <Select defaultValue={site.defaultTenant || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="— Choose —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tenant A">Tenant A</SelectItem>
              <SelectItem value="Tenant B">Tenant B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Currency</Label>
          <Select defaultValue={site.currency || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="— Choose —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLN">PLN</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="CZK">CZK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Country</Label>
          <Select defaultValue={site.country || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="— Choose —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Poland">Poland</SelectItem>
              <SelectItem value="Czech Republic">Czech Republic</SelectItem>
              <SelectItem value="Spain">Spain</SelectItem>
              <SelectItem value="Germany">Germany</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max cost */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Max cost for a one-step ticket closing</Label>
          <Input defaultValue={site.maxCostOneStepTicket} />
        </div>

        {/* Comments with mock toolbar */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Comments</Label>
          <div>
            <div className="flex items-center gap-1 border border-border rounded-t-md px-2 py-1 bg-muted">
              <button className="p-1 hover:bg-accent rounded"><Bold className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-accent rounded"><Italic className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-accent rounded"><Underline className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-accent rounded"><Strikethrough className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-border mx-1" />
              <button className="p-1 hover:bg-accent rounded"><AlignLeft className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-accent rounded"><AlignCenter className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-accent rounded"><AlignRight className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-border mx-1" />
              <button className="p-1 hover:bg-accent rounded"><List className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-accent rounded"><ListOrdered className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-border mx-1" />
              <button className="p-1 hover:bg-accent rounded"><Link className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-accent rounded"><Image className="h-4 w-4" /></button>
            </div>
            <Textarea className="rounded-t-none border-t-0" rows={4} defaultValue="" />
          </div>
        </div>

        {/* Additional information */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Additional information</Label>
          <Textarea rows={3} defaultValue={site.info} />
        </div>

        {/* Fund ID */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Fund ID</Label>
          <Input defaultValue={site.fundId} />
        </div>

        {/* Legal Entity */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Legal Entity</Label>
          <Input defaultValue={site.legalEntity} />
        </div>

        {/* CC Code */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">CC Code</Label>
          <Input defaultValue={site.ccCode} />
        </div>

        {/* Area (sqm) */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Area (sqm)</Label>
          <Input defaultValue={site.areaSqm} />
        </div>

        {/* Budget */}
        <div className="grid grid-cols-[200px_1fr] items-start gap-4">
          <Label className="text-sm font-medium pt-2">Budget</Label>
          <Input
            type="number"
            placeholder={`Amount in ${site.currency || "LC"}`}
            defaultValue={site.budget ?? ""}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <button className="text-sm text-destructive hover:underline">Remove property</button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onCancel}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default EditSiteForm;
