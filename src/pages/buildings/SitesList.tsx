import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sites } from "@/data/buildingsData";

const SitesList = () => {
  const [search, setSearch] = useState("");

  const filtered = sites.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.country.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Properties</h1>
        <div className="flex gap-2">
          <Button variant="default" size="sm">+ Add</Button>
          <Button variant="outline" size="sm">Import template</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-72">
          <Input
            placeholder="Search ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button variant="outline" size="sm">Filters</Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Rows 1 to <strong>{filtered.length}</strong> out of <strong>{filtered.length}</strong>
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Documentation responsible person</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((site) => (
            <TableRow key={site.id}>
              <TableCell className="text-muted-foreground">▽</TableCell>
              <TableCell>
                <Link
                  to={`/buildings/sites/${site.id}`}
                  className="text-primary hover:underline"
                >
                  {site.name}
                </Link>
              </TableCell>
              <TableCell>{site.country}</TableCell>
              <TableCell>{site.address}</TableCell>
              <TableCell>{site.documentationResponsiblePerson}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SitesList;
