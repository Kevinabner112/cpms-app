'use client'
import { useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, FileWarning, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LeadContentDashboard() {
  const { leadTests, items, fetchData, isLoading } = useStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { validCount, expiringSoonCount, expiredCount } = useMemo(() => {
    let validCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    leadTests.forEach(test => {
      if (test.status === 'VALID') validCount++;
      else if (test.status === 'EXPIRING_SOON') expiringSoonCount++;
      else if (test.status === 'EXPIRED') expiredCount++;
    });

    return { validCount, expiringSoonCount, expiredCount };
  }, [leadTests]);

  const testsRequiringAttention = useMemo(() => {
    return leadTests.filter(t => t.status === 'EXPIRING_SOON' || t.status === 'EXPIRED');
  }, [leadTests]);

  return (
    <div className="p-4 md:p-8 md:ml-64 bg-slate-50 min-h-screen pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-6 mt-16 md:mt-0">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-emerald-600" />
              Lead Content Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">Overview of toxicity tests and compliance status.</p>
          </div>
          <Link 
            href="/lead-content/new"
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm text-center"
          >
            Register New Test
          </Link>
        </div>

        {/* Metrics */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading Dashboard...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 flex items-center gap-5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center relative z-10">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium text-slate-500 mb-1">Valid Tests</p>
                  <p className="text-3xl font-bold text-slate-900">{validCount}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 flex items-center gap-5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center relative z-10">
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium text-slate-500 mb-1">Expiring Soon (30 Days)</p>
                  <p className="text-3xl font-bold text-slate-900">{expiringSoonCount}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 flex items-center gap-5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center relative z-10">
                  <XCircle className="w-7 h-7 text-rose-600" />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium text-slate-500 mb-1">Expired Tests</p>
                  <p className="text-3xl font-bold text-slate-900">{expiredCount}</p>
                </div>
              </div>
            </div>

            {/* Requires Attention */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileWarning className="w-5 h-5 text-rose-500" />
                  Action Required
                </h2>
                <Link href="/lead-content" className="text-emerald-600 text-sm font-medium hover:text-emerald-700 flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              {testsRequiringAttention.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-slate-900 font-medium">All Clear!</h3>
                  <p className="text-slate-500 text-sm mt-1">No tests are expired or expiring soon.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {testsRequiringAttention.map(test => {
                    const item = items.find(i => i.item_code === test.item_code);
                    const isExpired = test.status === 'EXPIRED';
                    
                    return (
                      <div key={test.test_id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex gap-4 items-center">
                          <div className={`${isExpired ? 'bg-rose-100' : 'bg-amber-100'} p-3 rounded-xl`}>
                            {isExpired ? <XCircle className="w-6 h-6 text-rose-600" /> : <AlertTriangle className="w-6 h-6 text-amber-600" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                              {test.item_code}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${isExpired ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {isExpired ? 'EXPIRED' : 'EXPIRING SOON'}
                              </span>
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                              {item?.item_name} • Tested by {test.provider}
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:text-right w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Expiration Date</p>
                          <p className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
                            {test.expiration_date}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
