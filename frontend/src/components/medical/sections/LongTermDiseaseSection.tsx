import { useEffect, useState } from "react";
import { ApprovedEntry } from "../../../services/DoctorService";
import { Button } from "../../ui/button";
import AccessExpiredState from "../../ui/AccessExpiredState";

interface Props {
  entries: any[];
  readExpired: boolean;
  writeExpired: boolean;
}

export default function LongTermDiseaseSection({
  entries,
  readExpired,
  writeExpired,
}: Props) {

  const [conditions, setConditions] = useState<ApprovedEntry[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {

    if (readExpired) return;

    const conditionOnly =
      entries?.filter((e) => e.entry_type === "long_term_condition") || [];

    setConditions(conditionOnly);
    setLoading(false);

  }, [entries, readExpired]);

  if (readExpired) return <AccessExpiredState />;

  if (loading) {
    return <p className="text-gray-500">Loading conditions...</p>;
  }

  if (conditions.length === 0) {
    return (
      <p className="text-gray-500">
        No long term conditions recorded.
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {conditions.map((c) => {

        const isOpen = expanded[c.id];

        return (

          <div
            key={c.id}
            className="border rounded-lg bg-white shadow-sm"
          >

            {/* MAIN ROW */}

            <div className="p-4 flex justify-between">

              <div>

                <p className="font-semibold">
                  {c.condition_name}
                </p>

                {c.first_noted_date && (
                  <p className="text-sm text-gray-600">
                    First Noted:{" "}
                    {new Date(
                      c.first_noted_date
                    ).toLocaleDateString()}
                  </p>
                )}

                {c.current_condition && (
                  <p className="text-sm text-gray-600">
                    Condition: {c.current_condition}
                  </p>
                )}

                {c.doctor_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    {c.doctor_name}
                    {c.hospital_name && ` • ${c.hospital_name}`}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {new Date(c.created_at).toLocaleString()}
                </p>

              </div>

              <div className="flex gap-2">

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [c.id]: !prev[c.id],
                    }))
                  }
                >
                  {isOpen ? "Hide" : "Expand"}
                </Button>

                <Button size="sm" onClick={() => setSelected(c)}>
                  View
                </Button>

              </div>

            </div>

            {/* FOLLOWUPS */}

            {isOpen && c.followups && c.followups.length > 0 && (

              <div className="border-t bg-gray-50">

                {c.followups.map((f: any) => (

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
                          Notes: {f.notes}
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
              {selected.condition_name || "Condition Follow-up"}
            </h2>

            <div className="space-y-3 text-sm">

              {selected.first_noted_date && (
                <p>
                  <strong>First Noted:</strong>{" "}
                  {new Date(selected.first_noted_date).toLocaleDateString()}
                </p>
              )}

              {selected.current_condition && (
                <div>
                  <p className="font-medium">Current Condition</p>
                  <p>{selected.current_condition}</p>
                </div>
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

              <div className="text-xs text-gray-500 pt-2 border-t">

                {selected.doctor_name && (
                  <p>Doctor: {selected.doctor_name}</p>
                )}

                {selected.hospital_name && (
                  <p>Hospital: {selected.hospital_name}</p>
                )}

                <p className="mt-1">
                  Created:{" "}
                  {new Date(selected.created_at).toLocaleString()}
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