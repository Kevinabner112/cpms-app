'use client'
import { useState, Suspense, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { StatusBadge } from '@/components/Badge';
import { Search, Filter, Plus, Download, Image as ImageIcon, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';

function PanelInventoryContent() {
  const { panels, items, markPanelMissing, deletePanel, fetchData } = useStore();
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || 'ALL';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // If the URL changes while we are on the page (e.g. going back/forward)
  useEffect(() => {
    const statusFromUrl = searchParams?.get('status');
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  const filteredPanels = panels.filter(panel => {
    const item = items.find(i => i.item_code === panel.item_code);
    const matchesSearch = 
      panel.item_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item?.item_name.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || panel.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleMarkMissing = (panelId: string) => {
    if (confirm('Are you sure you want to mark this panel as missing?')) {
      markPanelMissing(panelId, 'Admin User', 'Marked missing from inventory list');
    }
  };

  const handleDeletePanel = (panelId: string) => {
    if (confirm('Are you sure you want to permanently delete this panel? This action cannot be undone.')) {
      deletePanel(panelId);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Panel ID', 'Item Code', 'Main Wood', 'Item Name', 'Date Approval', 'Date Expired', 'Status', 'Handle By', 'Result (Photo URL)'];
    
    const rows = filteredPanels.map(panel => {
      const item = items.find(i => i.item_code === panel.item_code);
      return [
        panel.panel_id,
        panel.item_code,
        item?.main_wood || '',
        item?.item_name || '',
        format(parseISO(panel.last_updated_date), 'yyyy-MM-dd'),
        format(parseISO(panel.expiration_date), 'yyyy-MM-dd'),
        panel.status,
        item?.handled_by || '',
        panel.photo_url || ''
      ].map(val => `"${val}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Panel_Inventory_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Color Panel Inventory</h1>
          <p className="text-slate-500 mt-1">Manage and track all physical color panels</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors shadow-sm border border-slate-200"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button 
            onClick={() => router.push('/panels/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Panel
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search item code, name, or location..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="VALID">Valid</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
            <option value="MISSING">Missing</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 font-semibold">Item Code - (Main Wood)</th>
                <th className="px-3 py-2 font-semibold">Date Approval</th>
                <th className="px-3 py-2 font-semibold">Date Expired</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Handle By</th>
                <th className="px-3 py-2 font-semibold text-center">Result</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPanels.map((panel) => {
                const item = items.find(i => i.item_code === panel.item_code);
                return (
                  <tr key={panel.panel_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-bold text-slate-900">{panel.item_code} - ({item?.main_wood || '-'})</p>
                      <p className="text-slate-500 text-[10px]">{item?.item_name}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {format(parseISO(panel.last_updated_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-3 py-2 text-slate-900 font-medium">
                      {format(parseISO(panel.expiration_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={panel.status} />
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-medium">
                      {item?.handled_by || '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {panel.photo_url ? (
                        <button 
                          onClick={() => setPreviewImage(panel.photo_url!)}
                          className="inline-flex text-indigo-600 hover:text-indigo-800 transition-colors"
                          title="View Photo"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button 
                        onClick={() => router.push(`/panels/new?item_code=${panel.item_code}`)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-[10px] transition-colors"
                      >
                        Renew
                      </button>
                      {panel.status !== 'MISSING' && (
                        <button 
                          onClick={() => handleMarkMissing(panel.panel_id)}
                          className="text-slate-400 hover:text-rose-600 font-medium text-[10px] transition-colors"
                        >
                          Missing
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeletePanel(panel.panel_id)}
                        className="text-red-500 hover:text-red-700 font-medium text-[10px] transition-colors ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPanels.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    No color panels found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Result Photo
                </h3>
                <a 
                  href={previewImage} 
                  download={`Panel_${format(new Date(), 'yyyyMMdd_HHmmss')}.jpg`}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md flex items-center gap-1 text-xs font-semibold border border-indigo-200 transition-colors shadow-sm"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              </div>
              <button onClick={() => setPreviewImage(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex justify-center">
              <img src={previewImage} alt="Result" className="max-h-[70vh] object-contain rounded border border-slate-200 shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PanelInventory() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading inventory...</div>}>
      <PanelInventoryContent />
    </Suspense>
  );
}
