import { useEffect, useState } from "react";
import { ApprovedEntry } from "../../../services/DoctorService";
import { Button } from "../../ui/button";
import AccessExpiredState from "../../ui/AccessExpiredState";

interface Props {
  entries: any[];
  readExpired: boolean;
  writeExpired: boolean;
}

export default function LabSection({
  entries,
  readExpired,
  writeExpired,
}: Props) {

  const [labs, setLabs] = useState<ApprovedEntry[]>([]);
  const [selected, setSelected] = useState<ApprovedEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (readExpired) return;

    const labOnly =
      entries?.filter((e) => e.entry_type === "lab") || [];

    setLabs(labOnly);
    setLoading(false);

  }, [entries, readExpired]);

  if (readExpired) return <AccessExpiredState />;

  if (loading) {
    return (
      <p className="text-gray-500">
        Loading lab results...
      </p>
    );
  }

  if (labs.length === 0) {
    return (
      <p className="text-gray-500">
        No lab results recorded.
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {labs.map((l) => (

        <div
          key={l.id}
          className="border rounded-lg p-4 flex justify-between bg-white shadow-sm"
        >

          <div>

            <p className="font-semibold">
              {l.test_name || "Lab Test"}
            </p>

            {l.body_part && (
              <p className="text-sm text-gray-600">
                Body Part: {l.body_part}
              </p>
            )}

            {l.reason && (
              <p className="text-sm text-gray-600">
                Reason: {l.reason}
              </p>
            )}

            {l.test_date && (
              <p className="text-sm text-gray-600">
                Test Date: {new Date(l.test_date).toLocaleDateString()}
              </p>
            )}

            {l.doctor_name && (
              <p className="text-xs text-gray-500 mt-1">
                {l.doctor_name}
                {l.hospital_name && ` • ${l.hospital_name}`}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Created:{" "}
              {new Date(l.created_at).toLocaleString()}
            </p>

          </div>

          <Button size="sm" onClick={() => setSelected(l)}>
            View
          </Button>

        </div>

      ))}

      {/* VIEW MODAL */}

      {selected && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4">

            <h2 className="font-semibold text-lg">
              {selected.test_name || "Lab Result"}
            </h2>

            <div className="space-y-3 text-sm">

              {selected.body_part && (
                <div>
                  <p className="font-medium">Body Part</p>
                  <p>{selected.body_part}</p>
                </div>
              )}

              {selected.reason && (
                <div>
                  <p className="font-medium">Reason</p>
                  <p>{selected.reason}</p>
                </div>
              )}

              {selected.test_date && (
                <div>
                  <p className="font-medium">Test Date</p>
                  <p>{new Date(selected.test_date).toLocaleDateString()}</p>
                </div>
              )}

              <div>
                <p className="font-medium">Result</p>
                <p>{selected.result_text || "—"}</p>
              </div>

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
                  {new Date(selected.created_at).toLocaleString()}
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