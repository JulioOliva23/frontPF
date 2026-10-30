import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../../shared/api/query-keys';
import type { CreateDeviceModelPayload, CreateUserPayload, UpdateDeviceModelPayload, UpdateUserPayload } from '../../../shared/api/types';
import { deviceModelsAdminApi, usersAdminApi } from '../api/admin-api';

export function useAdminUsers() {
  return useQuery({ queryKey: queryKeys.users.admin, queryFn: usersAdminApi.list });
}

// FE-09: any account change refreshes every user list, including the
// technicians offered for assignment (a role change or deactivation moves
// someone in or out of it).
export function useUserMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => void queryClient.invalidateQueries({ queryKey: queryKeys.users.root });
  return {
    create: useMutation({ mutationFn: (payload: CreateUserPayload) => usersAdminApi.create(payload), onSuccess }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => usersAdminApi.update(id, payload), onSuccess }),
    // No list change: nothing to invalidate.
    resetPassword: useMutation({ mutationFn: ({ id, password }: { id: string; password: string }) => usersAdminApi.resetPassword(id, password) }),
    activate: useMutation({ mutationFn: (id: string) => usersAdminApi.activate(id), onSuccess }),
    deactivate: useMutation({ mutationFn: (id: string) => usersAdminApi.deactivate(id), onSuccess }),
  };
}

export function useDeviceModelCatalog() {
  return useQuery({ queryKey: queryKeys.devices.catalog, queryFn: deviceModelsAdminApi.list });
}

// Invalidates the intake/inventory pickers too (devices.models is a prefix
// of devices.catalog).
export function useDeviceModelMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => void queryClient.invalidateQueries({ queryKey: queryKeys.devices.models });
  return {
    create: useMutation({ mutationFn: (payload: CreateDeviceModelPayload) => deviceModelsAdminApi.create(payload), onSuccess }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateDeviceModelPayload }) => deviceModelsAdminApi.update(id, payload),
      onSuccess,
    }),
  };
}
