'use client'
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { ShieldAlert, ArrowLeft, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TestProvider } from '@/types';

export default function NewLeadContentTest() {
  const { items, addLeadContentTest, fetchData } = useStore();
  const router = useRouter();
  
  const [itemCode, setItemCode] = useState('');
  const [provider, setProvider] = useState<TestProvider>('BV');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode || !testDate) return;
    
    setIsSubmitting(true);
    try {
      await addLeadContentTest({
        item_code: itemCode,
        provider,
        test_date: testDate,
        notes
      });
      router.push('/lead-content');
    } catch (error) {
      console.error(error);
      alert('Failed to add test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 md:ml-64 bg-slate-50 min-h-screen pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto space-y-6 mt-16 md:mt-0">
        
        <div className="flex items-center gap-4">
          <Link href="/lead-content" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-emerald-600" />
              New Lead Content Test
            </h1>
            <p className="text-sm text-slate-500">Register a new toxicity test certificate.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            
            {/* Item Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Item</label>
              <select 
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-slate-50"
              >
                <option value="" disabled>Select an Item...</option>
                {items.map(i => (
                  <option key={i.item_code} value={i.item_code}>
                    {i.item_code} - {i.item_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Test Provider</label>
              <div className="flex gap-4">
                <label className="flex-1">
                  <input type="radio" name="provider" value="BV" checked={provider === 'BV'} onChange={() => setProvider('BV')} className="hidden peer" />
                  <div className="p-3 text-center rounded-xl border border-slate-200 text-sm font-medium text-slate-600 cursor-pointer peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition-all">
                    Bureau Veritas (BV)
                  </div>
                </label>
                <label className="flex-1">
                  <input type="radio" name="provider" value="INTERTEK" checked={provider === 'INTERTEK'} onChange={() => setProvider('INTERTEK')} className="hidden peer" />
                  <div className="p-3 text-center rounded-xl border border-slate-200 text-sm font-medium text-slate-600 cursor-pointer peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition-all">
                    Intertek
                  </div>
                </label>
              </div>
            </div>

            {/* Test Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Test Date</label>
              <input 
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
              />
              <p className="text-xs text-slate-500 mt-1">Expiration will automatically be set to 1 year from this date.</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                placeholder="Any special remarks..."
              />
            </div>
            
            {/* Note: Document Upload would go here using Cloudflare R2 just like Color Panel, but omitting for brevity right now. */}

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Register Test'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
