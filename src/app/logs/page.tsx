'use client'
import { useStore } from '@/store/useStore';
import { format, parseISO } from 'date-fns';
import { History, FilePlus, RefreshCw, AlertTriangle } from 'lucide-react';

export default function LogsPage() {
  const { logs } = useStore();

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'NEW_PANEL':
        return <FilePlus className="w-5 h-5 text-emerald-500" />;
      case 'RENEWAL':
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case 'MARKED_MISSING':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default:
        return <History className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatAction = (action: string) => {
    return action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Audit & History Logs</h1>
        <p className="text-slate-500 mt-1">Timeline of all panel updates and QA sign-offs</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <History className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <p className="text-lg">No activity logs found.</p>
            <p className="text-sm mt-1">Perform a panel renewal to generate logs.</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
            {logs.map((log, idx) => (
              <div key={log.log_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  {getActionIcon(log.action_type)}
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-lg">{formatAction(log.action_type)}</span>
                    <time className="text-sm font-medium text-slate-500">
                      {format(parseISO(log.timestamp), 'dd MMM yyyy, HH:mm')}
                    </time>
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-3">
                    Panel ID: <span className="font-mono font-bold text-slate-800">{log.panel_id}</span>
                  </div>
                  
                  {(log.action_type === 'RENEWAL' || log.action_type === 'NEW_PANEL') && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 text-sm">
                      {log.action_type === 'RENEWAL' && log.previous_expiration_date && (
                        <div className="text-slate-500 line-through text-xs mb-1">
                          Prev Expiration: {format(parseISO(log.previous_expiration_date), 'dd MMM yyyy')}
                        </div>
                      )}
                      {log.new_expiration_date && (
                        <div className="text-slate-800 font-medium">
                          New Expiration: {format(parseISO(log.new_expiration_date), 'dd MMM yyyy')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-end text-sm">
                    <span className="flex flex-col">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Actor</span> 
                      <span className="font-bold text-slate-700">{log.actor_name}</span>
                    </span>
                    {log.notes && (
                      <span className="text-slate-500 italic max-w-[60%] text-right truncate bg-amber-50 px-2 py-1 rounded" title={log.notes}>
                        "{log.notes}"
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
