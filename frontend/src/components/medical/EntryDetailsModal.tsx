import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "../ui/dialog";

interface Props {
  entry: any;
  open: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onReRequest?: (id: string) => void;
}

export default function EntryDetailsModal({
  entry,
  open,
  onClose,
  onEdit,
  onReRequest
}: Props) {

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      setProcessing(false);
    }
  }, [open]);

  if (!entry) return null;

  // Fields we don't want to show
  const ignoreFields = [
    "id",
    "patient_id",
    "doctor_id",
    "hospital_id",
    "followups",
    "decline_reason",
    "status"
  ];

  const fields = Object.entries(entry).filter(
    ([key]) => !ignoreFields.includes(key)
  );

  const canModify =
    entry.status === "declined" || entry.status === "expired";

  function formatValue(key: string, value: any) {

    if (value === null || value === undefined || value === "") {
      return "—";
    }

    // Handle date fields
    if (
      key.includes("date") ||
      key.includes("created") ||
      key.includes("expires")
    ) {
      try {
        return new Date(String(value)).toLocaleString();
      } catch {
        return value;
      }
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    // Handle objects
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  function formatLabel(key: string) {
    return key
      .replaceAll("_", " ")
      .replace("medication", "Medication")
      .replace("date", "Date")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return (

    <Dialog open={open} onOpenChange={onClose}>

      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">

        <DialogHeader>

          <DialogTitle className="capitalize">
            {entry.type || entry.entry_type || "Medical Entry"}
          </DialogTitle>

          <DialogDescription>
            Medical record details submitted by the doctor
          </DialogDescription>

        </DialogHeader>

        {/* Decline Reason */}
        {entry.status === "declined" && entry.decline_reason && (

          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">

            <p className="text-sm font-semibold text-red-700">
              Decline Reason
            </p>

            <p className="text-sm text-red-600 mt-1">
              {entry.decline_reason}
            </p>

          </div>

        )}

        {/* Entry Details */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin">

          {fields.map(([key, value]) => (

            <div key={key}>

              <p className="text-xs text-gray-400">
                {formatLabel(key)}
              </p>

              <p className="text-sm break-words">
                {formatValue(key, value)}
              </p>

            </div>

          ))}

        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100"
          >
            Close
          </button>

          {canModify && (
            <>
              <button
                disabled={processing}
                onClick={() => {

                  if (processing) return;

                  setProcessing(true);

                  onClose();

                  setTimeout(() => {
                    onEdit?.(entry.id);
                  }, 150);

                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Edit
              </button>

              <button
                disabled={processing}
                onClick={() => {

                  if (processing) return;

                  setProcessing(true);

                  onClose();

                  setTimeout(() => {
                    onReRequest?.(entry.id);
                  }, 150);

                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Re-Request
              </button>
            </>
          )}

        </div>

      </DialogContent>

    </Dialog>

  );
}