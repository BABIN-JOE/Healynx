import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DoctorService } from "../../../services/DoctorService";

import PatientHeader from "../../../components/patient/PatientHeader";
import MedicalTabs from "../../../components/medical/MedicalTabs";

import VisitSection from "../../../components/medical/sections/VisitSection";
import SurgerySection from "../../../components/medical/sections/SurgerySection";
import ImmunizationSection from "../../../components/medical/sections/ImmunizationSection";
import AllergySection from "../../../components/medical/sections/AllergySection";
import LabSection from "../../../components/medical/sections/LabSection";
import LongTermDiseaseSection from "../../../components/medical/sections/LongTermDiseaseSection";

import AiChat from "../../../components/medical/AiChat";

export default function DoctorPatientRecords() {

  const navigate = useNavigate();

  const { patientId } = useParams<{ patientId: string }>();

  const [accessData, setAccessData] = useState<any | null>(null);
  const [patientDetails, setPatientDetails] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [readExpired, setReadExpired] = useState(false);
  const [writeExpired, setWriteExpired] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const [showAI, setShowAI] = useState(false);

  const loadPatient = async () => {
    if (!patientId) return;

    try {

      // ----------------------------------
      // 1️⃣ Validate doctor access FIRST
      // ----------------------------------

      const list =
        await DoctorService.getApprovedPatientAccess();

      const match =
        list.find((p: any) => p.patient_id === patientId);

      if (!match) {

        setAccessData(null);
        setReadExpired(true);
        setWriteExpired(true);
        setEntries([]);
        setLoading(false);

        return;

      }

      const expired = (match.view_expires_in ?? 0) <= 0;

      setReadExpired(expired);
      setWriteExpired(expired);
      setAccessData(match);
      setRemaining(match.view_expires_in ?? 0);

      if (expired) {

        setEntries([]);
        return;

      }

      // ----------------------------------
      // 2️⃣ Load patient profile
      // ----------------------------------

      const details =
        await DoctorService.getPatientDetails(patientId!);

      setPatientDetails({
        id: details.id,
        full_name: details.full_name,
        gender: details.gender,
        dob: details.dob,
        phone: details.phone,
        blood_group: details.blood_group ?? null,
        emergency_contact: details.emergency_contact ?? null,
      });

      // ----------------------------------
      // 3️⃣ Load medical records
      // ----------------------------------

      const records =
        await DoctorService.getApprovedEntries(patientId!);

      setEntries(records || []);

    } catch (error: any) {

      console.error("Error loading patient:", error);

      if (error?.response?.status === 403) {

        setEntries([]);
        setAccessData(null);
        setReadExpired(true);
        setWriteExpired(true);

        navigate("/doctor/patient-access");

      }

    } finally {

      setLoading(false);

    }

  };

  // =========================================================
  // LOAD PATIENT
  // =========================================================
  useEffect(() => {
    loadPatient();
  }, [patientId]);

  // =========================================================
  // SET INITIAL TIMER AFTER LOAD
  // =========================================================
  useEffect(() => {
    if (accessData?.view_expires_in !== undefined) {
      setRemaining(accessData.view_expires_in);
    }
  }, [accessData]);

  // =========================================================
  // REAL-TIME COUNTDOWN (CRITICAL FIX)
  // =========================================================
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (!prev || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // INSTANT EXPIRY HANDLING (MAIN FIX)
  // =========================================================
  useEffect(() => {
    if (remaining <= 0 && accessData) {

      // immediately revoke UI access
      setEntries([]);
      setAccessData(null);
      setReadExpired(true);
      setWriteExpired(true);

      // optional redirect (smooth UX)
      setTimeout(() => {
        navigate("/doctor/patient-access");
      }, 1000);
    }
  }, [remaining]);

  // =========================================================
  // FALLBACK POLLING (KEEP AS SAFETY)
  // =========================================================
  useEffect(() => {

    const interval = setInterval(async () => {

      const list = await DoctorService.getApprovedPatientAccess();

      const match = list.find((p: any) => p.patient_id === patientId);

      if (!match || (match.view_expires_in ?? 0) <= 0) {
        navigate("/doctor/patient-access");
      }

    }, 15000);

    return () => clearInterval(interval);

  }, [patientId]);

  return (

    <div className="space-y-6">

      {patientDetails && (

        <>
        <PatientHeader
          patient={patientDetails}
          remainingSeconds={remaining}
          onAskAI={() => setShowAI(true)}
        />

        {showAI && patientDetails && (
            <AiChat
              patientId={patientDetails.id}
              onClose={() => setShowAI(false)}
            />
          )}
        </>

      )}

      <MedicalTabs
        tabs={[
          { key: "visits", label: "Visits" },
          { key: "surgeries", label: "Surgeries" },
          { key: "allergies", label: "Allergies" },
          { key: "labs", label: "Lab Results" },
          { key: "immunizations", label: "Immunizations" },
          { key: "conditions", label: "Long Term Conditions" },
        ]}
      >

        {(active) => {

          switch (active) {

            case "visits":
              return (
                <VisitSection
                  entries={entries}
                  readExpired={readExpired}
                  writeExpired={writeExpired}
                />
              );

            case "surgeries":
              return (
                <SurgerySection
                  entries={entries}
                  readExpired={readExpired}
                  writeExpired={writeExpired}
                />
              );

            case "allergies":
              return (
                <AllergySection
                  entries={entries}
                  readExpired={readExpired}
                  writeExpired={writeExpired}
                />
              );

            case "labs":
              return (
                <LabSection
                  entries={entries}
                  readExpired={readExpired}
                  writeExpired={writeExpired}
                />
              );

            case "immunizations":
              return (
                <ImmunizationSection
                  entries={entries}
                  readExpired={readExpired}
                  writeExpired={writeExpired}
                />
              );

            case "conditions":
              return (
                <LongTermDiseaseSection
                  entries={entries}
                  readExpired={readExpired}
                  writeExpired={writeExpired}
                />
              );

            default:
              return null;

          }

        }}

      </MedicalTabs>

    </div>

  );

}