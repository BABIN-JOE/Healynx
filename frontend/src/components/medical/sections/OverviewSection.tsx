import { differenceInYears } from "date-fns";

interface Props {
  patient: any;
}

export default function PatientHeader({ patient }: Props) {
  const age = patient.dob
    ? differenceInYears(new Date(), new Date(patient.dob))
    : "-";

  return (
    <div className="border rounded-xl p-5 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {patient.patient_name}
          </h2>

          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <p className="text-gray-400 text-xs">Age</p>
              <p>{age}</p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">Gender</p>
              <p>{patient.gender || "-"}</p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">Blood Group</p>
              <p>{patient.blood_group || "-"}</p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">Access Valid Till</p>
              <p>
                {new Date(patient.expires_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
