import type { components } from './schema.gen';

// FE-02: readable aliases over the generated OpenAPI types. Never redeclare a
// response shape by hand; add an alias here instead.
type Schemas = components['schemas'];

export type UserRole = Schemas['AuthResponseDto']['role'];
export type AuthResponse = Schemas['AuthResponseDto'];
export type UserResponse = Schemas['UserResponseDto'];

export type WorkOrder = Schemas['WorkOrderResponseDto'];
export type WorkOrderStatus = WorkOrder['status'];
export type LockType = WorkOrder['lockType'];
export type CreatedWorkOrder = Schemas['CreatedWorkOrderResponseDto'];
export type PaginatedWorkOrders = Schemas['PaginatedWorkOrdersDto'];
export type CreateWorkOrderPayload = Schemas['CreateWorkOrderDto'];
export type CosmeticCheckIn = Schemas['CosmeticCheckInDto'];
export type CosmeticCondition = CosmeticCheckIn['screen'];
export type WorkOrderAuditEntry = Schemas['WorkOrderAuditEntryDto'];
export type UnlockCodeResponse = Schemas['UnlockCodeResponseDto'];
export type TrackingCodeResponse = Schemas['TrackingCodeResponseDto'];
export type CustomerWorkOrderStatus = Schemas['CustomerWorkOrderStatusDto'];
export type PublicTrackingPayload = Schemas['PublicTrackingRequestDto'];

export type DeviceModel = Schemas['DeviceModelResponseDto'];
export type DeviceHistory = Schemas['DeviceHistoryResponseDto'];

export type Budget = Schemas['BudgetResponseDto'];
export type BudgetItem = Schemas['BudgetItemResponseDto'];
export type CreateBudgetPayload = Schemas['CreateBudgetDto'];
export type BudgetItemInput = Schemas['BudgetItemInputDto'];
export type DecisionChannel = Schemas['ApproveBudgetDto']['channel'];

export type SparePart = Schemas['SparePartResponseDto'];
export type SparePartCategory = SparePart['category'];
export type PaginatedSpareParts = Schemas['PaginatedSparePartsDto'];
export type CreateSparePartPayload = Schemas['CreateSparePartDto'];
export type UpdateSparePartPayload = Schemas['UpdateSparePartDto'];
export type StockEntryPayload = Schemas['StockEntryDto'];
export type StockAdjustmentPayload = Schemas['StockAdjustmentDto'];

// Budget statuses are a plain string in the DTO; the backend vocabulary is
// fixed (AI_CONTEXT §6.4).
export type BudgetStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED';
