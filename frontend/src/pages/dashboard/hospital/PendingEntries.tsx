import React, { useEffect, useState, useRef } from "react";
import HospitalService from "../../../services/HospitalService";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "../../../components/ui/table";
import { toast } from "react-hot-toast";

type PendingEntry = {
  id: string;
  doctor_name?: string;
  patient_name?: string;
  patient_age?: number;
  entry_type?: string;
  expires_at?: string;
  created_at?: string;
};

const POLL_MS = 10_000;

const PendingEntries: React.FC = () => {

  const [entries, setEntries] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] =
    useState<"approve" | "decline" | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const pollRef = useRef<number | null>(null);

  const [viewEntry, setViewEntry] = useState<any | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const load = async () => {

    setLoading(true);
    setError(null);

    try {

      const data =
        await HospitalService.getPendingEntries();

      setEntries(Array.isArray(data) ? data : []);

    } catch (err: any) {

      console.error(err);

      setError(err?.message || "Failed to load pending entries");

      toast.error("Failed to load pending entries");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    load();

    pollRef.current = window.setInterval(load, POLL_MS);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };

  }, []);

  const openConfirm = (id: string, action: "approve" | "decline") => {

    setSelectedId(id);
    setConfirmAction(action);
    setShowConfirm(true);

    if (action === "decline") {
      setDeclineReason("");
    }

  };

  const handleConfirm = async () => {
    if (!selectedId || !confirmAction) return;

    try {
      if (confirmAction === "approve") {
        await HospitalService.approvePendingEntry(selectedId);
        toast.success("Entry approved");
      } else {
        if (!declineReason.trim()) {
          toast.error("Please enter a decline reason");
          return;
        }

        await HospitalService.declinePendingEntry(selectedId, declineReason);
        toast.success("Entry declined");
      }

      // CLOSE BOTH MODALS
      setShowConfirm(false);
      setViewOpen(false);
      setViewEntry(null);

      // RESET SELECTION
      setSelectedId(null);
      setConfirmAction(null);
      setDeclineReason("");

      // RELOAD TABLE
      await load();

    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Action failed");
    }
  };

  const handleView = async (id: string) => {

    try {

      const entry =
        await HospitalService.getPendingEntry(id);

      setViewEntry(entry);
      setViewOpen(true);

    } catch (err) {

      console.error(err);
      toast.error("Failed to load entry");

    }

  };

  const isExpired = (iso?: string) => {

    if (!iso) return false;

    try {

      return new Date(iso).getTime() <= Date.now();

    } catch {

      return false;

    }

  };

  const ENTRY_FIELD_MAP: Record<string, { label: string; field: string }[]> = {

    visit: [
      { label: "Visit Date", field: "visit_date" },
      { label: "Chief Complaint", field: "chief_complaint" },
      { label: "Diagnosis", field: "diagnosis" },
      { label: "Clinical Notes", field: "notes" },
      { label: "Medication", field: "medication_name" },
      { label: "Medication Start", field: "medication_start_date" },
      { label: "Medication End", field: "medication_end_date" },
    ],

    surgery: [
      { label: "Surgery Name", field: "surgery_name" },
      { label: "Body Part", field: "body_part" },
      { label: "Admit Date", field: "admit_date" },
      { label: "Surgery Date", field: "date_of_surgery" },
      { label: "Discharge Date", field: "discharge_date" },
      { label: "Description", field: "description" },
    ],

    lab: [
      { label: "Test Type", field: "test_type" },
      { label: "Body Part", field: "body_part" },
      { label: "Result", field: "result_summary" },
      { label: "Test Date", field: "test_date" },
    ],

    allergy: [
      { label: "Allergy Type", field: "allergy_type" },
      { label: "Body Part", field: "body_part" },
      { label: "Severity", field: "severity" },
      { label: "Diagnosis", field: "diagnosis" },
    ],

    immunization: [
      { label: "Vaccine Name", field: "vaccine_name" },
      { label: "Dosage", field: "dosage" },
      { label: "Date Administered", field: "date_administered" },
      { label: "Reason", field: "reason" },
    ],

    longtermcondition: [
      { label: "Condition Name", field: "condition_name" },
      { label: "Diagnosed On", field: "diagnosed_on" },
      { label: "Notes", field: "notes" },
    ],

  };

  return (

    <div>

      <div className="flex items-center justify-between mb-4">

        <h1 className="text-2xl font-bold">
          Pending Medical Entries
        </h1>

        <Button onClick={load} disabled={loading}>
          Refresh
        </Button>

      </div>

      {loading && (
        <div className="mb-2 text-sm text-gray-600">
          Loading...
        </div>
      )}

      {error && (
        <div className="mb-2 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      <Table>

        <TableHeader>
          <TableRow>
            <TableHead>Doctor</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>

          {entries.length === 0 && (

            <TableRow>

              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No pending entries
              </TableCell>

            </TableRow>

          )}

          {entries.map((e) => {

            const expired = isExpired(e.expires_at);

            return (

              <TableRow
                key={e.id}
                className={expired ? "opacity-60 bg-red-50" : ""}
              >

                <TableCell>{e.doctor_name || "-"}</TableCell>

                <TableCell>{e.patient_name || "-"}</TableCell>

                <TableCell>{e.entry_type || "-"}</TableCell>

                <TableCell>
                  {e.expires_at
                    ? new Date(e.expires_at).toLocaleString()
                    : "-"}
                </TableCell>

                <TableCell className="space-x-2">

                  <Button
                    variant="outline"
                    onClick={() => handleView(e.id)}
                  >
                  View
                  </Button>

                </TableCell>

              </TableRow>

            );

          })}

        </TableBody>

      </Table>

      {viewOpen && viewEntry && (

        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div
            className="absolute inset-0 bg-black/40 z-40"
            onClick={() => setViewOpen(false)}
          />

          <div className="relative z-50 bg-white rounded-lg shadow w-full max-w-2xl max-h-[90vh] flex flex-col p-6">

            <h3 className="text-xl font-semibold mb-4">
              Medical Entry Details
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">

            {/* Patient Info */}
            <div className="grid grid-cols-3 gap-6 border p-4 rounded bg-white">

              <div>
                <p className="text-xs text-gray-500">Patient</p>
                <p className="font-medium">{viewEntry.patient_name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Age</p>
                <p>{viewEntry.patient_age !== undefined && viewEntry.patient_age !== null? viewEntry.patient_age: "-"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Gender</p>
                <p className="capitalize">{viewEntry.patient_gender}</p>
              </div>

            </div>

            {/* Doctor / Entry Info */}
            <div className="grid grid-cols-3 gap-6 border p-4 rounded bg-white mt-3">

              <div>
                <p className="text-xs text-gray-500">Doctor</p>
                <p className="font-medium">{viewEntry.doctor_name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Entry Type</p>
                <p className="capitalize">{viewEntry.type || viewEntry.entry_type || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Expires</p>
                <p>
                  {viewEntry.expires_at
                    ? new Date(viewEntry.expires_at).toLocaleString()
                    : "-"}
                </p>
              </div>

            </div>

            {/* Entry Details */}
            <div className="border rounded-md p-4 space-y-3 bg-gray-50 mt-4">

              {Object.entries(viewEntry)
                .filter(([key]) =>
                  ![
                    "id",
                    "patient_id",
                    "doctor_id",
                    "hospital_id",
                    "created_at",
                    "expires_at",
                    "patient_name",
                    "patient_age",
                    "patient_gender",
                    "doctor_name",
                    "type",
                    "entry_type",
                  ].includes(key)
                )
                .map(([key, value]) => {

                  if (!value) return null;

                  return (
                    <div key={key}>
                      <p className="text-xs text-gray-500 capitalize">
                        {key.replaceAll("_", " ")}
                      </p>
                      <p>{String(value)}</p>
                    </div>
                  );
                })}

            </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">

            <Button
            variant="ghost"
            onClick={() => setViewOpen(false)}
            >
            Close
            </Button>

            <Button
            onClick={() => openConfirm(viewEntry.id, "approve")}
            >
            Approve
            </Button>

            <Button
            variant="destructive"
            onClick={() => openConfirm(viewEntry.id, "decline")}
            >
            Decline
            </Button>

            </div>

          </div>

        </div>

      )}

      {showConfirm && confirmAction && (

        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirm(false)}
          />

          <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md">

            <h3 className="text-lg font-semibold mb-2">

              {confirmAction === "approve"
                ? "Approve entry?"
                : "Decline entry?"}

            </h3>

            {confirmAction === "decline" && (

              <div className="mb-4">

                <p className="text-sm text-gray-600 mb-2">
                  Reason for decline
                </p>

                <textarea
                  className="border p-2 rounded w-full"
                  value={declineReason}
                  onChange={(e) =>
                    setDeclineReason(e.target.value)
                  }
                  placeholder="Explain why this entry is being declined..."
                />

              </div>

            )}

            <p className="text-sm text-gray-600 mb-4">

              {confirmAction === "approve"
                ? "This will add the entry to the patient's medical history."
                : "This entry will be declined and returned to the doctor."}

            </p>

            <div className="flex justify-end space-x-2">

              <Button
                variant="ghost"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleConfirm}>
                {confirmAction === "approve"
                  ? "Approve"
                  : "Decline"}
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};

export default PendingEntries;
