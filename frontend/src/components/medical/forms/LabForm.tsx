import { useState } from "react";

interface Props {
  onChange: (data: any) => void;
  initialValues?: any;
}

export default function LabForm({
  onChange,
  initialValues
}: Props) {

  const [testName, setTestName] = useState(
    initialValues?.test_name || ""
  );

  const [bodyPart, setBodyPart] = useState(
    initialValues?.body_part || ""
  );

  const [reason, setReason] = useState(
    initialValues?.reason || ""
  );

  const [resultText, setResultText] = useState(
    initialValues?.result_text || ""
  );

  const [notes, setNotes] = useState(
    initialValues?.notes || ""
  );

  const [testDate, setTestDate] = useState(
    initialValues?.test_date
      ? initialValues.test_date.split("T")[0]
      : ""
  );

  function update(values: any) {
    onChange({
      test_name: testName || undefined,
      body_part: bodyPart || undefined,
      reason: reason || undefined,
      result_text: resultText || undefined,
      notes: notes || undefined,
      test_date: testDate || undefined,
      ...values
    });
  }

  return (
    <div className="space-y-3">

      <input
        className="border p-2 rounded w-full"
        placeholder="Test Name (Blood / MRI / CT / X-Ray)"
        value={testName}
        onChange={(e) => {
          const v = e.target.value;
          setTestName(v);
          update({ test_name: v });
        }}
      />

      <input
        className="border p-2 rounded w-full"
        placeholder="Body Part (Optional)"
        value={bodyPart}
        onChange={(e) => {
          const v = e.target.value;
          setBodyPart(v);
          update({ body_part: v });
        }}
      />

      <textarea
        className="border p-2 rounded w-full"
        placeholder="Reason for Test"
        value={reason}
        onChange={(e) => {
          const v = e.target.value;
          setReason(v);
          update({ reason: v });
        }}
      />

      <textarea
        className="border p-2 rounded w-full"
        placeholder="Test Result"
        value={resultText}
        onChange={(e) => {
          const v = e.target.value;
          setResultText(v);
          update({ result_text: v });
        }}
      />

      <textarea
        className="border p-2 rounded w-full"
        placeholder="Additional Notes"
        value={notes}
        onChange={(e) => {
          const v = e.target.value;
          setNotes(v);
          update({ notes: v });
        }}
      />

      <input
        type="date"
        className="border p-2 rounded w-full"
        value={testDate}
        onChange={(e) => {
          const v = e.target.value;
          setTestDate(v);
          update({ test_date: v });
        }}
      />

    </div>
  );
}