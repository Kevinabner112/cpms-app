'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ArrowRightLeft, FileCheck, Undo2 } from 'lucide-react';
import { WhiteWoodBadge } from '@/components/Badge';
import { differenceInDays, addMonths, parseISO } from 'date-fns';
import { WhiteWoodTransaction } from '@/types/whitewood';

export default function WhiteWoodTransactionsPage() {
  const { whiteWoodLogs, updateEximStatus, returnWhiteWood } = useStore();
  
  const [eximModal, setEximModal] = useState<WhiteWoodTransaction | null>(null);
  const [returnModal, setReturnModal] = useState<WhiteWoodTransaction | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    document: ''
  });

  const handleOpenExim = (t: WhiteWoodTransaction) => {
    setFormData({ date: '', document: '' });
    setEximModal(t);
  };

  const handleOpenReturn = (t: WhiteWoodTransaction) => {
    setFormData({ date: '', document: '' });
    setReturnModal(t);
  };

  const submitExim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eximModal) return;
    try {
      await updateEximStatus(eximModal.transaction_id, eximModal.item_code, formData.date, formData.document);
      setEximModal(null);
    } catch (err) {
      alert('Failed to update Exim status');
    }
  };

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModal) return;
    try {
      await returnWhiteWood(returnModal.transaction_id, returnModal.item_code, formData.date, formData.document);
      setReturnModal(null);
    } catch (err) {
      alert('Failed to process return');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">White Wood Loans</h1>
          <p className="text-slate-500 text-sm mt-1">Track active loans, pending exim documents, and return history.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-slate-500" />
            Transaction History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-semibold">
              <tr>
                <th className="px-2 py-2">Transaction ID</th>
                <th className="px-2 py-2">Item Code</th>
                <th className="px-2 py-2">Borrower</th>
                <th className="px-2 py-2">Dates</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {whiteWoodLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                whiteWoodLogs.map((t) => {
                  let daysLeft = null;
                  if (t.status === 'ACTIVE' && t.due_date) {
                    daysLeft = differenceInDays(parseISO(t.due_date), new Date());
                  }

                  return (
                    <tr key={t.transaction_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-2 font-medium text-slate-900">
                        {t.transaction_id}
                      </td>
                      <td className="px-2 py-2 font-semibold text-indigo-700">{t.item_code}</td>
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[9px]">
                          {t.borrower}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-slate-600 space-y-1">
                        {t.submission_date && <div>Exim: {t.submission_date}</div>}
                        {t.borrow_date && <div>Borrow: {t.borrow_date}</div>}
                        {t.due_date && (
                          <div className={`font-medium ${daysLeft !== null && daysLeft < 0 ? 'text-rose-600' : ''}`}>
                            Due: {t.due_date} {daysLeft !== null && `(${daysLeft} days left)`}
                          </div>
                        )}
                        {t.return_date && <div className="text-emerald-600">Return: {t.return_date}</div>}
                      </td>
                      <td className="px-2 py-2">
                        <WhiteWoodBadge status={t.status} />
                      </td>
                      <td className="px-2 py-2 text-right space-x-3">
                        {t.status === 'PENDING_EXIM' && (
                          <button
                            onClick={() => handleOpenExim(t)}
                            className="text-amber-600 hover:text-amber-800 font-medium text-[10px] flex items-center gap-1 justify-end w-full"
                          >
                            <FileCheck className="w-4 h-4" />
                            Complete Exim
                          </button>
                        )}
                        {t.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleOpenReturn(t)}
                            className="text-emerald-600 hover:text-emerald-800 font-medium text-[10px] flex items-center gap-1 justify-end w-full"
                          >
                            <Undo2 className="w-4 h-4" />
                            Return Item
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXIM MODAL */}
      {eximModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Complete Exim Document</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter the BC document and Surat Jalan details for <strong>{eximModal.item_code}</strong>.
            </p>
            <form onSubmit={submitExim} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Peminjaman (Kirim)</label>
                <input
                  type="date" required value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Surat Jalan + BC No</label>
                <input
                  type="text" required value={formData.document} onChange={e => setFormData(p => ({...p, document: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-md" placeholder="e.g. BC-123 / SJ-456"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setEximModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Return Item</h3>
            <p className="text-sm text-slate-600 mb-4">
              Process the return of <strong>{returnModal.item_code}</strong>.
            </p>
            <form onSubmit={submitReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Pengembalian</label>
                <input
                  type="date" required value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dokumen Pengembalian</label>
                <input
                  type="text" required value={formData.document} onChange={e => setFormData(p => ({...p, document: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-md" placeholder="e.g. SJ-RET-789"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setReturnModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">Confirm Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
