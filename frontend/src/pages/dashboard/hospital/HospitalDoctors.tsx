import { useEffect, useMemo, useState } from "react";
import HospitalService from "../../../services/HospitalService";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../../components/ui/table";
import { Input } from "../../../components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type DoctorMap = {
  doctor_id: string;
  name: string;
  specialization: string;
  role?: string;
  joined_at?: string;
};

export default function HospitalDoctors() {
  const [doctors, setDoctors] = useState<DoctorMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await HospitalService.getDoctors();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return doctors;

    return doctors.filter((d) =>
      `${d.name} ${d.specialization} ${d.doctor_id}`
        .toLowerCase()
        .includes(q)
    );
  }, [search, doctors]);

  const removeDoctor = async (doctorId: string) => {
    if (!confirm("Remove this doctor from your hospital?")) return;
    try {
      await HospitalService.removeDoctor(doctorId);
      toast.success("Doctor removed from hospital");
      loadDoctors();
    } catch {
      toast.error("Failed to remove doctor");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hospital Doctors</h1>
        <Button onClick={loadDoctors} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Input
        placeholder="Search by name, specialization, or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Doctor Name</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.length === 0 && !loading && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-muted-foreground"
              >
                No doctors found
              </TableCell>
            </TableRow>
          )}

          {filtered.map((d) => (
            <TableRow key={d.doctor_id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell>{d.specialization}</TableCell>
              <TableCell>{d.role || "doctor"}</TableCell>
              <TableCell>
                {d.joined_at
                  ? new Date(d.joined_at).toLocaleString()
                  : "-"}
              </TableCell>

              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/hospital/doctors/${d.doctor_id}`)
                  }
                >
                  View
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => removeDoctor(d.doctor_id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}