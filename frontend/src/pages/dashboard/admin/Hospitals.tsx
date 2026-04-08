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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

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
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showBlocked, setShowBlocked] = useState<boolean>(showBlockedOverride);
  const [openRequests, setOpenRequests] = useState(false);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  /* =============================
        LOAD HOSPITALS
  ============================== */
  const loadHospitals = async (active = true) => {
    try {
      setLoading(true);

      const res: any = await AdminService.getHospitals(active, 1, 300);

      console.log("HOSPITALS:", res);

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
  const loadRequests = async () => {
    try {
      const data = await AdminService.getHospitalRequests("pending");
      setRequests(data || []);
    } catch {
      toast.error("Failed to load hospital requests");
    }
  };

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
    if (!confirm("Delete this hospital?")) return;
    try {
      await AdminService.deleteHospital(id);
      toast.success("Hospital deleted");
      loadHospitals(!showBlocked);
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleBlock = async (id: string) => {
    try {
      await AdminService.blockHospital(id);
      toast.success("Hospital blocked");
      loadHospitals(!showBlocked);
    } catch {
      toast.error("Block failed");
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      await AdminService.unblockHospital(id);
      toast.success("Hospital unblocked");
      loadHospitals(!showBlocked);
    } catch {
      toast.error("Unblock failed");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await AdminService.approveHospital(id);
      toast.success("Hospital approved");
      loadRequests();
      loadHospitals(!showBlocked);
    } catch {
      toast.error("Approve failed");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await AdminService.rejectHospital(id);
      toast.success("Hospital rejected");
      loadRequests();
    } catch {
      toast.error("Reject failed");
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
          <Button
            onClick={() => {
              loadRequests();
              setOpenRequests(true);
            }}
          >
            Hospital Requests
          </Button>

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

      {/* REQUESTS MODAL */}
      <Dialog open={openRequests} onOpenChange={setOpenRequests}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hospital Requests</DialogTitle>
          </DialogHeader>

          {requests.length === 0 ? (
            <p className="mt-4">No pending requests</p>
          ) : (
            <div className="mt-4 space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="border p-4 rounded-md">
                  <p className="font-semibold">{r.hospital_name}</p>
                  <p className="text-sm text-gray-600">
                    License: {r.license_number}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleApprove(r.id)}>
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(r.id)}
                    >
                      Reject
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/admin/hospital-requests/${r.id}/view`)
                      }
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
