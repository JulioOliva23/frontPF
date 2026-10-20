import type { SparePart } from '../../../shared/api/types';
import { Badge } from '../../../shared/components/Badge';

// RN-11: available <= min stock.
export function StockBadge({ part }: { part: SparePart }) {
  if (part.availableStock === 0) return <Badge variant="danger" dot>Agotado</Badge>;
  if (part.lowStock) return <Badge variant="warning" dot>Stock bajo</Badge>;
  return <Badge variant="success" dot>Disponible</Badge>;
}
