import { cn } from "../../lib/utils";

export type MedicalSection =
  | "overview"
  | "visits_notes"
  | "medications_therapies"
  | "conditions"
  | "investigations"
  | "procedures_surgeries"
  | "immunizations";

interface Props {
  activeSection: MedicalSection;
  onChange: (section: MedicalSection) => void;
}

const sections: { id: MedicalSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "visits_notes", label: "Visits & Notes" },
  { id: "medications_therapies", label: "Medications & Therapies" },
  { id: "conditions", label: "Conditions" },
  { id: "investigations", label: "Investigations" },
  { id: "procedures_surgeries", label: "Procedures & Surgeries" },
  { id: "immunizations", label: "Immunizations" },
];

export default function MedicalSidebar({ activeSection, onChange }: Props) {
  return (
    <div className="w-64 bg-white border rounded-lg p-3 space-y-1">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition",
            activeSection === s.id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
