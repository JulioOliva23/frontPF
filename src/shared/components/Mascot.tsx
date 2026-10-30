interface MascotProps {
  className?: string;
  decorative?: boolean;
}

export function Mascot({ className = '', decorative = true }: MascotProps) {
  return (
    <img
      src="/brand/repair-cat.png"
      alt={decorative ? '' : 'Gatito del servicio técnico con gorra y teléfono'}
      width={1296}
      height={1214}
      decoding="async"
      className={`object-contain ${className}`}
    />
  );
}
