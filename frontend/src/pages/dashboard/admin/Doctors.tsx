// src/pages/dashboard/admin/Doctors.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminService from "../../../services/AdminService";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";

import {
  EyeIcon,
  TrashIcon,
  LockIcon,
  UnlockIcon,
  EditIcon,
  SearchIcon,
} from "../../../components/Icons";

export default function Doctors() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showBlocked, setShowBlocked] = useState(false);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  /* ===========================================================
       FETCH DOCTORS (APPROVED + BLOCKED)
  =========================================================== */
  const loadDoctors = async (active = true) => {
    try {
      setLoading(true);

      const res: any = await AdminService.getDoctors(active, 1, 300);

      setDoctors(res || []);

    } catch (err) {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  /* ===========================================================
       INITIAL LOAD
  =========================================================== */
  useEffect(() => {
    loadDoctors(!showBlocked);
  }, [showBlocked]);

  /* ===========================================================
       FILTER + PAGINATION
  =========================================================== */
  const filtered = doctors.filter((d) =>
    (d.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  /* ===========================================================
       ACTION HANDLERS
  =========================================================== */
  const handleDelete = async (id: string) => {
    const doctor = doctors.find(d => d.id === id);
    const name = doctor?.name || 'Doctor';
    if (!confirm(`Delete ${name}?`)) return;

    try {
      await AdminService.deleteDoctor(id);
      toast.success(`${name} deleted successfully`);
      setDoctors((prev) => prev.filter((doctor) => doctor.id !== id));
      loadDoctors(!showBlocked);
    } catch {
      toast.error("Delete failed");
    }
  };

  const toggleBlock = async (id: string, isActive: boolean) => {
    const doctor = doctors.find(d => d.id === id);
    const name = doctor?.name || 'Doctor';
    try {
      if (isActive) {
        await AdminService.blockDoctor(id);
        toast.success(`${name} blocked successfully`);
      } else {
        await AdminService.unblockDoctor(id);
        toast.success(`${name} unblocked successfully`);
      }

      setDoctors((prev) => prev.filter((doctor) => doctor.id !== id));
      loadDoctors(!showBlocked);
    } catch {
      toast.error("Action failed");
    }
  };

  /* ===========================================================
       JSX
  =========================================================== */

  return (
    <>
    
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Doctors</h1>

        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/doctor-requests")}>Doctor Requests</Button>

          <Button
            variant={showBlocked ? "default" : "secondary"}
            onClick={() => setShowBlocked(!showBlocked)}
          >
            {showBlocked ? "Show Active" : "Blocked Doctors"}
          </Button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex gap-3 mb-5">
        <Input
          placeholder="Search doctor..."
          value={search}
          className="w-72"
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button>
          <SearchIcon className="mr-2" /> Search
        </Button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : paginated.length === 0 ? (
        <p>No doctors found.</p>
      ) : (
        <div className="bg-white shadow rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Name</TableHead>
                <TableHead className="w-[15%]">License</TableHead>
                <TableHead className="w-[20%]">Specialization</TableHead>
                <TableHead className="w-[10%] text-center">Status</TableHead>
                <TableHead className="w-[30%] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map((d) => (
                <TableRow key={d.id} className="border-t">

                  <TableCell className="py-3">{d.name}</TableCell>

                  <TableCell className="py-3">{d.license_number}</TableCell>

                  <TableCell className="py-3">{d.specialization || "—"}</TableCell>

                  <TableCell className="py-3 text-center">
                    {d.is_active ? (
                      <span className="px-2 py-1 rounded bg-green-200 text-green-700 text-xs font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-red-200 text-red-700 text-xs font-semibold">
                        Blocked
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-3">
                    <div className="flex justify-center gap-3">

                      {/* VIEW */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/admin/doctors/${d.id}/view`)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>

                      {/* EDIT */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/admin/doctors/${d.id}/edit`)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>

                      {/* BLOCK / UNBLOCK */}
                      {d.is_active ? (
                        <Button
                          size="icon"
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => toggleBlock(d.id, true)}
                        >
                          <LockIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => toggleBlock(d.id, false)}
                        >
                          <UnlockIcon className="h-4 w-4" />
                        </Button>
                      )}

                      {/* DELETE */}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(d.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Prev
        </Button>

        <span>
          Page {page} of {totalPages}
        </span>

        <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>
    </>
  );
}
