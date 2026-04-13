import { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface ContractWithProject {
  id: string;
  contract_number: string;
  contract_date: string | null;
  amount_lc: number | null;
  amount_eur: number | null;
  status: string;
  contractor: string | null;
  description: string | null;
  project_id: string;
  project_name: string;
  project_site: string | null;
}

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "default" as const;
    case "ongoing":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
};

const formatAmount = (amount: number | null) => {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ContractsList() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [projectNumberMap, setProjectNumberMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);

      // Fetch all projects ordered by created_at to build project number map
      const { data: allProjects } = await supabase
        .from("projects")
        .select("id, name, site, created_at")
        .order("created_at", { ascending: true });

      const numMap = new Map<string, number>();
      (allProjects || []).forEach((p, idx) => {
        numMap.set(p.id, 13536 + idx);
      });
      setProjectNumberMap(numMap);

      const projectMap = new Map(
        (allProjects || []).map((p) => [p.id, { name: p.name, site: p.site }])
      );

      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("*")
        .order("contract_date", { ascending: false });

      if (contractsError) {
        console.error("Failed to fetch contracts:", contractsError);
        setLoading(false);
        return;
      }

      const merged: ContractWithProject[] = (contractsData || []).map((c) => {
        const proj = projectMap.get(c.project_id);
        return {
          ...c,
          contractor: (c as any).contractor ?? null,
          description: (c as any).description ?? null,
          project_name: proj?.name || "Unknown",
          project_site: proj?.site || null,
        };
      });

      setContracts(merged);
      setLoading(false);
    };

    fetchContracts();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return contracts;
    const q = searchQuery.toLowerCase();
    return contracts.filter(
      (c) =>
        c.contract_number.toLowerCase().includes(q) ||
        c.project_name.toLowerCase().includes(q) ||
        c.project_id.toLowerCase().includes(q) ||
        (c.contractor && c.contractor.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [contracts, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Contracts</h1>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract ID</TableHead>
                    <TableHead>Project Number</TableHead>
                    <TableHead>Project Title</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead className="max-w-[150px]">Description</TableHead>
                    <TableHead className="text-right">Contracted LC</TableHead>
                    <TableHead className="text-right">Contracted EUR</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                        No contracts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.contract_number}</TableCell>
                        <TableCell>
                          <span
                            className="text-primary font-medium cursor-pointer hover:underline"
                            onClick={() => navigate(`/project/${c.project_id}`)}
                          >
                            {projectNumberMap.get(c.project_id) ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>{c.project_name}</TableCell>
                        <TableCell>{c.project_site || "—"}</TableCell>
                        <TableCell>
                          {c.contract_date
                            ? format(new Date(c.contract_date), "dd MMM yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>{c.contractor || "—"}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{c.description || "—"}</TableCell>
                        <TableCell className="text-right">{formatAmount(c.amount_lc)}</TableCell>
                        <TableCell className="text-right">{formatAmount(c.amount_eur)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
