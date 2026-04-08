import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

export default function PendingEntriesList({
  entries,
  loading,
}: {
  entries: any[];
  loading: boolean;
}) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">
        Pending Entries (Hospital Approval)
      </h3>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No pending entries</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex justify-between items-center border rounded p-2"
            >
              <div>
                <p className="text-sm font-medium">{e.entry_type}</p>
                <p className="text-xs text-gray-500">
                  Submitted at {new Date(e.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">{e.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
