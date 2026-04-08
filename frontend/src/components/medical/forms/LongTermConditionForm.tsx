import { useState, useEffect } from "react";
import { DoctorService } from "../../../services/DoctorService";
import EntryDetailsModal from "../EntryDetailsModal";

interface Props {
  onChange: (data: any) => void;
  initialValues?: any;
  patientId: string;
}

export default function LongTermConditionForm({
  onChange,
  initialValues,
  patientId
}: Props) {

  const [mode, setMode] = useState<"new" | "followup">(
    initialValues?.parent_condition_id ? "followup" : "new"
  );

  const isEditing = !!initialValues?.id;

  const [conditions, setConditions] = useState<any[]>([]);
  const [selectedCondition, setSelectedCondition] = useState(
    initialValues?.parent_condition_id || ""
  );

  const [showModal, setShowModal] = useState(false);
  const [viewEntry, setViewEntry] = useState<any>(null);

  const [conditionName, setConditionName] = useState(
    initialValues?.condition_name || ""
  );

  const [firstNotedDate, setFirstNotedDate] = useState(
    initialValues?.first_noted_date
      ? initialValues.first_noted_date.split("T")[0]
      : ""
  );

  const [currentCondition, setCurrentCondition] = useState(
    initialValues?.current_condition || ""
  );

  const [diagnosis, setDiagnosis] = useState(
    initialValues?.diagnosis || ""
  );

  const [notes, setNotes] = useState(
    initialValues?.notes || ""
  );

  const [medicationName, setMedicationName] = useState(
    initialValues?.medication_name || ""
  );

  const [medStart, setMedStart] = useState(
    initialValues?.medication_start_date
      ? initialValues.medication_start_date.split("T")[0]
      : ""
  );

  const [medEnd, setMedEnd] = useState(
    initialValues?.medication_end_date
      ? initialValues.medication_end_date.split("T")[0]
      : ""
  );

  useEffect(() => {
    loadConditions();
  }, []);

  async function loadConditions() {
    try {
      const data = await DoctorService.getPreviousConditions(patientId);
      setConditions(data || []);
    } catch (err) {
      console.error("Failed to load conditions", err);
    }
  }

  function openView() {

    const entry = conditions.find((c) => c.id === selectedCondition);

    if (!entry) return;

    setViewEntry(entry);
    setShowModal(true);
  }

  useEffect(() => {

    const baseData =
      mode === "new"
        ? {
            condition_name: conditionName || undefined,
            first_noted_date: firstNotedDate || undefined,
            current_condition: currentCondition || undefined,
            diagnosis: diagnosis || undefined
          }
        : {
            parent_condition_id: selectedCondition,
            current_condition: currentCondition || undefined,
            diagnosis: diagnosis || undefined
          };

    onChange({
      ...baseData,
      notes: notes || undefined,
      medication_name: medicationName || undefined,
      medication_start_date: medStart || undefined,
      medication_end_date: medEnd || undefined
    });

  }, [
    mode,
    selectedCondition,
    conditionName,
    firstNotedDate,
    currentCondition,
    diagnosis,
    notes,
    medicationName,
    medStart,
    medEnd
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
            onChange={() => {
              if (isEditing) return;
              setMode("new");
            }}
          />
          New Condition
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "followup"}
            disabled={isEditing}
            onChange={() => {
              if (isEditing) return;
              setMode("followup");
            }}
          />
          Follow-up
        </label>

      </div>

      {/* ================= NEW CONDITION ================= */}

      {mode === "new" && (

        <>

          <input
            className="border p-2 rounded w-full"
            placeholder="Condition Name"
            value={conditionName}
            onChange={(e) =>
              setConditionName(e.target.value)
            }
          />

          <input
            type="date"
            className="border p-2 rounded w-full"
            value={firstNotedDate}
            onChange={(e) =>
              setFirstNotedDate(e.target.value)
            }
          />

          <textarea
            className="border p-2 rounded w-full"
            placeholder="Current Condition"
            value={currentCondition}
            onChange={(e) =>
              setCurrentCondition(e.target.value)
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
              value={selectedCondition}
              onChange={(e) =>
                setSelectedCondition(e.target.value)
              }
            >

              <option value="">
                Select Previous Condition
              </option>

              {conditions.map((c: any) => (

                <option key={c.id} value={c.id}>
                  {(c.condition_name || "Condition")} -{" "}
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : "Unknown Date"}
                </option>

              ))}

            </select>

            <button
              type="button"
              onClick={openView}
              disabled={!selectedCondition}
              className="px-3 py-2 bg-gray-200 rounded text-sm"
            >
              View
            </button>

          </div>

          <textarea
            className="border p-2 rounded w-full"
            placeholder="Current Condition"
            value={currentCondition}
            onChange={(e) =>
              setCurrentCondition(e.target.value)
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
            value={medStart}
            onChange={(e) =>
              setMedStart(e.target.value)
            }
          />

          <input
            type="date"
            className="border p-2 rounded"
            value={medEnd}
            onChange={(e) =>
              setMedEnd(e.target.value)
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