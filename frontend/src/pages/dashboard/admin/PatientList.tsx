// src/pages/dashboard/admin/PatientList.tsx
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Skeleton } from "../../../components/ui/skeleton";
import { toast } from "sonner";
import AdminService from "../../../services/AdminService";
import { useNavigate } from "react-router-dom";

import {
  EyeIcon,
  TrashIcon,
  LockIcon,
  UnlockIcon,
  EditIcon,
  SearchIcon,
} from "../../../components/Icons";

export default function PatientsList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await AdminService.searchPatients(); // FIXED
      setPatients(data);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await AdminService.deletePatient(id);
      toast.success("Patient deleted");
      loadPatients();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Patients</CardTitle>
          <Button onClick={() => navigate("/admin/patients/create")}>
            Add Patient
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingTable />
          ) : patients.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No patients found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{`${p.first_name} ${p.middle_name || ""} ${p.last_name}`}</TableCell>
                    <TableCell>{p.gender}</TableCell>
                    <TableCell>{p.dob}</TableCell>

                    <TableCell className="text-right flex justify-end gap-2">
                      {/* VIEW */}
                      <Button
                       variant="outline"
                      size="icon"
                      onClick={() => navigate(`/admin/patients/${p.id}/view`)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>

                      {/* EDIT */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/admin/patients/${p.id}/edit`)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(p.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
