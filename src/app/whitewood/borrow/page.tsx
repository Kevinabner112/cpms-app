'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ArrowLeft, SendToBack } from 'lucide-react';
import Link from 'next/link';

function BorrowWhiteWoodForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemCodeParam = searchParams?.get('item_code');
  const decodedItemCode = itemCodeParam ? decodeURIComponent(itemCodeParam) : '';

  const { whiteWoods, borrowWhiteWood, isInitialized } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const item = whiteWoods.find(w => w.item_code === decodedItemCode);

  const [formData, setFormData] = useState({
    submission_date: '',
    borrow_date: '',
    outgoing_document: '',
  });

  useEffect(() => {
    if (isInitialized) {
      if (!item) {
        router.replace('/whitewood');
      } else if (item.status !== 'AVAILABLE') {
        router.replace('/whitewood');
      }
    }
  }, [isInitialized, item, router]);

  if (!item) return null;

  const isMOtoN1 = item.owner === 'MO';
  const isN1toMO = item.owner === 'N1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const borrower = isMOtoN1 ? 'N1' : 'MO';

      if (isMOtoN1) {
        if (!formData.submission_date) throw new Error('Tanggal Pengajuan Exim is required for MO -> N1.');
      } else {
        if (!formData.borrow_date) throw new Error('Tanggal Peminjaman is required.');
        if (!formData.outgoing_document) throw new Error('No Surat Jalan is required.');
      }

      await borrowWhiteWood(
        item.item_code, 
        borrower, 
        isMOtoN1 ? formData.submission_date : undefined,
        isN1toMO ? formData.borrow_date : undefined,
        isN1toMO ? formData.outgoing_document : undefined
      );

      router.push('/whitewood/transactions');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/whitewood" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Borrow White Wood</h1>
          <p className="text-slate-500 text-sm">Initiate a loan transaction for {decodedItemCode}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-2">Item Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block">Item Code</span>
                <span className="font-medium text-slate-900">{item.item_code}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Owner</span>
                <span className="font-medium text-slate-900">{item.owner}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 text-sm">
              <span className="font-semibold text-indigo-700 flex items-center gap-2">
                <SendToBack className="w-4 h-4" />
                Loan Route: {item.owner} &rarr; {isMOtoN1 ? 'N1' : 'MO'}
              </span>
              {isMOtoN1 ? (
                <p className="mt-1 text-slate-600">
                  Kepemilikan MO dipinjam ke N1. Anda harus melakukan Pengajuan Exim terlebih dahulu.
                  Dokumen BC akan keluar setelah pengajuan, dan barang baru bisa dikirim.
                </p>
              ) : (
                <p className="mt-1 text-slate-600">
                  Kepemilikan N1 dipinjam ke MO. Hanya memerlukan Surat Jalan dengan keterangan peminjaman.
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {isMOtoN1 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal Pengajuan Exim <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.submission_date}
                  onChange={e => setFormData(p => ({ ...p, submission_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Status transaksi akan menjadi PENDING_EXIM hingga dokumen BC keluar.
                </p>
              </div>
            )}

            {isN1toMO && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal Peminjaman (Pengiriman) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.borrow_date}
                    onChange={e => setFormData(p => ({ ...p, borrow_date: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    No Dokumen Pengiriman (Surat Jalan) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.outgoing_document}
                    onChange={e => setFormData(p => ({ ...p, outgoing_document: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. SJ-2023-08-001"
                  />
                </div>
              </>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Link
                href="/whitewood"
                className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                {loading ? 'Processing...' : (isMOtoN1 ? 'Submit Exim Request' : 'Confirm Loan')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BorrowWhiteWoodPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
      <BorrowWhiteWoodForm />
    </Suspense>
  );
}
