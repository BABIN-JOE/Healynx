import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../../api/apiClient";

export default function DoctorJoinHospital({
  hospitalStatus,
  onHospitalStatusChange,
}: {
  hospitalStatus?: { mapped: boolean; hospital?: any } | null;
  onHospitalStatusChange?: (status: { mapped: boolean; hospital?: any }) => void;
}) {

  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [hospital, setHospital] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkHospital();
  }, []);

  useEffect(() => {
    if (hospitalStatus !== undefined && !checking) {
      if (hospitalStatus?.mapped) {
        setHospital(hospitalStatus.hospital);
      } else {
        setHospital(null);
      }
    }
  }, [hospitalStatus, checking]);

  async function checkHospital() {
    try {
      const { data } = await api.get("/api/v1/doctor/my-hospital");

      if (data?.mapped) {
        setHospital(data.hospital);
        onHospitalStatusChange?.(data);
      } else {
        setHospital(null);
        onHospitalStatusChange?.({ mapped: false });
      }

    } catch (err) {
      console.error(err);
      setHospital(null);
      onHospitalStatusChange?.({ mapped: false });
    } finally {
      setChecking(false);
    }
  }

  const submitRequest = async () => {
    if (!license.trim()) {
      toast.error("Hospital license number is required");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/v1/doctor/request-join/${license.trim()}`);
      toast.success("Join request sent to hospital");
      setLicense("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Failed to send join request"
      );
    } finally {
      setLoading(false);
    }
  };

  const leaveHospital = async () => {
    try {
      await api.post("/api/v1/doctor/leave-hospital");
      toast.success("Left hospital successfully");
      setHospital(null);
      onHospitalStatusChange?.({ mapped: false });
    } catch (err: any) {
      toast.error("Failed to leave hospital");
    }
  };

  if (checking) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (hospital) {
    return (
      <div className="max-w-md bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          {hospital.hospital_name || "Hospital"}
        </h2>

        <h2 className="text-xl font-semibold mb-4">
          {hospital.name || "Hospital"}
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Hospital Name: {hospital.name || "—"}
        </p>

        <p className="text-sm text-gray-600 mb-4">
          License: {hospital.license_number || "—"}
        </p>

        <button
          onClick={leaveHospital}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Leave Hospital
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Join a Hospital</h2>

      <label className="block text-sm font-medium mb-1">
        Hospital License Number
      </label>

      <input
        type="text"
        value={license}
        onChange={(e) => setLicense(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
        placeholder="Enter hospital license"
      />

      <button
        onClick={submitRequest}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Request to Join"}
      </button>
    </div>
  );
}