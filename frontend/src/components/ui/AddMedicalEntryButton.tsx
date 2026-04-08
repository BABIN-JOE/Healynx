import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import AddMedicalEntryModal from "./AddMedicalEntryModal";

interface Props {
  disabled?: boolean;
  patientId: string;
  onSuccess: () => void;
}

export default function AddMedicalEntryButton({
  disabled = false,
  patientId,
  onSuccess,
}: Props) {

  const [open, setOpen] = useState(false);

  // 🔹 Close modal if write access expires while open
  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  const handleClick = () => {
    if (disabled) return;
    setOpen(true);
  };

  return (
    <>
      <div className="pt-4 border-t">

        <Button
          disabled={disabled}
          onClick={handleClick}
        >
          {disabled
            ? "Write access expired"
            : "Add Medical Entry"}
        </Button>

      </div>

      {open && !disabled && (

        <AddMedicalEntryModal
          patientId={patientId}
          onClose={() => setOpen(false)}
          onSuccess={onSuccess}
        />

      )}
    </>
  );
}