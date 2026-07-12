import { shipTypeColor } from "@/lib/vesselFeatures";
import { shipTypeLabel } from "@/lib/shipTypes";

// Placeholder por categoria de tipo (sem fotos no v1): silhueta genérica
// tingida com a cor do tipo, mais o rótulo.
export function VesselSilhouette({ shipType }: { shipType?: string }) {
  const color = shipTypeColor(shipType);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded bg-gray-50 py-8">
      <svg
        viewBox="0 0 120 60"
        className="h-20 w-40"
        role="img"
        aria-label={`Silhueta de ${shipTypeLabel(shipType)}`}
      >
        {shipType === "sailing" || shipType === "pleasure" ? (
          <>
            <path d="M60 8 L60 42 L30 42 Z" fill={color} opacity="0.9" />
            <path d="M62 12 L84 42 L62 42 Z" fill={color} opacity="0.5" />
            <path
              d="M20 44 L100 44 L90 54 L30 54 Z"
              fill="#1B252E"
              opacity="0.85"
            />
          </>
        ) : (
          <>
            <rect x="18" y="30" width="84" height="16" rx="2" fill="#1B252E" opacity="0.85" />
            <path d="M18 46 L102 46 L94 56 L26 56 Z" fill="#1B252E" opacity="0.85" />
            <rect x="40" y="16" width="34" height="16" rx="2" fill={color} />
            <rect x="78" y="22" width="10" height="10" fill={color} opacity="0.7" />
          </>
        )}
      </svg>
      <span className="text-xs uppercase tracking-wide text-gray-500">
        {shipTypeLabel(shipType)}
      </span>
    </div>
  );
}
