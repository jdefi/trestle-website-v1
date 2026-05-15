import { Icon } from "@/components/Icon";

export default function LoadingSpinner({ size = 40, label = "Loading..." }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status">
      <Icon name="spinner" size={size} className="animate-spin text-emerald-600" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}