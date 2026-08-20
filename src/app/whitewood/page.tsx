'use client';

import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { Package, Plus, MapPin } from 'lucide-react';
import { WhiteWoodBadge } from '@/components/Badge';
import { format } from 'date-fns';

export default function WhiteWoodDashboard() {
  const { whiteWoods } = useStore();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">White Wood Master</h1>
          <p className="text-slate-500 text-sm mt-1">Manage master samples and tracking status.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/whitewood/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
