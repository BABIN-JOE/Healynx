import { useState, useEffect } from "react";
import { Button } from "./button";
import { DoctorService } from "../../services/DoctorService";
import { toast } from "sonner";

import VisitForm from "../medical/forms/VisitForm";
import SurgeryForm from "../medical/forms/SurgeryForm";
import AllergyForm from "../medical/forms/AllergyForm";
import LabForm from "../medical/forms/LabForm";
import ImmunizationForm from "../medical/forms/ImmunizationForm";
import LongTermConditionForm from "../medical/forms/LongTermConditionForm";

interface Props {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
  existingEntry?: any;
}

export default function AddMedicalEntryModal({
  patientId,
  onClose,
  onSuccess,
  existingEntry,
}: Props) {

  const [type, setType] = useState<string>("visit");
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // LOAD EXISTING ENTRY (EDIT)
  // -----------------------------
  useEffect(() => {

    if (existingEntry) {

      const detectedType =
        existingEntry.type ||
        existingEntry.entry_type ||
        "visit";

      setType(detectedType);
      setFormData(existingEntry);

    }

  }, [existingEntry]);

  // -----------------------------
  // RESET FORM ON TYPE CHANGE
  // -----------------------------
  useEffect(() => {

    if (!existingEntry) {
      setFormData({});
    }

  }, [type, existingEntry]);

  // -----------------------------
  // SUBMIT ENTRY
  // -----------------------------
  const submit = async () => {

    if (loading) return;

    if (!formData || Object.keys(formData).length === 0) {
      toast.error("Please fill the required fields");
      return;
    }

    try {

      setLoading(true);

      // Clean payload
      const payload: any = {
        type,
        patient_id: patientId,
        ...formData,
      };

      // Remove internal fields
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.status;
      delete payload.decline_reason;

      if (existingEntry?.id) {

        await DoctorService.editPendingEntry(
          existingEntry.id,
          payload
        );

        toast.success("Entry updated and resubmitted");

      } else {

        await DoctorService.createPendingMedicalEntry(payload);

        toast.success("Entry submitted for hospital approval");

      }

      onSuccess();
      onClose();

    } catch (err) {

      console.error(err);
      toast.error("Failed to submit entry");

    } finally {

      setLoading(false);

    }

  };

  // -----------------------------
  // FORM RENDERER
  // -----------------------------
  function renderForm() {

    const initialValues = existingEntry || {};

    switch (type) {

      case "visit":
        return (
          <VisitForm
          patientId={patientId}
            initialValues={initialValues}
            onChange={setFormData}
          />
        );

      case "surgery":
        return (
          <SurgeryForm
            patientId={patientId}
            initialValues={initialValues}
            onChange={setFormData}
          />
        );

      case "allergy":
        return (
          <AllergyForm
            patientId={patientId}
            initialValues={initialValues}
            onChange={setFormData}
          />
        );

      case "lab":
        return (
          <LabForm
            initialValues={initialValues}
            onChange={setFormData}
          />
        );

      case "immunization":
        return (
          <ImmunizationForm
            initialValues={initialValues}
            onChange={setFormData}
          />
        );

      case "long_term_condition":
        return (
          <LongTermConditionForm
            patientId={patientId}
            initialValues={initialValues}
            onChange={setFormData}
          />
        );

      default:
        return null;

    }

  }

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg max-h-[90vh] overflow-y-auto">

        <h2 className="text-lg font-semibold mb-4">
          {existingEntry ? "Edit Medical Entry" : "Add Medical Entry"}
        </h2>

        {/* DECLINE FEEDBACK */}
        {existingEntry?.decline_reason && (

          <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">

            <p className="text-sm text-red-700">
              Previous Review Feedback
            </p>

            <p className="text-sm font-medium text-red-900">
              {existingEntry.decline_reason}
            </p>

          </div>

        )}

        {/* ENTRY TYPE */}
        <select
          className="w-full border rounded-md p-2 mb-4"
          value={type}
          disabled={!!existingEntry}
          onChange={(e) => setType(e.target.value)}
        >

          <option value="visit">Visit</option>
          <option value="surgery">Surgery</option>
          <option value="allergy">Allergy</option>
          <option value="lab">Lab</option>
          <option value="immunization">
            Immunization
          </option>
          <option value="long_term_condition">
            Long Term Condition
          </option>

        </select>

        {/* FORM */}
        {renderForm()}

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 mt-5">

          <Button
            variant="ghost"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            disabled={loading}
            onClick={submit}
          >
            {loading
              ? "Submitting..."
              : existingEntry
              ? "Update Entry"
              : "Submit"}
          </Button>

        </div>

      </div>

    </div>

  );

}