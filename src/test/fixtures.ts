import type { Budget, CustomerWorkOrderStatus, SparePart, UserResponse, WorkOrder } from '../shared/api/types';

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

export function budgetFixture(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'b1',
    workOrderId: '11111111-1111-4111-8111-111111111111',
    version: 1,
    status: 'DRAFT',
    laborSubtotal: '150.00',
    partsSubtotal: '980.00',
    total: '1130.00',
    currency: 'BOB',
    expiresAt: '2999-01-01T00:00:00.000Z',
    sentAt: null,
    decidedAt: null,
    decisionChannel: null,
    rejectionReason: null,
    items: [
      { id: 'i1', itemType: 'LABOR', description: 'Cambio de módulo / pantalla', sparePartId: null, quantity: 1, unitPrice: '150.00', subtotal: '150.00', reservationStatus: 'NONE' },
      { id: 'i2', itemType: 'PART', description: 'Pantalla OLED iPhone 13', sparePartId: 'p1', quantity: 1, unitPrice: '980.00', subtotal: '980.00', reservationStatus: 'NONE' },
    ],
    ...overrides,
  };
}

export function customerStatusFixture(overrides: Partial<CustomerWorkOrderStatus> = {}): CustomerWorkOrderStatus {
  return {
    id: 'w1',
    number: 123,
    status: 'IN_REPAIR',
    statusLabel: 'En Reparación',
    device: 'Apple iPhone 13',
    promisedAt: '2026-10-25T15:00:00.000Z',
    budgetTotal: '1130.00',
    updatedAt: '2026-10-20T12:00:00.000Z',
    ...overrides,
  };
}

export function pageOf<T>(data: T[], page = 1, pageSize = 20, total = data.length) {
  return { data, page, pageSize, total };
}

export function technicianFixture(overrides: Partial<UserResponse> = {}): UserResponse {
  return {
    id: 'tech-1',
    username: 'tecnico1',
    fullName: 'Técnico Uno',
    role: 'TECHNICIAN',
    customerId: null,
    isActive: true,
    ...overrides,
  };
}

export function paginatedWorkOrders(orders: WorkOrder[], page = 1, pageSize = 20) {
  return pageOf(orders, page, pageSize);
}
