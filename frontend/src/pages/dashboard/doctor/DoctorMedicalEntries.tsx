import { useEffect, useState } from "react";
import { DoctorService } from "../../../services/DoctorService";
import EntryStatusBadge from "../../../components/ui/EntryStatusBadge";
import AddMedicalEntryModal from "../../../components/ui/AddMedicalEntryModal";
import EntryDetailsModal from "../../../components/medical/EntryDetailsModal";

type EntryStatus = "pending" | "approved" | "declined" | "expired";

interface Entry {
  id: string;
  patient_id: string;
  type: string;
  status: EntryStatus;
  created_at: string;
  expires_at?: string;
  reviewed_at?: string;
  decline_reason?: string;
  can_edit?: boolean;
  can_rerequest?: boolean;
}

interface ApprovedPatient {
  patient_id: string;
  patient_name: string;
  entry_access_expires_at?: string;
}

export default function MedicalEntries() {

  const [entries, setEntries] = useState<Entry[]>([]);
  const [patients, setPatients] = useState<ApprovedPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePatient, setActivePatient] =
    useState<ApprovedPatient | null>(null);

  const [selectedEntry, setSelectedEntry] =
    useState<any | null>(null);

  const [viewOpen, setViewOpen] = useState(false);

  const [editingEntry, setEditingEntry] =
    useState<any | null>(null);

  const [openReasonId, setOpenReasonId] =
    useState<string | null>(null);

  // ---------------------------
  // LOAD DATA
  // ---------------------------

  async function load() {

    setLoading(true);

    try {

      const entryPatients =
        await DoctorService.getEntryAccessPatients();

      setPatients(entryPatients || []);

    } catch (err) {

      console.error(
        "Failed to load entry access patients",
        err
      );

    }

    try {

      const history =
        await DoctorService.getDoctorEntryHistory();

      setEntries(history || []);

    } catch (err) {

      console.error(
        "Failed to load entry history",
        err
      );

    }

    setLoading(false);

  }

  useEffect(() => {
    load();
  }, []);

  // ---------------------------
  // VIEW ENTRY
  // ---------------------------

  async function viewEntry(id: string) {

    try {

      const entry =
        await DoctorService.getPendingEntry(id);

      setSelectedEntry(entry);
      setViewOpen(true);

    } catch (err) {

      console.error("Failed to fetch entry", err);

    }

  }

  // ---------------------------
  // RE-REQUEST ENTRY
  // ---------------------------

  async function reRequestEntry(id: string) {

    try {

      await DoctorService.reRequestEntry(id);

      setViewOpen(false);
      setSelectedEntry(null);

      await load();

    } catch (err) {

      console.error(
        "Failed to re-request entry",
        err
      );

    }

  }

  // ---------------------------
  // EDIT ENTRY
  // ---------------------------

  async function editEntry(id: string) {

    try {

      const entry =
        await DoctorService.getPendingEntry(id);

      setViewOpen(false);

      setTimeout(() => {
        setEditingEntry(entry);
      }, 50);

    } catch (err) {

      console.error(
        "Failed to load entry for edit",
        err
      );

    }

  }

  return (

    <div className="max-w-6xl mx-auto space-y-8">

      <h1 className="text-3xl font-bold tracking-tight">
        My Medical Entries
      </h1>

      {/* =============================
          PATIENT ACCESS LIST
      ============================= */}

      <div className="bg-white border rounded-xl p-6 shadow-sm">

        <h2 className="text-lg font-semibold mb-4">
          Patients With Active Entry Access
        </h2>

        {patients.length === 0 && !loading && (

          <p className="text-sm text-gray-500">
            No patients with active entry access
          </p>

        )}

        <div className="space-y-3">

          {patients.map((p) => {

            const expired =
              p.entry_access_expires_at &&
              Date.now() >
                new Date(
                  p.entry_access_expires_at
                ).getTime();

            return (

              <div
                key={p.patient_id}
                className="flex justify-between items-center border rounded-lg p-4"
              >

                <div>

                  <p className="font-medium">
                    {p.patient_name}
                  </p>

                  {p.entry_access_expires_at && (

                    <p className="text-xs text-gray-500">

                      Entry expires:{" "}
                      {new Date(
                        p.entry_access_expires_at
                      ).toLocaleString()}

                    </p>

                  )}

                </div>

                <button
                  disabled={expired}
                  onClick={() => setActivePatient(p)}
                  className={`px-4 py-2 rounded-lg text-white ${
                    expired
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Add Entry
                </button>

              </div>

            );

          })}

        </div>

      </div>

      {/* =============================
          ENTRY HISTORY
      ============================= */}

      <div className="bg-white border rounded-xl p-6 shadow-sm">

        <h2 className="text-lg font-semibold mb-4">
          Entry History (72h visibility)
        </h2>

        {entries.length === 0 && !loading && (

          <p className="text-sm text-gray-500">
            No recent medical entries
          </p>

        )}

        <div className="divide-y">

          {entries.map((e) => (

            <div
              key={e.id}
              className="flex items-center justify-between py-4"
            >

              <div>

                <p className="font-medium capitalize">
                  {e.type}
                </p>

                {/* Decline reason toggle */}

                {e.status === "declined" &&
                  e.decline_reason && (

                    <div className="mt-1">

                      <button
                        onClick={() =>
                          setOpenReasonId(
                            openReasonId === e.id
                              ? null
                              : e.id
                          )
                        }
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        {openReasonId === e.id
                          ? "▾"
                          : "▸"}{" "}
                        Decline reason
                      </button>

                      {openReasonId === e.id && (

                        <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                          {e.decline_reason}
                        </p>

                      )}

                    </div>

                  )}

                <p className="text-sm text-gray-500">
                  {new Date(
                    e.created_at
                  ).toLocaleString()}
                </p>

              </div>

              <div className="flex items-center gap-3">

                <button
                  onClick={() => viewEntry(e.id)}
                  className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100"
                >
                  View
                </button>

                <EntryStatusBadge status={e.status} />

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* =============================
          ADD ENTRY MODAL
      ============================= */}

      {activePatient && (

        <AddMedicalEntryModal
          patientId={activePatient.patient_id}
          onClose={() => setActivePatient(null)}
          onSuccess={load}
        />

      )}

      {/* =============================
          EDIT ENTRY MODAL
      ============================= */}

      {editingEntry && (

        <AddMedicalEntryModal
          patientId={editingEntry.patient_id}
          existingEntry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSuccess={load}
        />

      )}

      {/* =============================
          VIEW ENTRY MODAL
      ============================= */}

      <EntryDetailsModal
        entry={selectedEntry}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        onEdit={editEntry}
        onReRequest={reRequestEntry}
      />

    </div>

  );

}