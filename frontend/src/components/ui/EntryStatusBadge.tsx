interface Props {
  status: "pending" | "approved" | "declined" | "expired";
}

export default function EntryStatusBadge({ status }: Props) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
}