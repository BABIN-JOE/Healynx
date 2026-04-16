import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { DoctorService, ApprovedPatientAccess } from "../../../services/DoctorService";
import { toast } from "sonner";

export default function DoctorPatientAccess() {

  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [aadhaar, setAadhaar] = useState("");
  const [loading, setLoading] = useState(false);

  const [approvedPatients, setApprovedPatients] = useState<ApprovedPatientAccess[]>([]);
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [loadingList, setLoadingList] = useState(true);
  const validPatients = approvedPatients.filter((p) => (timers[p.patient_id] ?? 0) > 0);

  /* =========================================================
     LOAD APPROVED PATIENTS (BACKEND = SOURCE OF TRUTH)
     ========================================================= */

  const loadApprovedPatients = async () => {
    try {

      const data = await DoctorService.getApprovedPatientAccess();

      setApprovedPatients(data);

      const initialTimers: Record<string, number> = {};

      data.forEach((p) => {
        initialTimers[p.patient_id] = p.view_expires_in;
      });

      setTimers(initialTimers);

    } catch {

      setApprovedPatients([]);

    } finally {

      setLoadingList(false);

    }
  };

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    loadApprovedPatients();
  }, []);

  /* =========================================================
     🔁 BACKEND REVALIDATION (AUTO REMOVE AFTER EXPIRY)
     ========================================================= */

  // Auto-refresh disabled - user can manually refresh if needed
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     loadApprovedPatients();
  //   }, 30000); // refresh from backend every 30 sec

  //   return () => clearInterval(interval);
  // }, []);

  /* =========================================================
     ⏱ FRONTEND COUNTDOWN TIMER
     ========================================================= */

  useEffect(() => {

    const interval = setInterval(() => {

      setTimers((prev) => {

        const updated: Record<string, number> = {};

        Object.keys(prev).forEach((key) => {
          updated[key] = Math.max(prev[key] - 1, 0);
        });

        return updated;

      });

    }, 1000);

    return () => clearInterval(interval);

  }, []);

  /* =========================================================
     REQUEST ACCESS
     ========================================================= */

  const handleSubmit = async () => {

    if (aadhaar.length !== 12) {
      toast.error("Enter valid 12-digit Aadhaar number");
      return;
    }

    try {

      setLoading(true);

      await DoctorService.requestPatientAccess(aadhaar);

      toast.success("Access request sent successfully");

      setShowModal(false);
      setAadhaar("");

      loadApprovedPatients();

    } catch (err: any) {

      const errorMsg =
        err?.response?.data?.detail?.[0]?.msg ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Request failed";

      toast.error(errorMsg);

    } finally {

      setLoading(false);

    }

  };

  /* =========================================================
     FORMAT TIMER
     ========================================================= */

  const formatTime = (seconds: number) => {

    if (!seconds || seconds <= 0) return "Expired";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }

    return `${mins}m ${secs}s`;

  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (

    <div>

      {/* HEADER */}

      <div className="flex items-center justify-between mb-4">

        <h1 className="text-2xl font-bold">
          Patient Access
        </h1>

        <div className="flex gap-2">
          <Button onClick={loadApprovedPatients} disabled={loadingList}>
            Refresh
          </Button>
          <Button onClick={() => setShowModal(true)}>
            Request Access
          </Button>
        </div>

      </div>

      {/* APPROVED PATIENTS */}

      <div className="bg-white rounded-lg border p-4">

        <h2 className="font-semibold mb-3">
          Active Patient Access
        </h2>

        {loadingList ? (

          <p className="text-sm text-gray-500">
            Loading...
          </p>

        ) : validPatients.length === 0 ? (

          <p className="text-sm text-gray-500">
            No active patient access available
          </p>

        ) : (

          <ul className="space-y-2">

            {validPatients.map((p) => {

              const seconds = timers[p.patient_id] ?? 0;

              return (

                <li
                  key={p.patient_id}
                  className="flex items-center justify-between border rounded-md px-3 py-2"
                >

                  <div>

                    <p className="font-medium">
                      {p.patient_name}
                    </p>

                    <p className="text-xs text-gray-500">

                      View access expires in{" "}
                      <span className="font-medium">
                        {formatTime(seconds)}
                      </span>

                    </p>

                  </div>

                  <Button
                    size="sm"
                    disabled={seconds <= 0}
                    onClick={() =>
                      navigate(`/doctor/patient-records/${p.patient_id}`)
                    }
                  >
                    View Records
                  </Button>

                </li>

              );

            })}

          </ul>

        )}

      </div>

      {/* REQUEST MODAL */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />

          <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md">

            <h3 className="text-lg font-semibold mb-2">
              Request Patient Access
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Enter patient's Aadhaar number to request access
            </p>

            <Input
              placeholder="12-digit Aadhaar number"
              value={aadhaar}
              maxLength={12}
              onChange={(e) =>
                setAadhaar(e.target.value.replace(/\D/g, ""))
              }
            />

            <div className="flex justify-end gap-2 mt-4">

              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}