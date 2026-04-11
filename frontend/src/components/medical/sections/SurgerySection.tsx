import { useEffect, useState } from "react";
import { ApprovedEntry } from "../../../services/DoctorService";
import { Button } from "../../ui/button";
import AccessExpiredState from "../../ui/AccessExpiredState";

interface Props {
  entries: any[];
  readExpired: boolean;
  writeExpired: boolean;
}

export default function SurgerySection({
  entries,
  readExpired,
  writeExpired,
}: Props) {

  const [surgeries, setSurgeries] = useState<ApprovedEntry[]>([]);
  const [selected, setSelected] = useState<ApprovedEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (readExpired) return;

    const surgeryOnly =
      entries?.filter((e) => e.entry_type === "surgery") || [];

    setSurgeries(surgeryOnly);
    setLoading(false);

  }, [entries, readExpired]);

  if (readExpired) return <AccessExpiredState />;

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Loading surgeries...
      </p>
    );
  }

  return (
    <div className="space-y-6">

      {surgeries.length === 0 && (
        <p className="text-sm text-gray-500">
          No surgery records found.
        </p>
      )}

      {surgeries.map((s) => {

        const isOpen = expanded[s.id];

        return (

          <div
            key={s.id}
            className="border rounded-lg bg-white shadow-sm"
          >

            {/* MAIN SURGERY ROW */}

            <div className="p-4 flex justify-between">

              <div>

                <p className="font-semibold">
                  {s.surgery_name || "Surgery"}
                </p>

                {s.body_part && (
                  <p className="text-sm text-gray-600">
                    Body Part: {s.body_part}
                  </p>
                )}

                {s.surgery_date && (
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(
                      s.surgery_date
                    ).toLocaleDateString()}
                  </p>
                )}

                {s.doctor_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    {s.doctor_name}
                    {s.hospital_name && ` • ${s.hospital_name}`}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {new Date(s.created_at).toLocaleString()}
                </p>

              </div>

              <div className="flex gap-2">

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [s.id]: !prev[s.id],
                    }))
                  }
                >
                  {isOpen ? "Hide" : "Expand"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setSelected(s)}
                >
                  View
                </Button>

              </div>

            </div>

            {/* FOLLOWUPS */}

            {isOpen && s.followups && s.followups.length > 0 && (

              <div className="border-t bg-gray-50">

                {s.followups.map((f: any) => (

                  <div
                    key={f.id}
                    className="p-3 border-b flex justify-between"
                  >

                    <div>

                      <p className="text-sm font-medium">
                        Follow-up
                      </p>

                      {f.notes && (
                        <p className="text-xs text-gray-600">
                          Condition: {f.notes}
                        </p>
                      )}

                      {f.medication_name && (
                        <p className="text-xs text-gray-600">
                          Medication: {f.medication_name}
                        </p>
                      )}

                      {(f.medication_start_date || f.medication_end_date) && (
                        <p className="text-xs text-gray-500">
                          {f.medication_start_date && (
                            <>
                              Start: {new Date(f.medication_start_date).toLocaleDateString()}
                            </>
                          )}

                          {f.medication_end_date && (
                            <>
                              {" "}• End: {new Date(f.medication_end_date).toLocaleDateString()}
                            </>
                          )}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(f.created_at).toLocaleString()}
                      </p>

                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(f)}
                    >
                      View
                    </Button>

                  </div>

                ))}

              </div>

            )}

          </div>

        );

      })}

      {/* VIEW MODAL */}

      {selected && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl w-full max-w-xl space-y-4">

            <h2 className="font-semibold text-lg">
              {selected.surgery_name || "Surgery Follow-up"}
            </h2>

            <div className="space-y-3 text-sm">

              {selected.body_part && (
                <p>
                  <strong>Body Part:</strong>{" "}
                  {selected.body_part}
                </p>
              )}

              {selected.followup_condition && (
                <div>
                  <p className="font-medium">Follow-up Condition</p>
                  <p>{selected.followup_condition}</p>
                </div>
              )}

              {selected.reason && (
                <p>
                  <strong>Reason:</strong>{" "}
                  {selected.reason}
                </p>
              )}

              {selected.description && (
                <div>
                  <p className="font-medium">Description</p>
                  <p>{selected.description}</p>
                </div>
              )}

              {selected.notes && (
                <div>
                  <p className="font-medium">Notes</p>
                  <p>{selected.notes}</p>
                </div>
              )}

              {selected.medication_name && (
                <p>
                  <strong>Medication:</strong>{" "}
                  {selected.medication_name}
                </p>
              )}

              {(selected.medication_start_date || selected.medication_end_date) && (
                <p>
                  <strong>Medication Period:</strong>{" "}
                  {selected.medication_start_date &&
                    new Date(selected.medication_start_date).toLocaleDateString()}
                  {selected.medication_end_date &&
                    ` - ${new Date(selected.medication_end_date).toLocaleDateString()}`}
                </p>
              )}

              {selected.surgery_date && (
                <p>
                  <strong>Surgery Date:</strong>{" "}
                  {new Date(
                    selected.surgery_date
                  ).toLocaleDateString()}
                </p>
              )}

              {selected.admit_date && (
                <p>
                  <strong>Admitted:</strong>{" "}
                  {new Date(
                    selected.admit_date
                  ).toLocaleDateString()}
                </p>
              )}

              {selected.discharge_date && (
                <p>
                  <strong>Discharged:</strong>{" "}
                  {new Date(
                    selected.discharge_date
                  ).toLocaleDateString()}
                </p>
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
                  Created:{" "}
                  {new Date(
                    selected.created_at
                  ).toLocaleString()}
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-2">

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
