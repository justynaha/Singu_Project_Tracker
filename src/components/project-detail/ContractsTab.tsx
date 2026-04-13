import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export interface Contract {
  id: string;
  project_id: string;
  contract_number: string;
  contract_date: string | null;
  amount_lc: number | null;
  amount_eur: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ContractsTabProps {
  contracts: Contract[];
  currency?: string;
}

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "signed":
    case "active":
      return "default";
    case "draft":
      return "secondary";
    case "closed":
      return "outline";
    default:
      return "secondary";
  }
};

const formatAmount = (amount: number | null) => {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ContractsTab({ contracts, currency = "EUR" }: ContractsTabProps) {
  const showLcColumn = currency.toUpperCase() !== "EUR";
  if (contracts.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No contracts yet
      </div>
    );
  }

  return (
    <div className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract ID</TableHead>
            <TableHead>Date</TableHead>
            {showLcColumn && <TableHead className="text-right">Amount ({currency})</TableHead>}
            <TableHead className="text-right">Amount (EUR)</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.contract_number}</TableCell>
              <TableCell>
                {c.contract_date ? format(new Date(c.contract_date), "dd MMM yyyy") : "—"}
              </TableCell>
              {showLcColumn && <TableCell className="text-right">{formatAmount(c.amount_lc)}</TableCell>}
              <TableCell className="text-right">{formatAmount(c.amount_eur)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
