import { Plus, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Ticket {
  no: string;
  subject: string;
  type: string;
  status: string;
}

const tickets: Ticket[] = [
  { no: "151", subject: "Common Area Repairs", type: "RFP", status: "Closed" },
  { no: "443243", subject: "Elevator Failure: Critical Damage to Control System", type: "Helpdesk", status: "In progress" },
  { no: "443244", subject: "Building Envelope Repair Works", type: "Helpdesk", status: "In progress" },
  { no: "443245", subject: "Elevator Modernisation", type: "Helpdesk", status: "In progress" },
  { no: "443246", subject: "Lighting System Upgrade", type: "Helpdesk", status: "In progress" },
];

export default function TicketsTab() {
  return (
    <div className="p-6">
      <div className="flex gap-2 mb-4">
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add new
        </Button>
        <Button variant="outline" size="sm">
          <Link2 className="h-4 w-4 mr-2" />
          Link items
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Linked tickets</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">No.</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[150px]">Type</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.no}>
                <TableCell>
                  <button className="text-primary hover:underline font-medium">
                    {ticket.no}
                  </button>
                </TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>{ticket.type}</TableCell>
                <TableCell>{ticket.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
