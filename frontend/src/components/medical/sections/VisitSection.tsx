import { useEffect, useState } from "react";
import { ApprovedEntry } from "../../../services/DoctorService";
import { Button } from "../../ui/button";
import AccessExpiredState from "../../ui/AccessExpiredState";

interface Props {
  entries: any[];
  readExpired: boolean;
  writeExpired: boolean;
}

export default function VisitSection({
  entries,
  readExpired,
  writeExpired,
}: Props) {

  const [visits, setVisits] = useState<ApprovedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApprovedEntry | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {

    if (readExpired) return;

    const visitOnly =
      entries?.filter((e) => e.entry_type === "visit") || [];

    setVisits(visitOnly);
    setLoading(false);

  }, [entries, readExpired]);

  if (readExpired) return <AccessExpiredState />;

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Loading visits...
      </p>
    );
  }

  return (
    <div className="space-y-6">

      {visits.length === 0 && (
        <p className="text-sm text-gray-500">
          No visit records available.
        </p>
      )}

      {visits.map((visit) => {

        const isOpen = expanded[visit.id];

        return (

          <div
            key={visit.id}
            className="border rounded-lg bg-white shadow-sm"
          >

            {/* MAIN VISIT ROW */}

            <div className="p-4 flex justify-between items-start">

              <div>

                <p className="font-semibold">
                  Visit
                </p>

                {visit.chief_complaint && (
                  <p className="text-sm text-gray-600 mt-1">
                    {visit.chief_complaint}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {visit.visit_date
                    ? new Date(visit.visit_date).toLocaleString()
                    : new Date(visit.created_at).toLocaleString()}
                </p>

                {visit.doctor_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    {visit.doctor_name}
                    {visit.hospital_name && ` • ${visit.hospital_name}`}
                  </p>
                )}

              </div>

              <div className="flex gap-2">

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [visit.id]: !prev[visit.id],
                    }))
                  }
                >
                  {isOpen ? "Hide" : "Expand"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setSelected(visit)}
                >
                  View
                </Button>

              </div>

            </div>

            {/* FOLLOWUPS */}

            {isOpen && visit.followups && visit.followups.length > 0 && (

              <div className="border-t bg-gray-50">

                {visit.followups.map((f: any) => (

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
                          {f.followup_condition}
                        </p>
                      )}

                      {f.diagnosis && (
                        <p className="text-xs text-gray-600">
                          Diagnosis: {f.diagnosis}
                        </p>
                      )}

                      {f.medication_name && (
                        <p className="text-xs text-gray-600">
                          Medication: {f.medication_name}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        {f.visit_date
                          ? new Date(f.visit_date).toLocaleString()
                          : new Date(f.created_at).toLocaleString()}
                      </p>

                      {(f.doctor_name || f.hospital_name) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {f.doctor_name || ""}
                          {f.hospital_name && ` • ${f.hospital_name}`}
                        </p>
                      )}

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

          <div className="bg-white rounded-xl w-full max-w-2xl p-6 space-y-5">

            <h2 className="text-lg font-semibold">
              Visit Details
            </h2>

            <div className="space-y-4 text-sm">

              {selected.chief_complaint && (
                <div>
                  <p className="font-medium">Chief Complaint</p>
                  <p>{selected.chief_complaint}</p>
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
                <div>
                  <p className="font-medium">Medication</p>
                  <p>{selected.medication_name}</p>

                  {(selected.medication_start_date ||
                    selected.medication_end_date) && (

                    <p className="text-xs text-gray-500 mt-1">
                      {selected.medication_start_date && (
                        <>
                          Start:{" "}
                          {new Date(
                            selected.medication_start_date
                          ).toLocaleDateString()}
                        </>
                      )}

                      {selected.medication_end_date && (
                        <>
                          {" "}
                          • End:{" "}
                          {new Date(
                            selected.medication_end_date
                          ).toLocaleDateString()}
                        </>
                      )}
                    </p>

                  )}
                </div>
              )}

              <div className="text-xs text-gray-500 pt-3 border-t">

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

                  Visit Date:{" "}

                  {selected.visit_date
                    ? new Date(selected.visit_date).toLocaleString()
                    : new Date(selected.created_at).toLocaleString()}

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