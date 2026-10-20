import type { WorkOrderStatus } from '../api/types';

// AI_CONTEXT §5: enums in English, labels in Spanish (GEN-01).
export const WORK_ORDER_STATUS_LABELS: Readonly<Record<WorkOrderStatus, string>> = {
  RECEIVED: 'Ingresado',
  IN_DIAGNOSIS: 'En Diagnóstico',
  BUDGETED: 'Presupuestado',
  APPROVED: 'Aprobado',
  IN_REPAIR: 'En Reparación',
  QUALITY_CONTROL: 'Control de Calidad',
  READY_FOR_DELIVERY: 'Listo para Entrega',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

// Happy path in order; CANCELLED is a side branch.
export const WORK_ORDER_FLOW: readonly WorkOrderStatus[] = [
  'RECEIVED',
  'IN_DIAGNOSIS',
  'BUDGETED',
  'APPROVED',
  'IN_REPAIR',
  'QUALITY_CONTROL',
  'READY_FOR_DELIVERY',
  'DELIVERED',
];

export const ALL_WORK_ORDER_STATUSES: readonly WorkOrderStatus[] = [...WORK_ORDER_FLOW, 'CANCELLED'];

export type StatusTone = 'slate' | 'info' | 'amber' | 'success' | 'purple' | 'danger';

export const WORK_ORDER_STATUS_TONE: Readonly<Record<WorkOrderStatus, StatusTone>> = {
  RECEIVED: 'slate',
  IN_DIAGNOSIS: 'info',
  BUDGETED: 'amber',
  APPROVED: 'success',
  IN_REPAIR: 'purple',
  QUALITY_CONTROL: 'info',
  READY_FOR_DELIVERY: 'success',
  DELIVERED: 'slate',
  CANCELLED: 'danger',
};

// Verb used on the button that moves an order INTO each status.
export const TRANSITION_ACTION_LABELS: Readonly<Record<WorkOrderStatus, string>> = {
  RECEIVED: 'Reingresar',
  IN_DIAGNOSIS: 'Iniciar diagnóstico',
  BUDGETED: 'Marcar presupuestado',
  APPROVED: 'Marcar aprobado',
  IN_REPAIR: 'Iniciar reparación',
  QUALITY_CONTROL: 'Enviar a control de calidad',
  READY_FOR_DELIVERY: 'Marcar listo para entrega',
  DELIVERED: 'Entregar al cliente',
  CANCELLED: 'Cancelar orden',
};
