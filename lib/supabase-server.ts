// Back-compat re-export. New code should import from '@/lib/db/client'.
import { createServiceClient } from '@/lib/db/client';

export function createServerSupabase() {
  return createServiceClient();
}

export { createServiceClient } from '@/lib/db/client';
