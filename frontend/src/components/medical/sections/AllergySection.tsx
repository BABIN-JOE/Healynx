import { useEffect, useState } from "react";
import { ApprovedEntry } from "../../../services/DoctorService";
import AccessExpiredState from "../../ui/AccessExpiredState";
import { Button } from "../../ui/button";

interface Props {
  entries: any[];
  readExpired: boolean;
  writeExpired: boolean;
}

export default function AllergySection({
  entries,
  readExpired,
  writeExpired,
}: Props) {

  const [allergies, setAllergies] = useState<ApprovedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApprovedEntry | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {

    if (readExpired) return;

    const allergyOnly =
      entries?.filter((e) => e.entry_type === "allergy") || [];

    setAllergies(allergyOnly);
    setLoading(false);

  }, [entries, readExpired]);

  if (readExpired) return <AccessExpiredState />;

  if (loading) {
    return (
      <p className="text-gray-500">
        Loading allergies...
      </p>
    );
  }

  if (allergies.length === 0) {
    return (
      <p className="text-gray-500">
        No allergies recorded.
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {allergies.map((a) => {

        const isOpen = expanded[a.id];

        return (

          <div
            key={a.id}
            className="border rounded-lg bg-white shadow-sm"
          >

            {/* MAIN ROW */}

            <div className="p-4 flex justify-between items-start">

              <div>

                <p className="font-semibold">
                  {a.allergy_type || "Allergy"}
                </p>

                {a.body_location && (
                  <p className="text-sm text-gray-600">
                    Location: {a.body_location}
                  </p>
                )}

                {a.severity && (
                  <p className="text-sm text-gray-600">
                    Severity: {a.severity}
                  </p>
                )}

                {a.doctor_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    {a.doctor_name}
                    {a.hospital_name && ` • ${a.hospital_name}`}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {new Date(a.created_at).toLocaleString()}
                </p>

              </div>

              <div className="flex gap-2">

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [a.id]: !prev[a.id],
                    }))
                  }
                >
                  {isOpen ? "Hide" : "Expand"}
                </Button>

                <Button size="sm" onClick={() => setSelected(a)}>
                  View
                </Button>

              </div>

            </div>

            {/* FOLLOWUPS */}

            {isOpen && a.followups && a.followups.length > 0 && (

              <div className="border-t bg-gray-50">

                {a.followups.map((f: any) => (

                  <div
                    key={f.id}
                    className="p-3 border-b flex justify-between"
                  >

                    <div>

                      <p className="text-sm font-medium">
                        Follow-up
                      </p>

                      {f.followup_condition && (
                        <p className="text-xs text-gray-600">
                          Condition: {f.followup_condition}
                        </p>
                      )}

                      {f.notes && (
                        <p className="text-xs text-gray-600">
                          {f.notes}
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

          <div className="bg-white rounded-xl w-full max-w-xl p-6 space-y-4">

            <h2 className="text-lg font-semibold">
              {selected.allergy_type || "Allergy Follow-up"}
            </h2>

            <div className="space-y-3 text-sm">

              {selected.allergy_type && (
                <p>
                  <strong>Type:</strong> {selected.allergy_type}
                </p>
              )}

              {selected.body_location && (
                <p>
                  <strong>Body Location:</strong> {selected.body_location}
                </p>
              )}

              {selected.severity && (
                <p>
                  <strong>Severity:</strong> {selected.severity}
                </p>
              )}

              {selected.followup_condition && (
                <div>
                  <p className="font-medium">Follow-up Condition</p>
                  <p>{selected.followup_condition}</p>
                </div>
              )}

              {selected.diagnosis && (
                <div>
                  <p className="font-medium">Diagnosis</p>
                  <p>{selected.diagnosis}</p>
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
                  <strong>Medication:</strong> {selected.medication_name}
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

              <div className="text-xs text-gray-500 pt-2 border-t">

                {selected.doctor_name && (
                  <p>Doctor: {selected.doctor_name}</p>
                )}

                {selected.hospital_name && (
                  <p>Hospital: {selected.hospital_name}</p>
                )}

                <p className="mt-1">
                  Created: {new Date(selected.created_at).toLocaleString()}
                </p>

              </div>

            </div>

            <div className="flex justify-end">

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