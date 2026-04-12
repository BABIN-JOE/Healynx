// src/pages/dashboard/admin/Hospitals.tsx
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";

import {
  EyeIcon,
  LockIcon,
  UnlockIcon,
  TrashIcon,
  EditIcon,
} from "../../../components/Icons";

import { toast } from "sonner";
import AdminService from "../../../services/AdminService";
import { useNavigate } from "react-router-dom";

export default function Hospitals({
  showBlockedOverride = false,
}: {
  showBlockedOverride?: boolean;
}) {
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showBlocked, setShowBlocked] = useState<boolean>(showBlockedOverride);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  /* =============================
        LOAD HOSPITALS
  ============================== */
  const loadHospitals = async (active = true) => {
    try {
      setLoading(true);

      const res: any = await AdminService.getHospitals(active, 1, 300);

      setHospitals(res?.data || []);

    } catch (err) {
      toast.error("Failed to load hospitals");
    } finally {
      setLoading(false);
    }
};

  /* =============================
        LOAD REQUESTS
  ============================== */
  useEffect(() => {
    loadHospitals(!showBlocked);
  }, [showBlocked]);

  /* =============================
        SEARCH + PAGINATION
  ============================== */
  const filtered = hospitals.filter((h) =>
    h.hospital_name?.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  /* =============================
        ACTIONS
  ============================== */
  const handleDelete = async (id: string) => {
    const hospital = hospitals.find(h => h.id === id);
    const name = hospital?.name || 'Hospital';
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await AdminService.deleteHospital(id);
      toast.success(`${name} deleted successfully`);
      setHospitals((prev) => prev.filter((hospital) => hospital.id !== id));
      loadHospitals(!showBlocked);
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleBlock = async (id: string) => {
    const hospital = hospitals.find(h => h.id === id);
    const name = hospital?.name || 'Hospital';
    try {
      await AdminService.blockHospital(id);
      toast.success(`${name} blocked successfully`);
      setHospitals((prev) => prev.filter((hospital) => hospital.id !== id));
      loadHospitals(!showBlocked);
    } catch {
      toast.error("Block failed");
    }
  };

  const handleUnblock = async (id: string) => {
    const hospital = hospitals.find(h => h.id === id);
    const name = hospital?.name || 'Hospital';
    try {
      await AdminService.unblockHospital(id);
      toast.success(`${name} unblocked successfully`);
      setHospitals((prev) => prev.filter((hospital) => hospital.id !== id));
      loadHospitals(!showBlocked);
    } catch {
      toast.error("Unblock failed");
    }
  };

  /* =============================
              UI
  ============================== */

  return (
    <>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Hospitals</h1>

        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/hospital-requests")}>Hospital Requests</Button>

          <Button
            variant={showBlocked ? "default" : "secondary"}
            onClick={() => setShowBlocked(!showBlocked)}
          >
            {showBlocked ? "Show Active" : "Blocked Hospitals"}
          </Button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-4">
        <Input
          placeholder="Search hospitals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : paginated.length === 0 ? (
        <p>No hospitals found</p>
      ) : (
        <div className="bg-white shadow rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.hospital_name}</TableCell>
                  <TableCell>{h.license_number}</TableCell>
                  <TableCell>{h.email || "—"}</TableCell>
                  <TableCell>{h.phone || "—"}</TableCell>

                  <TableCell>
                    {!h.is_active ? (
                      <Badge variant="destructive">Blocked</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>

                  {/* ACTION ICONS */}
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">

                      {/* VIEW */}
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          navigate(`/admin/hospitals/${h.id}/view`)
                        }
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>

                      {/* EDIT */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/admin/hospitals/${h.id}/edit`)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>

                      {/* BLOCK / UNBLOCK */}
                      {!h.is_active ? (
                        <Button
                          size="icon"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => handleUnblock(h.id)}
                        >
                          <UnlockIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => handleBlock(h.id)}
                        >
                          <LockIcon className="h-4 w-4" />
                        </Button>
                      )}

                      {/* DELETE */}
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(h.id)}
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
      <div className="flex justify-center items-center gap-4 mt-5">
        <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Prev
        </Button>

        <span>
          Page {page} / {totalPages}
        </span>

        <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>

    </>
  );
}
