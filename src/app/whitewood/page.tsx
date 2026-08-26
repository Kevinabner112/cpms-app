'use client';

import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { Download, Upload, Package, Plus, MapPin } from 'lucide-react';
import { WhiteWoodBadge } from '@/components/Badge';
import { format } from 'date-fns';
import { useRef, useEffect } from 'react';

export default function WhiteWoodDashboard() {
  const { whiteWoods, importWhiteWoodItems, fetchData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = () => {
    const headers = ['Item Code', 'Item Name', 'Owner', 'Location', 'Status'];
    const rows = whiteWoods.map(ww => [
      ww.item_code,
      ww.item_name || '',
      ww.owner,
      ww.current_location,
      ww.status
    ].map(val => `"${val}"`).join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `White_Wood_Master_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      // Assume first line is header
      const newItems = lines.slice(1).map(line => {
        const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(val => val.replace(/^"|"$/g, '')) || [];
        // Expected: Item Code, Item Name, Owner, Location, Status
        return {
          item_code: row[0] || '',
          item_name: row[1] || '',
          owner: (row[2] as any) || 'FES',
          current_location: (row[3] as any) || 'FES',
          status: (row[4] as any) || 'AVAILABLE',
          created_at: new Date().toISOString()
        };
      }).filter(item => item.item_code);

      if (newItems.length > 0) {
        await importWhiteWoodItems(newItems);
        alert(`Successfully imported ${newItems.length} records!`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">White Wood Master</h1>
          <p className="text-slate-500 text-sm mt-1">Manage master samples and tracking status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <Link
            href="/whitewood/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Master WW
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-500" />
            White Wood Inventory
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-semibold">
              <tr>
                <th className="px-2 py-2">Item Code</th>
                <th className="px-2 py-2">Item Name</th>
                <th className="px-2 py-2">Owner</th>
                <th className="px-2 py-2">Location</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {whiteWoods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-slate-500">
                    No White Wood records found.
                  </td>
                </tr>
              ) : (
                whiteWoods.map((ww) => (
                  <tr key={ww.item_code} className="hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-2 font-medium text-slate-900">{ww.item_code}</td>
                    <td className="px-2 py-2 text-slate-600">{ww.item_name || '-'}</td>
                    <td className="px-2 py-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[9px]">
                        {ww.owner}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5" />
                        {ww.current_location}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <WhiteWoodBadge status={ww.status} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      {ww.status === 'AVAILABLE' && (
                        <Link 
                          href={`/whitewood/borrow?item_code=${encodeURIComponent(ww.item_code)}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Borrow &rarr;
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
