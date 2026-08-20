import { addMonths, differenceInDays, isBefore, startOfDay, parseISO } from 'date-fns';
import { PanelStatus, ReadinessStatus } from '@/types';

export function calculateExpirationDate(lastUpdatedDate: string, validityMonths: number): string {
  const date = parseISO(lastUpdatedDate);
  const expiration = addMonths(date, validityMonths);
  return expiration.toISOString().split('T')[0];
}

export function calculatePanelStatus(expirationDate: string, isMissing: boolean = false): PanelStatus {
  if (isMissing) return 'MISSING';

  const today = startOfDay(new Date());
  const expDate = startOfDay(parseISO(expirationDate));

  if (isBefore(expDate, today)) {
    return 'EXPIRED';
  }

  const daysUntilExpiry = differenceInDays(expDate, today);

  if (daysUntilExpiry <= 30) {
    return 'EXPIRING_SOON';
  }

  return 'VALID';
}

export function getFinishingReadiness(status: PanelStatus | undefined): ReadinessStatus {
  if (!status) return 'RED'; 
  
  switch (status) {
    case 'VALID':
      return 'GREEN';
    case 'EXPIRING_SOON':
      return 'YELLOW';
    case 'EXPIRED':
    case 'MISSING':
      return 'RED';
    default:
      return 'RED';
  }
}
