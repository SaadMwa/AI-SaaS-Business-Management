export default function NumberBadge({ value }: { value: string }) {
  return (
    <span className="rounded-lg bg-surface-muted px-2 py-1 text-xs font-bold text-ink">
      {value}
    </span>
  );
}
