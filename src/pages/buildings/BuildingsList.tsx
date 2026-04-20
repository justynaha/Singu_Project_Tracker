import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildings } from "@/data/buildingsData";

const ITEMS_PER_PAGE = 30;

const BuildingsList = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = buildings.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase()) ||
    b.site.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const startRow = (page - 1) * ITEMS_PER_PAGE + 1;
  const endRow = Math.min(page * ITEMS_PER_PAGE, filtered.length);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Real estates – list</h1>
        <div className="flex gap-2">
          <Button variant="default" size="sm">+ Add</Button>
          <Button variant="outline" size="sm">Import template</Button>
          <Button variant="outline" size="sm">Show on the map</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-72">
          <Input
            placeholder="Search ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button variant="outline" size="sm">Advanced</Button>
        <Button variant="outline" size="sm">Value</Button>
        <Button variant="outline" size="sm">Building</Button>
        <span className="text-sm text-primary cursor-pointer hover:underline ml-2">Saved filters</span>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2 mb-4">
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>‹</Button>
            {Array.from({ length: Math.min(totalPages, 4) }).map((_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(i + 1)}
                className="w-8"
              >
                {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>›</Button>
          </div>
        )}
        <span className="text-sm text-muted-foreground ml-2">
          Rows {startRow} to <strong>{endRow}</strong> out of <strong>{filtered.length}</strong>
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Property Manager</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Customer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((building) => (
            <TableRow key={building.id}>
              <TableCell>
                <Link
                  to={`/buildings/${building.id}`}
                  className="text-primary hover:underline"
                >
                  {building.name}
                </Link>
              </TableCell>
              <TableCell>{building.address}</TableCell>
              <TableCell>{building.propertyManager}</TableCell>
              <TableCell>{building.site}</TableCell>
              <TableCell>{building.customer}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BuildingsList;
