import { cn } from '@/lib/utils';
import { PanelStatus, ReadinessStatus } from '@/types';

export function StatusBadge({ status }: { status: PanelStatus }) {
  const colorMap: Record<PanelStatus, string> = {
    VALID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    EXPIRING_SOON: 'bg-amber-100 text-amber-800 border-amber-200',
    EXPIRED: 'bg-rose-100 text-rose-800 border-rose-200',
    MISSING: 'bg-slate-100 text-slate-800 border-slate-200',
    PENDING: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const labelMap: Record<PanelStatus, string> = {
    VALID: 'Valid',
    EXPIRING_SOON: 'Expiring Soon',
    EXPIRED: 'Expired',
    MISSING: 'Missing',
    PENDING: 'Pending',
  };

  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', colorMap[status])}>
      {labelMap[status]}
    </span>
  );
}

export function ReadinessBadge({ readiness }: { readiness: ReadinessStatus }) {
  const colorMap: Record<ReadinessStatus, string> = {
    GREEN: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    YELLOW: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    RED: 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.8)]',
  };

  const labelMap: Record<ReadinessStatus, string> = {
    GREEN: 'Ready (Green)',
    YELLOW: 'Caution (Yellow)',
    RED: 'Blocked (Red)',
  };

  return (
    <span className="flex items-center space-x-2">
      <span className={cn('w-3.5 h-3.5 rounded-full', colorMap[readiness])} />
      <span className="text-sm font-semibold">{labelMap[readiness]}</span>
    </span>
  );
}

import { WhiteWoodStatus, TransactionStatus } from '@/types/whitewood';

export function WhiteWoodBadge({ status }: { status: WhiteWoodStatus | TransactionStatus }) {
  const colorMap: Record<string, string> = {
    AVAILABLE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PENDING_EXIM: 'bg-amber-100 text-amber-800 border-amber-200',
    BORROWED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    ACTIVE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    RETURNED: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const labelMap: Record<string, string> = {
    AVAILABLE: 'Available',
    PENDING_EXIM: 'Pending Exim',
    BORROWED: 'Borrowed',
    ACTIVE: 'Active Loan',
    RETURNED: 'Returned',
  };

  return (
    <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-semibold border whitespace-nowrap', colorMap[status as string])}>
      {labelMap[status as string]}
    </span>
  );
}
