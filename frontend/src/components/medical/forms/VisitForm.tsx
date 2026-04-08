import { useState, useEffect } from "react";
import { DoctorService } from "../../../services/DoctorService";
import EntryDetailsModal from "../EntryDetailsModal";

interface Props {
  onChange: (data: any) => void;
  initialValues?: any;
  patientId: string;
}

export default function VisitForm({
  onChange,
  initialValues,
  patientId,
}: Props) {

  const [mode, setMode] = useState<"new" | "followup">(
    initialValues?.parent_visit_id ? "followup" : "new"
  );

  const isEditing = !!initialValues?.id;

  const [visits, setVisits] = useState<any[]>([]);
  const [selectedVisit, setSelectedVisit] = useState(
    initialValues?.parent_visit_id || ""
  );

  const [showModal, setShowModal] = useState(false);
  const [viewEntry, setViewEntry] = useState<any>(null);

  const [chiefComplaint, setChiefComplaint] =
    useState(initialValues?.chief_complaint || "");

  const [diagnosis, setDiagnosis] =
    useState(initialValues?.diagnosis || "");

  const [notes, setNotes] =
    useState(initialValues?.notes || "");

  const [followupCondition, setFollowupCondition] =
    useState(initialValues?.followup_condition || "");

  const [medicationName, setMedicationName] =
    useState(initialValues?.medication_name || "");

  const [medicationStartDate, setMedicationStartDate] =
    useState(
      initialValues?.medication_start_date
        ? initialValues.medication_start_date.split("T")[0]
        : ""
    );

  const [medicationEndDate, setMedicationEndDate] =
    useState(
      initialValues?.medication_end_date
        ? initialValues.medication_end_date.split("T")[0]
        : ""
    );
  console.log("VisitForm received patientId:", patientId);
    
  useEffect(() => {
    if (!patientId) return;
    loadVisits();
  }, [patientId]);
  
  async function loadVisits() {

    if (!patientId) return;

    console.log("Loading visits for patient:", patientId);

    try {

      const data = await DoctorService.getPreviousVisits(patientId);

      console.log("Visits received:", data);

      setVisits(data || []);

    } catch (err) {

      console.error("Failed to load visits", err);

    }

  }

  function openView() {

    const entry = visits.find((v) => v.id === selectedVisit);

    if (!entry) return;

    setViewEntry(entry);
    setShowModal(true);
  }

  useEffect(() => {

    const baseData =
      mode === "new"
      ? {
          chief_complaint: chiefComplaint,
          diagnosis: diagnosis || undefined,
        }
        : selectedVisit
          ? {
              parent_visit_id: selectedVisit,
              followup_condition: followupCondition || undefined,
            }
          : {};

    onChange({
      ...baseData,
      notes: notes || undefined,
      medication_name: medicationName || undefined,
      medication_start_date: medicationStartDate || undefined,
      medication_end_date: medicationEndDate || undefined,
    });

  }, [
    mode,
    selectedVisit,
    chiefComplaint,
    diagnosis,
    notes,
    followupCondition,
    medicationName,
    medicationStartDate,
    medicationEndDate
  ]);

  return (
    <div className="space-y-4">

      {/* Mode Selection */}

      <div className="flex gap-4">

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "new"}
            disabled={isEditing}
            onChange={() => setMode("new")}
          />
          New Visit
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "followup"}
            disabled={isEditing || visits.length === 0}
            onChange={() => setMode("followup")}
          />
          Follow-up
        </label>

      </div>

      {/* ================= NEW VISIT ================= */}

      {mode === "new" && (

        <>

          <input
            required={mode === "new"}
            className="border p-2 rounded w-full"
            placeholder="Chief Complaint *"
            value={chiefComplaint}
            onChange={(e) =>
              setChiefComplaint(e.target.value)
            }
          />

          <textarea
            className="border p-2 rounded w-full"
            placeholder="Diagnosis"
            value={diagnosis}
            onChange={(e) =>
              setDiagnosis(e.target.value)
            }
          />

        </>

      )}

      {/* ================= FOLLOW-UP ================= */}

      {mode === "followup" && (

        <>

          <div className="flex gap-2">

            <select
              className="border p-2 rounded w-full"
              value={selectedVisit}
              required={mode === "followup"}
              onChange={(e) =>
                setSelectedVisit(e.target.value)
              }
            >

              <option value="">
                Select Previous Visit
              </option>

              {visits.map((v: any) => (

                <option key={v.id} value={v.id}>
                  {(v.chief_complaint || "Visit")} -{" "}
                  {new Date(v.visit_date).toLocaleDateString()}
                </option>

              ))}

            </select>

            <button
              type="button"
              onClick={openView}
              disabled={!selectedVisit}
              className="px-3 py-2 bg-gray-200 rounded text-sm"
            >
              View
            </button>

          </div>

          <textarea
            className="border p-2 rounded w-full"
            placeholder="Current Condition"
            value={followupCondition}
            onChange={(e) =>
              setFollowupCondition(e.target.value)
            }
          />

        </>

      )}

      {/* ================= NOTES ================= */}

      <textarea
        className="border p-2 rounded w-full"
        placeholder="Notes"
        value={notes}
        onChange={(e) =>
          setNotes(e.target.value)
        }
      />

      {/* ================= MEDICATION ================= */}

      <div className="border-t pt-3">

        <p className="text-sm font-semibold mb-2">
          Medication
        </p>

        <input
          className="border p-2 rounded w-full mb-2"
          placeholder="Medication Name"
          value={medicationName}
          onChange={(e) =>
            setMedicationName(e.target.value)
          }
        />

        <div className="grid grid-cols-2 gap-2">

          <input
            type="date"
            className="border p-2 rounded"
            value={medicationStartDate}
            onChange={(e) =>
              setMedicationStartDate(e.target.value)
            }
          />

          <input
            type="date"
            className="border p-2 rounded"
            value={medicationEndDate}
            onChange={(e) =>
              setMedicationEndDate(e.target.value)
            }
          />

        </div>

      </div>

      {showModal && (
        <EntryDetailsModal
          entry={viewEntry}
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  );
}