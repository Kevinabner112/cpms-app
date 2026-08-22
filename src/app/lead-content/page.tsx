'use client'
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Search, ShieldAlert, PlusCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { LeadContentTest } from '@/types';

export default function LeadContentInventory() {
  const { leadTests, items, fetchData, isLoading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTests = leadTests.filter(test => {
    const item = items.find(i => i.item_code === test.item_code);
    const searchString = `${test.item_code} ${item?.item_name || ''} ${test.provider}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'VALID': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'EXPIRING_SOON': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'EXPIRED': return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit";
    switch(status) {
      case 'VALID': return <div className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200`}>Valid</div>;
      case 'EXPIRING_SOON': return <div className={`${base} bg-amber-50 text-amber-700 border border-amber-200`}>Expiring Soon</div>;
      case 'EXPIRED': return <div className={`${base} bg-rose-50 text-rose-700 border border-rose-200`}>Expired</div>;
      case 'PENDING': return <div className={`${base} bg-blue-50 text-blue-700 border border-blue-200`}>Pending Result</div>;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-8 md:ml-64 bg-slate-50 min-h-screen pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-16 md:mt-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-emerald-600" />
              Lead Content Tests
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track toxicity tests for your items.</p>
          </div>
          <Link 
            href="/lead-content/new"
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Test
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by Item Code, Name, or Provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Inventory List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading tests...</div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No tests found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search or add a new test.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Item Details</th>
                    <th className="px-6 py-4 font-semibold">Provider</th>
                    <th className="px-6 py-4 font-semibold">Test Date</th>
                    <th className="px-6 py-4 font-semibold">Expiration</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTests.map(test => {
                    const item = items.find(i => i.item_code === test.item_code);
                    return (
                      <tr key={test.test_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{test.item_code}</div>
                          <div className="text-xs text-slate-500">{item?.item_name || 'Unknown Item'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                            {test.provider}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {test.test_date ? format(new Date(test.test_date), 'dd MMM yyyy') : (test.sent_date ? `Sent: ${format(new Date(test.sent_date), 'dd MMM yyyy')}` : '-')}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {test.expiration_date ? format(new Date(test.expiration_date), 'dd MMM yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(test.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {test.status === 'PENDING' ? (
                            <button onClick={() => {
                              const actualDate = prompt("Enter the actual test date from the result (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
                              if (actualDate) {
                                useStore.getState().finalizeLeadContentRenewal(test.test_id, actualDate);
                              }
                            }} className="text-blue-600 hover:text-blue-700 font-medium text-sm mr-4">
                              Finalize Result
                            </button>
                          ) : (
                            <button onClick={() => {
                              const sentDate = prompt("Enter the date panel was sent to provider (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
                              if (sentDate) {
                                useStore.getState().initiateLeadContentRenewal(test.item_code, test.provider, sentDate);
                              }
                            }} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm mr-4">
                              Renew
                            </button>
                          )}
                          {test.document_url && (
                            <a href={test.document_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 font-medium text-sm mr-4">
                              View Doc
                            </a>
                          )}
                          <button onClick={() => {
                            if(confirm('Are you sure you want to delete this test?')) {
                              useStore.getState().deleteLeadContentTest(test.test_id);
                            }
                          }} className="text-rose-600 hover:text-rose-700 font-medium text-sm">
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
