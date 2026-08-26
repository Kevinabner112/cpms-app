'use client'
import { useStore } from '@/store/useStore';
import { StatusBadge } from '@/components/Badge';
import { AlertTriangle, CheckCircle, Package, Plus, ClipboardEdit, Image as ImageIcon, History, Trash2, XCircle, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { NewProcessModal, UpdateProcessModal } from '@/components/PanelProcessModals';
import { PanelCreationProcess } from '@/types';

export default function Dashboard() {
  const { panels, items, panelProcesses, fetchData } = useStore();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalItems = items.length;
  const validPanels = panels.filter(p => p.status === 'VALID').length;
  const expiringPanels = panels.filter(p => p.status === 'EXPIRING_SOON').length;
  const expiredPanels = panels.filter(p => p.status === 'EXPIRED').length;

  const ongoingProcesses = panelProcesses.filter(p => p.status === 'IN_PROGRESS');
  const completedProcesses = panelProcesses.filter(p => p.status !== 'IN_PROGRESS');

  const [isNewProcessModalOpen, setIsNewProcessModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<PanelCreationProcess | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const displayProcesses = showHistory ? completedProcesses : ongoingProcesses;

  const handleExportCSV = () => {
    const headers = ['Process ID', 'Item Code', 'Item Name', 'Handled By', 'Start Date', 'Total Checks', 'Check Details', 'Status', 'Approval Date', 'Lead Time (Days)'];
    
    const rows = displayProcesses.map(proc => {
      const item = items.find(i => i.item_code === proc.item_code);
      const checkDetails = proc.checks.map(c => `Check #${c.check_number} [${c.status}]: ${c.notes || 'No notes'}`).join(' | ');
      return [
        proc.process_id,
        proc.item_code,
        item?.item_name || '',
        proc.handled_by,
        format(parseISO(proc.start_date), 'yyyy-MM-dd'),
        proc.checks.length,
        checkDetails,
        proc.status,
        proc.approval_date ? format(parseISO(proc.approval_date), 'yyyy-MM-dd') : '-',
        proc.lead_time_days !== undefined ? proc.lead_time_days : '-'
      ].map(val => `"${val}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = showHistory ? 'Completed_Developments_' : 'Ongoing_Developments_';
    link.setAttribute('download', `${filename}${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Executive Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div 
          onClick={() => router.push('/panels')}
          className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Active Items</p>
              <h3 className="text-xl font-bold mt-1 text-slate-900">{totalItems}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => router.push('/panels?status=VALID')}
          className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Valid Panels</p>
              <h3 className="text-xl font-bold mt-1 text-emerald-600">{validPanels}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/panels?status=EXPIRING_SOON')}
          className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Expiring Soon (&lt;30d)</p>
              <h3 className="text-xl font-bold mt-1 text-amber-500">{expiringPanels}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/panels?status=EXPIRED')}
          className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-rose-300 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Expired Panels</p>
              <h3 className="text-xl font-bold mt-1 text-rose-600">{expiredPanels}</h3>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setShowHistory(false)}
          className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Ongoing Developments</p>
              <h3 className="text-xl font-bold mt-1 text-indigo-600">{ongoingProcesses.length}</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <ClipboardEdit className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            {showHistory ? <History className="w-5 h-5 text-slate-500" /> : <ClipboardEdit className="w-5 h-5 text-indigo-600" />}
            {showHistory ? 'Completed Panel Developments' : 'Ongoing Panel Developments'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-md flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-md flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <History className="w-3 h-3" />
              {showHistory ? 'Show Ongoing' : 'Show History'}
            </button>
            <button 
              onClick={() => setIsNewProcessModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3 h-3" />
              New Process
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Item Info</th>
                <th className="px-4 py-3 font-semibold">Handled By</th>
                <th className="px-4 py-3 font-semibold">Start Date</th>
                <th className="px-4 py-3 font-semibold text-center">Checks</th>
                {showHistory && <th className="px-4 py-3 font-semibold text-center">Lead Time</th>}
                {showHistory && <th className="px-4 py-3 font-semibold text-center">Result</th>}
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayProcesses.map((proc) => {
                const item = items.find(i => i.item_code === proc.item_code);
                return (
                  <tr key={proc.process_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{proc.item_code}</div>
                      <div className="text-slate-500">{item?.item_name || 'Unknown Item'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                        {proc.handled_by}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {format(parseISO(proc.start_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {proc.checks.map((c, i) => (
                          <div 
                            key={i} 
                            title={`${format(parseISO(c.date), 'dd MMM')} - ${c.status}\n${c.notes}`}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white cursor-help ${
                              c.status === 'PASSED' ? 'bg-emerald-500' : 
                              c.status === 'REVISED' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                        {proc.checks.length === 0 && <span className="text-slate-400 italic">No checks yet</span>}
                      </div>
                    </td>
                    
                    {showHistory && (
                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                        {proc.lead_time_days !== undefined ? `${proc.lead_time_days} Days` : '-'}
                      </td>
                    )}
                    
                    {showHistory && (
                      <td className="px-4 py-3 text-center">
                        {proc.result_photo_url ? (
                          <button 
                            onClick={() => setPreviewImage(proc.result_photo_url!)}
                            className="inline-flex text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="View Photo"
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                        ) : '-'}
                      </td>
                    )}

                    <td className="px-4 py-3 text-right">
                      {!showHistory ? (
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => setSelectedProcess(proc)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] bg-indigo-50 px-2 py-1 rounded"
                          >
                            Update
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this ongoing process?')) {
                                await useStore.getState().deletePanelProcess(proc.process_id);
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded"
                            title="Delete Process"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className={`font-bold text-[10px] px-2 py-1 rounded ${proc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {proc.status}
                          </span>
                          <button 
                            onClick={() => setSelectedProcess(proc)}
                            className="text-slate-600 hover:text-slate-800 font-semibold text-[10px] underline"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayProcesses.length === 0 && (
                <tr>
                  <td colSpan={showHistory ? 7 : 5} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <ClipboardEdit className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-600">
                        {showHistory ? 'No completed processes found.' : 'No active developments right now.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewProcessModal isOpen={isNewProcessModalOpen} onClose={() => setIsNewProcessModalOpen(false)} />
      <UpdateProcessModal isOpen={selectedProcess !== null} onClose={() => setSelectedProcess(null)} process={selectedProcess} />
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col" 
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '90vh' }}
          >
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                  <ImageIcon className="w-5 h-5" /> Result Photo
                </h3>
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch(previewImage);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Panel_Result_${format(new Date(), 'yyyyMMdd_HHmmss')}.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Failed to download image:', err);
                      window.open(previewImage, '_blank');
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md flex items-center gap-2 text-sm font-semibold border border-indigo-200 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
              </div>
              <button 
                onClick={() => setPreviewImage(null)} 
                className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-100 flex-1 overflow-auto flex justify-center items-center group relative min-h-[50vh]">
              {previewImage.startsWith('blob:') && (
                <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-300 shadow-sm z-10">
                  ⚠️ This is a temporary local file (blob). If it appears broken, please re-upload.
                </div>
              )}
              <img 
                src={previewImage} 
                alt="Result" 
                className="max-w-full max-h-[75vh] object-contain rounded border border-slate-300 shadow-sm transition-transform duration-200 ease-in-out hover:scale-[1.5] cursor-zoom-in" 
                style={{ transformOrigin: 'center center' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Not+Found+or+Expired';
                }}
              />
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Hover to Zoom
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
