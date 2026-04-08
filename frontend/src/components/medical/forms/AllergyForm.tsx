import { useState, useEffect } from "react";
import { DoctorService } from "../../../services/DoctorService";
import EntryDetailsModal from "../EntryDetailsModal";

interface Props {
  onChange: (data: any) => void;
  initialValues?: any;
  patientId: string;
}

export default function AllergyForm({
  onChange,
  initialValues,
  patientId
}: Props) {

  const [mode, setMode] = useState<"new" | "followup">(
    initialValues?.parent_allergy_id ? "followup" : "new"
  );

  const isEditing = !!initialValues?.id;

  const [allergies, setAllergies] = useState<any[]>([]);
  const [selectedAllergy, setSelectedAllergy] = useState(
    initialValues?.parent_allergy_id || ""
  );

  const [showModal, setShowModal] = useState(false);
  const [viewEntry, setViewEntry] = useState<any>(null);

  const [allergyType, setAllergyType] = useState(
    initialValues?.allergy_type || ""
  );

  const [bodyLocation, setBodyLocation] = useState(
    initialValues?.body_location || ""
  );

  const [severity, setSeverity] = useState(
    initialValues?.severity || ""
  );

  const [firstNotedDate, setFirstNotedDate] = useState(
    initialValues?.first_noted_date
      ? initialValues.first_noted_date.split("T")[0]
      : ""
  );

  const [diagnosis, setDiagnosis] = useState(
    initialValues?.diagnosis || ""
  );

  const [notes, setNotes] = useState(
    initialValues?.notes || ""
  );

  const [currentCondition, setCurrentCondition] = useState(
    initialValues?.current_condition || ""
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
    loadAllergies();
  }, []);

  async function loadAllergies() {
    try {
      const data = await DoctorService.getPreviousAllergies(patientId);
      console.log("Allergies received:", JSON.stringify(data, null, 2));
      setAllergies(data || []);
    } catch (err) {
      console.error("Failed to load allergies", err);
    }
  }

  function openView() {

    const entry = allergies.find((a) => a.id === selectedAllergy);

    if (!entry) return;

    setViewEntry(entry);
    setShowModal(true);
  }

  useEffect(() => {

    const baseData =
      mode === "new"
        ? {
            allergy_type: allergyType || undefined,
            body_location: bodyLocation || undefined,
            severity: severity || undefined,
            first_noted_date: firstNotedDate || undefined,
            diagnosis: diagnosis || undefined,
          }
        : {
            parent_allergy_id: selectedAllergy,
            followup_condition: currentCondition || undefined,
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
    selectedAllergy,
    allergyType,
    bodyLocation,
    severity,
    firstNotedDate,
    diagnosis,
    currentCondition,
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
          New Allergy
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

      {/* ================= NEW ALLERGY ================= */}

      {mode === "new" && (

        <>

          <input
            required
            className="border p-2 rounded w-full"
            placeholder="Allergy Type"
            value={allergyType}
            onChange={(e) =>
              setAllergyType(e.target.value)
            }
          />

          <input
            required
            className="border p-2 rounded w-full"
            placeholder="Body Location"
            value={bodyLocation}
            onChange={(e) =>
              setBodyLocation(e.target.value)
            }
          />

          <input
            required
            className="border p-2 rounded w-full"
            placeholder="Severity"
            value={severity}
            onChange={(e) =>
              setSeverity(e.target.value)
            }
          />

          <input
            required
            type="date"
            className="border p-2 rounded w-full"
            value={firstNotedDate}
            onChange={(e) =>
              setFirstNotedDate(e.target.value)
            }
          />

          <textarea
            required
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
              required
              className="border p-2 rounded w-full"
              value={selectedAllergy}
              onChange={(e) =>
                setSelectedAllergy(e.target.value)
              }
            >

              <option value="">
                Select Previous Allergy
              </option>

              {allergies.map((a: any) => (

                <option key={a.id} value={a.id}>
                  {(a.allergy_type || "Allergy")} -{" "}
                  {a.created_at
                    ? new Date(a.created_at).toLocaleDateString()
                    : "Unknown Date"}
                </option>

              ))}

            </select>

            <button
              type="button"
              onClick={openView}
              disabled={!selectedAllergy}
              className="px-3 py-2 bg-gray-200 rounded text-sm"
            >
              View
            </button>

          </div>

          <textarea
            required
            className="border p-2 rounded w-full"
            placeholder="Current Condition"
            value={currentCondition}
            onChange={(e) =>
              setCurrentCondition(e.target.value)
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