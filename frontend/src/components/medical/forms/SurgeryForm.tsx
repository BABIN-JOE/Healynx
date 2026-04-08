import { useState, useEffect } from "react";
import { DoctorService } from "../../../services/DoctorService";
import EntryDetailsModal from "../EntryDetailsModal";

interface Props {
  onChange: (data: any) => void;
  initialValues?: any;
  patientId: string;
}

export default function SurgeryForm({
  onChange,
  initialValues,
  patientId,
}: Props) {

  const [mode, setMode] = useState<"new" | "followup">(
    initialValues?.parent_surgery_id ? "followup" : "new"
  );

  const isEditing = !!initialValues?.id;

  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [selectedSurgery, setSelectedSurgery] = useState(
    initialValues?.parent_surgery_id || ""
  );

  const [showModal, setShowModal] = useState(false);
  const [viewEntry, setViewEntry] = useState<any>(null);

  const [surgeryName, setSurgeryName] = useState(
    initialValues?.surgery_name || ""
  );

  const [bodyPart, setBodyPart] = useState(
    initialValues?.body_part || ""
  );

  const [admitDate, setAdmitDate] = useState(
    initialValues?.admit_date
      ? initialValues.admit_date.split("T")[0]
      : ""
  );

  const [surgeryDate, setSurgeryDate] = useState(
    initialValues?.surgery_date
      ? initialValues.surgery_date.split("T")[0]
      : ""
  );

  const [dischargeDate, setDischargeDate] = useState(
    initialValues?.discharge_date
      ? initialValues.discharge_date.split("T")[0]
      : ""
  );

  const [description, setDescription] = useState(
    initialValues?.description || ""
  );

  const [currentCondition, setCurrentCondition] = useState(
    initialValues?.notes || ""
  );

  const [medication, setMedication] = useState(
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

  const [nextReview, setNextReview] = useState("");

  // ---------------- LOAD SURGERIES ----------------

  useEffect(() => {
    if (!patientId) return;
    loadSurgeries();
  }, [patientId]);

  async function loadSurgeries() {
    try {
      const data = await DoctorService.getPreviousSurgeries(patientId);
      setSurgeries(data || []);
    } catch (err) {
      console.error("Failed to load surgeries", err);
    }
  }

  // ---------------- SEND DATA TO PARENT ----------------

  useEffect(() => {

    const baseData =
      mode === "new"
        ? {
            surgery_name: surgeryName || undefined,
            body_part: bodyPart || undefined,
            admit_date: admitDate || undefined,
            surgery_date: surgeryDate || undefined,
            discharge_date: dischargeDate || undefined,
            description: description || undefined,
          }
        : selectedSurgery
        ? {
            parent_surgery_id: selectedSurgery,
            notes: currentCondition || undefined,
            next_review_date: nextReview || undefined,
          }
        : {};

    onChange({
      ...baseData,
      medication_name: medication || undefined,
      medication_start_date: medStart || undefined,
      medication_end_date: medEnd || undefined,
    });

  }, [
    mode,
    selectedSurgery,
    surgeryName,
    bodyPart,
    admitDate,
    surgeryDate,
    dischargeDate,
    description,
    currentCondition,
    nextReview,
    medication,
    medStart,
    medEnd
  ]);

  // ---------------- DATE VALIDATIONS ----------------

  function handleAdmitDate(date: string) {
    setAdmitDate(date);

    if (surgeryDate && surgeryDate < date) {
      setSurgeryDate(date);
    }
  }

  function handleSurgeryDate(date: string) {
    setSurgeryDate(date);

    if (dischargeDate && dischargeDate < date) {
      setDischargeDate(date);
    }
  }

  // ---------------- VIEW ENTRY ----------------

  function openView() {
    const entry = surgeries.find((s) => s.id === selectedSurgery);
    if (!entry) return;

    setViewEntry(entry);
    setShowModal(true);
  }

  return (
    <div className="space-y-4">

      {/* MODE SELECTION */}

      <div className="flex gap-4">

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "new"}
            disabled={isEditing}
            onChange={() => setMode("new")}
          />
          New Surgery
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "followup"}
            disabled={isEditing}
            onChange={() => setMode("followup")}
          />
          Follow-up
        </label>

      </div>

      {/* ================= NEW SURGERY ================= */}

      {mode === "new" && (
        <>
          <input
            required
            className="border p-2 rounded w-full"
            placeholder="Surgery Name"
            value={surgeryName}
            onChange={(e) => setSurgeryName(e.target.value)}
          />

          <input
            required
            className="border p-2 rounded w-full"
            placeholder="Body Part"
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
          />

          <div>
            <label className="text-sm text-gray-600">
              Admission Date
            </label>

            <input
              required
              type="date"
              className="border p-2 rounded w-full"
              value={admitDate}
              onChange={(e) => handleAdmitDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Surgery Date
            </label>

            <input
              required
              type="date"
              className="border p-2 rounded w-full"
              value={surgeryDate}
              min={admitDate || undefined}
              onChange={(e) => handleSurgeryDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Discharge Date
            </label>

            <input
              required
              type="date"
              className="border p-2 rounded w-full"
              value={dischargeDate}
              min={surgeryDate || admitDate || undefined}
              onChange={(e) => setDischargeDate(e.target.value)}
            />
          </div>

          <textarea
            required
            className="border p-2 rounded w-full"
            placeholder="Procedure Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </>
      )}

      {/* ================= FOLLOWUP ================= */}

      {mode === "followup" && (
        <>
          <div className="flex gap-2">

            <select
              required
              className="border p-2 rounded w-full"
              value={selectedSurgery}
              onChange={(e) => setSelectedSurgery(e.target.value)}
            >
              <option value="">Select Previous Surgery</option>

              {surgeries.map((s: any) => (
                <option key={s.id} value={s.id}>
                   {(s.surgery_name || "Surgery")} -{" "}
                  {new Date(s.surgery_date).toLocaleDateString()}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={openView}
              disabled={!selectedSurgery}
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
            onChange={(e) => setCurrentCondition(e.target.value)}
          />

          <div>
            <label className="text-sm text-gray-600">
              Next Review Date
            </label>

            <input
              type="date"
              className="border p-2 rounded w-full"
              value={nextReview}
              onChange={(e) => setNextReview(e.target.value)}
            />
          </div>
        </>
      )}

      {/* ================= MEDICATION ================= */}

      <div className="border-t pt-4">

        <p className="text-sm font-medium mb-2">
          Medication (Optional)
        </p>

        <input
          className="border p-2 rounded w-full"
          placeholder="Medication Name"
          value={medication}
          disabled={mode === "followup" && !selectedSurgery}
          onChange={(e) => setMedication(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3 mt-2">

          <div>
            <label className="text-sm text-gray-600">
              Medication Start Date
            </label>

            <input
              type="date"
              className="border p-2 rounded"
              value={medStart}
              disabled={mode === "followup" && !selectedSurgery}
              onChange={(e) => setMedStart(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Medication End Date
            </label>

            <input
              type="date"
              className="border p-2 rounded"
              value={medEnd}
              disabled={mode === "followup" && !selectedSurgery}
              onChange={(e) => setMedEnd(e.target.value)}
            />
          </div>

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