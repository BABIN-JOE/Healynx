// src/pages/dashboard/master/AdminList.tsx

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import MasterService from "../../../services/MasterService";

import {
  PlusIcon,
  TrashIcon,
  LockIcon,
  UnlockIcon,
  EyeIcon,
  EditIcon,
  SearchIcon,
} from "../../../components/Icons";

// shadcn UI
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

import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminList() {
  const navigate = useNavigate();

  // ----------------------------
  // STATE
  // ----------------------------
  const [admins, setAdmins] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // sorting
  const [sortField, setSortField] = useState<"first_name" | "username">("first_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ----------------------------
  // LOAD ADMINS
  // ----------------------------
  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await MasterService.listAdmins();
      setAdmins(res.data);
    } catch (err) {
      toast.error("Failed to load admins");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // ----------------------------
  // SEARCH
  // ----------------------------
  const handleSearch = async () => {
    if (!search.trim()) return loadAdmins();
    try {
      const res = await MasterService.searchAdmins(search);
      setAdmins(res.data);
    } catch {
      toast.error("Search failed");
    }
  };

  // ----------------------------
  // SORT
  // ----------------------------
  const toggleSort = (field: "first_name" | "username") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedAdmins = [...admins].sort((a, b) => {
    const A = a[sortField]?.toLowerCase?.() || "";
    const B = b[sortField]?.toLowerCase?.() || "";
    if (A < B) return sortOrder === "asc" ? -1 : 1;
    if (A > B) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // ----------------------------
  // PAGINATION
  // ----------------------------
  const paginated = sortedAdmins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(sortedAdmins.length / PAGE_SIZE);

  // ----------------------------
  // ACTIONS
  // ----------------------------
  const blockAdmin = async (id: string) => {
    try {
      await MasterService.blockAdmin(id);
      toast.success("Admin blocked");
      loadAdmins();
    } catch {
      toast.error("Failed to block admin");
    }
  };

  const unblockAdmin = async (id: string) => {
    try {
      await MasterService.unblockAdmin(id);
      toast.success("Admin unblocked");
      loadAdmins();
    } catch {
      toast.error("Failed to unblock admin");
    }
  };

  const deleteAdmin = async (id: string) => {
    if (!confirm("Do you want to delete this admin?")) return;
    try {
      await MasterService.deleteAdmin(id);
      toast.success("Admin deleted");
      loadAdmins();
    } catch {
      toast.error("Failed to delete admin");
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl font-bold">Administrators</h1>

        <Link to="/master/admins/create">
          <Button>
            <PlusIcon className="mr-2" /> Create Admin
          </Button>
        </Link>
      </motion.div>

      {/* Search bar */}
      <div className="flex gap-3 mb-5">
        <Input
          placeholder="Search by name, username, email"
          value={search}
          className="w-72"
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleSearch}>
          <SearchIcon className="mr-2" /> Search
        </Button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading admins...</p>
      ) : paginated.length === 0 ? (
        <p>No admins found.</p>
      ) : (
        <div className="rounded-lg border bg-white shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("first_name")}
                >
                  Name {sortField === "first_name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </TableHead>

                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("username")}
                >
                  Username {sortField === "username" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </TableHead>

                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>

                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map((a) => (
                <TableRow key={a.id}>
                  {/* NAME */}
                  <TableCell>
                    {a.first_name} {a.middle_name || ""} {a.last_name}
                  </TableCell>

                  {/* USERNAME */}
                  <TableCell>{a.username}</TableCell>

                  {/* EMAIL */}
                  <TableCell>{a.email || "—"}</TableCell>

                  {/* PHONE */}
                  <TableCell>{a.phone || "—"}</TableCell>

                  {/* STATUS */}
                  <TableCell className="text-center">
                    {a.is_blocked ? (
                      <span className="px-2 py-1 rounded bg-red-200 text-red-700 text-xs">
                        Blocked
                      </span>
                    ) : !a.is_active ? (
                      <span className="px-2 py-1 rounded bg-gray-300 text-gray-700 text-xs">
                        Inactive
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-green-200 text-green-700 text-xs">
                        Active
                      </span>
                    )}
                  </TableCell>
                  
                  {/* ACTIONS */}
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      {/* VIEW */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/master/admins/${a.id}/view`)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>

                      {/* EDIT */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/master/admins/${a.id}/edit`)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>

                      {/* BLOCK / UNBLOCK */}
                      {a.is_blocked ? (
                        <Button
                          size="icon"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => unblockAdmin(a.id)}
                        >
                          <UnlockIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => blockAdmin(a.id)}
                        >
                          <LockIcon className="h-4 w-4" />
                        </Button>
                      )}

                      {/* DELETE */}
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteAdmin(a.id)}
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
