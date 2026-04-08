import { useState } from "react";

interface Props {
  onChange: (data: any) => void;
  initialValues?: any;
}

export default function ImmunizationForm({
  onChange,
  initialValues
}: Props) {

  const [vaccineName, setVaccineName] = useState(
    initialValues?.vaccine_name || ""
  );

  const [dosage, setDosage] = useState(
    initialValues?.dosage || ""
  );

  const [vaccinationDate, setVaccinationDate] = useState(
    initialValues?.vaccination_date
      ? initialValues.vaccination_date.split("T")[0]
      : ""
  );

  const [reason, setReason] = useState(
    initialValues?.reason || ""
  );

  const [notes, setNotes] = useState(
    initialValues?.notes || ""
  );

  function update(values: any) {
    onChange({
      vaccine_name: vaccineName || undefined,
      dosage: dosage || undefined,
      vaccination_date: vaccinationDate || undefined,
      reason: reason || undefined,
      notes: notes || undefined,
      ...values
    });
  }

  return (
    <div className="space-y-3">

      <input
        className="border p-2 rounded w-full"
        placeholder="Vaccine Name"
        value={vaccineName}
        onChange={(e) => {
          const v = e.target.value;
          setVaccineName(v);
          update({ vaccine_name: v });
        }}
      />

      <input
        className="border p-2 rounded w-full"
        placeholder="Dosage"
        value={dosage}
        onChange={(e) => {
          const v = e.target.value;
          setDosage(v);
          update({ dosage: v });
        }}
      />

      <input
        type="date"
        className="border p-2 rounded w-full"
        value={vaccinationDate}
        onChange={(e) => {
          const v = e.target.value;
          setVaccinationDate(v);
          update({ vaccination_date: v });
        }}
      />

      <textarea
        className="border p-2 rounded w-full"
        placeholder="Reason"
        value={reason}
        onChange={(e) => {
          const v = e.target.value;
          setReason(v);
          update({ reason: v });
        }}
      />

      <textarea
        className="border p-2 rounded w-full"
        placeholder="Notes"
        value={notes}
        onChange={(e) => {
          const v = e.target.value;
          setNotes(v);
          update({ notes: v });
        }}
      />

    </div>
  );
}