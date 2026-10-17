import { storage } from '@/lib/storage';

/** The business an admin opens straight into on launch: the last one they opened. */
const key = (adminId: number) => `default_business_${adminId}`;

export const defaultBusiness = {
  get: async (adminId: number) => {
    const value = await storage.get(key(adminId));
    return value ? Number(value) : null;
  },
  set: (adminId: number, businessId: number) => storage.set(key(adminId), String(businessId)),
  clear: (adminId: number) => storage.remove(key(adminId)),
};
