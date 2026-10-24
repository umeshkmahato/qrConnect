import { ContactRequestStatus } from '@prisma/client';

/**
 * Contact request lifecycle.
 * PENDING → ACCEPTED | DECLINED | REPORTED
 * ACCEPTED → RESPONDED | CLOSED
 * DECLINED/REPORTED → CLOSED
 * Any → CLOSED (owner or platform admin may close)
 */
const TRANSITIONS: Record<ContactRequestStatus, ContactRequestStatus[]> = {
  PENDING: [
    ContactRequestStatus.ACCEPTED,
    ContactRequestStatus.DECLINED,
    ContactRequestStatus.REPORTED,
    ContactRequestStatus.CLOSED,
  ],
  ACCEPTED: [ContactRequestStatus.RESPONDED, ContactRequestStatus.CLOSED, ContactRequestStatus.REPORTED],
  RESPONDED: [ContactRequestStatus.CLOSED, ContactRequestStatus.REPORTED],
  DECLINED: [ContactRequestStatus.CLOSED],
  REPORTED: [ContactRequestStatus.CLOSED],
  CLOSED: [],
};

export const canTransition = (from: ContactRequestStatus, to: ContactRequestStatus): boolean =>
  TRANSITIONS[from]?.includes(to) ?? false;
