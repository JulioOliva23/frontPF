import { request } from '../../../shared/api/httpClient';
import type {
  CreateSparePartPayload,
  PaginatedSpareParts,
  SparePart,
  SparePartCategory,
  StockAdjustmentPayload,
  StockEntryPayload,
  UpdateSparePartPayload,
} from '../../../shared/api/types';

export interface SparePartFilters {
  category?: SparePartCategory;
  deviceModelId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const sparePartsApi = {
  list: (filters: SparePartFilters) => request<PaginatedSpareParts>({ url: '/spare-parts', params: filters }),
  get: (id: string) => request<SparePart>({ url: `/spare-parts/${id}` }),
  lowStock: () => request<SparePart[]>({ url: '/spare-parts/alerts/low-stock' }),
  create: (payload: CreateSparePartPayload) => request<SparePart>({ url: '/spare-parts', method: 'POST', data: payload }),
  update: (id: string, payload: UpdateSparePartPayload) => request<SparePart>({ url: `/spare-parts/${id}`, method: 'PATCH', data: payload }),
  deactivate: (id: string) => request<SparePart>({ url: `/spare-parts/${id}`, method: 'DELETE' }),
  registerEntry: (id: string, payload: StockEntryPayload) => request<SparePart>({ url: `/spare-parts/${id}/stock-entries`, method: 'POST', data: payload }),
  adjust: (id: string, payload: StockAdjustmentPayload) => request<SparePart>({ url: `/spare-parts/${id}/adjustments`, method: 'POST', data: payload }),
};

export const SPARE_PART_CATEGORY_LABELS: Readonly<Record<SparePartCategory, string>> = {
  DISPLAY_OLED: 'Pantalla OLED',
  DISPLAY_LCD: 'Pantalla LCD',
  BATTERY: 'Batería',
  CHARGING_FLEX: 'Flex de carga',
  CAMERA_MODULE: 'Módulo de cámara',
  SMD_COMPONENT: 'Componente SMD',
  IC: 'Circuito integrado (IC)',
  OTHER: 'Otro',
};
