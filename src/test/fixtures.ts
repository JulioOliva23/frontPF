import type { SparePart, WorkOrder } from '../shared/api/types';

export function workOrderFixture(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    number: 123,
    status: 'APPROVED',
    statusLabel: 'Aprobado',
    allowedTransitions: ['IN_REPAIR'],
    reportedProblem: 'Pantalla rota',
    preliminaryDiagnosis: null,
    batteryLevel: 40,
    cosmeticCheckIn: { screen: 'CRACKED', backCover: 'OK', frame: 'OK', cameraLens: 'OK', buttons: 'OK' },
    lockType: 'PIN',
    hasUnlockCode: true,
    promisedAt: null,
    deliveredAt: null,
    createdAt: '2026-10-19T12:00:00.000Z',
    device: { id: 'd1', deviceModelId: 'm1', imei: '352099001761481', brand: 'Apple', model: 'iPhone 13', color: null },
    customer: { id: 'c1', name: 'María Quispe' },
    technician: { id: 'tech-1', name: 'Técnico Uno' },
    ...overrides,
  };
}

export function sparePartFixture(overrides: Partial<SparePart> = {}): SparePart {
  return {
    id: 'p1',
    sku: 'OLED-IP13',
    name: 'Pantalla OLED iPhone 13',
    category: 'DISPLAY_OLED',
    workshopPrice: '980.00',
    physicalStock: 0,
    reservedStock: 0,
    availableStock: 0,
    minStock: 2,
    lowStock: true,
    compatibleDeviceModelIds: ['m1'],
    ...overrides,
  };
}
