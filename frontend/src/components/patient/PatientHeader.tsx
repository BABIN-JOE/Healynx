import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Pencil } from "lucide-react";
import { toast } from "react-hot-toast";
import { DoctorService } from "../../services/DoctorService";

interface Props {
  patient: {
    id: string;
    full_name: string;
    gender: string;
    dob: string;
    phone: string;
    blood_group?: string;
    emergency_contact?: string;
  };
  remainingSeconds: number;
}

export default function PatientHeader({
  patient,
  remainingSeconds,
}: Props) {

  const [open, setOpen] = useState(false);

  const [bloodGroup, setBloodGroup] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [time, setTime] = useState<number>(remainingSeconds ?? 0);
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) {
      return "Expired";
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}m ${secs}s`;
  };

  // 🔹 Sync form state when patient changes
  useEffect(() => {
    setBloodGroup(patient.blood_group || "");
    setPhone(patient.phone || "");
    setEmergencyContact(patient.emergency_contact || "");
  }, [patient]);

  // sync initial value
  useEffect(() => {
    setTime(typeof remainingSeconds === "number" ? remainingSeconds : 0);
  }, [remainingSeconds]);

  // countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        if (!prev || isNaN(prev)) return 0;
        return Math.max(prev - 1, 0);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const calculateAge = (dob: string) => {

    const birth = new Date(dob);
    const today = new Date();

    let age =
      today.getFullYear() -
      birth.getFullYear();

    const m =
      today.getMonth() -
      birth.getMonth();

    if (
      m < 0 ||
      (m === 0 &&
        today.getDate() <
          birth.getDate())
    ) {
      age--;
    }

    return age;

  };

  const age =
    calculateAge(patient.dob);

  const handleSubmit = async () => {

    if (phone === emergencyContact) {
      toast.error(
        "Emergency contact must be different from primary contact"
      );
      return;
    }

    const changes: any = {};

    if (bloodGroup !== patient.blood_group)
      changes.blood_group = bloodGroup;

    if (phone !== patient.phone)
      changes.phone = phone;

    if (emergencyContact !== patient.emergency_contact)
      changes.emergency_contact = emergencyContact;

    if (Object.keys(changes).length === 0) {
      toast("No changes detected");
      return;
    }

    try {

      await DoctorService.requestProfileUpdate(
        patient.id,
        changes
      );

      toast.success(
        "Profile update request sent for approval"
      );

      setOpen(false);

    } catch {

      toast.error(
        "Failed to send update request"
      );

    }

  };

  return (
    <>
      <div className="bg-white border rounded-lg p-6 flex items-start justify-between">

        <div>

          <div className="flex items-center gap-3">

            <h2 className="text-2xl font-semibold">
              {patient.full_name}
            </h2>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>

          </div>

          <div className="mt-2 text-sm text-gray-600 flex gap-3 flex-wrap">

            <span>{age} yrs</span>
            <span>•</span>

            <span className="capitalize">
              {patient.gender}
            </span>

            {patient.blood_group && (
              <>
                <span>•</span>
                <span className="font-medium text-red-600">
                  {patient.blood_group}
                </span>
              </>
            )}

            <span>•</span>
            <span>{patient.phone}</span>

            {patient.emergency_contact && (
              <>
                <span>•</span>
                <span className="text-orange-600 font-medium">
                  Emergency: {patient.emergency_contact}
                </span>
              </>
            )}

          </div>

          <p className="text-xs text-gray-400 mt-1">
            Patient Medical Records
          </p>

        </div>

        <Badge variant="outline">
          Access expires in {formatTime(time)}
        </Badge>

      </div>

      {open && (

        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md space-y-4">

            <h3 className="text-lg font-semibold">
              Edit Patient Profile
            </h3>

            <div>
              <Label>Blood Group</Label>
              <Input
                value={bloodGroup}
                onChange={(e) =>
                  setBloodGroup(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>Contact</Label>
              <Input
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>Emergency Contact</Label>
              <Input
                value={emergencyContact}
                onChange={(e) =>
                  setEmergencyContact(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="flex justify-end gap-2">

              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleSubmit}>
                Submit for Approval
              </Button>

            </div>

          </div>

        </div>

      )}

    </>
  );

}