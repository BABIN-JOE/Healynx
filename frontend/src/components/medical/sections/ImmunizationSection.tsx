import { useEffect, useState } from "react";
import { ApprovedEntry } from "../../../services/DoctorService";
import { Button } from "../../ui/button";
import AccessExpiredState from "../../ui/AccessExpiredState";

interface Props {
  entries: ApprovedEntry[];
  readExpired: boolean;
  writeExpired: boolean;
}

export default function ImmunizationSection({
  entries,
  readExpired,
  writeExpired,
}: Props) {
  const [vaccines, setVaccines] = useState<ApprovedEntry[]>([]);
  const [selected, setSelected] = useState<ApprovedEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (readExpired) {
      setLoading(false);
      return;
    }

    const vaccineOnly =
      entries?.filter((e) => e.entry_type === "immunization") || [];

    setVaccines(vaccineOnly);
    setLoading(false);
  }, [entries, readExpired]);

  if (readExpired) return <AccessExpiredState />;

  if (loading) {
    return (
      <p className="text-gray-500">
        Loading immunizations...
      </p>
    );
  }

  if (vaccines.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No immunizations recorded.
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {vaccines.map((v) => (

        <div
          key={v.id}
          className="border rounded-lg p-4 flex justify-between bg-white shadow-sm"
        >

          <div>

            <p className="font-semibold">
              {v.vaccine_name || "Vaccine"}
            </p>

            {v.reason && (
              <p className="text-sm text-gray-600">
                Reason: {v.reason}
              </p>
            )}

            {v.dosage && (
              <p className="text-sm text-gray-600">
                Dosage: {v.dosage}
              </p>
            )}

            {v.vaccination_date && (
              <p className="text-sm text-gray-600">
                Vaccination Date:{" "}
                {new Date(v.vaccination_date).toLocaleDateString()}
              </p>
            )}

            {v.notes && (
              <p className="text-sm text-gray-600 mt-1">
                Notes: {v.notes}
              </p>
            )}

            {v.doctor_name && (
              <p className="text-xs text-gray-500 mt-1">
                {v.doctor_name}
                {v.hospital_name && ` • ${v.hospital_name}`}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Recorded:{" "}
              {v.created_at
                ? new Date(v.created_at).toLocaleString()
                : "—"}
            </p>

          </div>

          <Button size="sm" onClick={() => setSelected(v)}>
            View
          </Button>

        </div>

      ))}

      {/* VIEW MODAL */}

      {selected && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4">

            <h2 className="font-semibold text-lg">
              {selected.vaccine_name || "Immunization Details"}
            </h2>

            <div className="space-y-3 text-sm">

              <div>
                <p className="font-medium">Reason</p>
                <p>{selected.reason || "—"}</p>
              </div>

              <div>
                <p className="font-medium">Dosage</p>
                <p>{selected.dosage || "—"}</p>
              </div>

              <div>
                <p className="font-medium">Notes</p>
                <p>{selected.notes || "—"}</p>
              </div>

              <div>
                <p className="font-medium">Vaccination Date</p>
                <p>
                  {selected.vaccination_date
                    ? new Date(
                        selected.vaccination_date
                      ).toLocaleDateString()
                    : "—"}
                </p>
              </div>

              {selected.notes && (
                <div>
                  <p className="font-medium">Notes</p>
                  <p>{selected.notes}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">

                {selected.doctor_name && (
                  <p>
                    Doctor: {selected.doctor_name}
                  </p>
                )}

                {selected.hospital_name && (
                  <p>
                    Hospital: {selected.hospital_name}
                  </p>
                )}

                <p className="mt-1">
                  Recorded:{" "}
                  {selected.created_at
                    ? new Date(
                        selected.created_at
                      ).toLocaleString()
                    : "—"}
                </p>

              </div>

            </div>

            <div className="text-right">

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelected(null)}
              >
                Close
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}