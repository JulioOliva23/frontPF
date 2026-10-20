import { request } from '../../../shared/api/httpClient';
import type { CustomerWorkOrderStatus, PublicTrackingPayload } from '../../../shared/api/types';

export const customerPortalApi = {
  // SUP-05: anonymous lookup (rate limited per IP).
  track: (payload: PublicTrackingPayload) => request<CustomerWorkOrderStatus>({ url: '/public/tracking', method: 'POST', data: payload }),
  // RN-14: logged-in CUSTOMER.
  mine: () => request<CustomerWorkOrderStatus[]>({ url: '/work-orders/mine' }),
};
