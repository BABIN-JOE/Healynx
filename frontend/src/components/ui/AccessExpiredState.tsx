export default function AccessExpiredState() {
  return (
    <div className="border border-dashed rounded-md p-6 text-center">
      <p className="text-sm text-gray-600">
        Patient access has expired.
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Please request access again to view records.
      </p>
    </div>
  );
}
