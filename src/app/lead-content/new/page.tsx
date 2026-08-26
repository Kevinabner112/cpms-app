'use client'
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { ShieldAlert, ArrowLeft, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TestProvider } from '@/types';

export default function NewLeadContentTest() {
  const { items, addLeadContentTest, fetchData, addItem } = useStore();
  const router = useRouter();
  
  const [itemCode, setItemCode] = useState('');
  const [provider, setProvider] = useState<TestProvider>('BV');
  
  const [registrationMode, setRegistrationMode] = useState<'PENDING' | 'FINAL'>('PENDING');
  const [sentDate, setSentDate] = useState(new Date().toISOString().split('T')[0]);
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isNewItem, setIsNewItem] = useState(false);
  const [newItemData, setNewItemData] = useState({
    item_code: '',
    item_name: '',
    main_wood: '',
    handled_by: 'Akzo'
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode) return;
    if (registrationMode === 'PENDING' && !sentDate) return;
    if (registrationMode === 'FINAL' && !testDate) return;
    
    setIsSubmitting(true);
    let finalItemCode = itemCode;

    try {
      if (isNewItem) {
        if (!newItemData.item_code || !newItemData.item_name) {
          setIsSubmitting(false);
          return;
        }
        await addItem(newItemData);
        finalItemCode = newItemData.item_code;
      }

      await addLeadContentTest({
        item_code: finalItemCode,
        provider,
        sent_date: registrationMode === 'PENDING' ? sentDate : undefined,
        test_date: registrationMode === 'FINAL' ? testDate : undefined,
        notes
      });
      router.push('/lead-content');
    } catch (error) {
      console.error(error);
      alert('Failed to add test or create item. Please check if the item code already exists or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
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
            <p className="text-sm text-slate-500">Register a new toxicity test certificate or track a sent panel.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            
            {/* Item Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Item</label>
              <select 
                value={itemCode}
                onChange={(e) => {
                  setItemCode(e.target.value);
                  setIsNewItem(e.target.value === 'NEW_ITEM');
                }}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-slate-50"
              >
                <option value="" disabled>Select an Item...</option>
                <option value="NEW_ITEM" className="font-semibold text-emerald-600">Create New Item</option>
                {items.map(i => (
                  <option key={i.item_code} value={i.item_code}>
                    {i.item_code} - {i.item_name}
                  </option>
                ))}
              </select>
            </div>

            {/* New Item Form (Conditionally Rendered) */}
            {isNewItem && (
              <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 space-y-4">
                <h3 className="text-sm font-bold text-emerald-900 pb-2">New Item Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-800 mb-1">Item Code</label>
                    <input 
                      type="text" 
                      className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="e.g. FEC-999"
                      value={newItemData.item_code}
                      onChange={(e) => setNewItemData({...newItemData, item_code: e.target.value})}
                      required={isNewItem}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-800 mb-1">Item Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="e.g. Modern White Chair"
                      value={newItemData.item_name}
                      onChange={(e) => setNewItemData({...newItemData, item_name: e.target.value})}
                      required={isNewItem}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-800 mb-1">Main Wood</label>
                    <input 
                      type="text" 
                      className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="e.g. Oak / Mahogany"
                      value={newItemData.main_wood}
                      onChange={(e) => setNewItemData({...newItemData, main_wood: e.target.value})}
                      required={isNewItem}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-800 mb-1">Handled By</label>
                    <select 
                      className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      value={newItemData.handled_by}
                      onChange={(e) => setNewItemData({...newItemData, handled_by: e.target.value})}
                    >
                      <option value="Akzo">Akzo</option>
                      <option value="Propan">Propan</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

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

            {/* Registration Mode Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registration Mode</label>
              <div className="flex gap-4">
                <label className="flex-1">
                  <input type="radio" name="mode" value="PENDING" checked={registrationMode === 'PENDING'} onChange={() => setRegistrationMode('PENDING')} className="hidden peer" />
                  <div className="p-3 text-center rounded-xl border border-slate-200 text-sm font-medium text-slate-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 transition-all">
                    1. Just Sent (Pending Result)
                  </div>
                </label>
                <label className="flex-1">
                  <input type="radio" name="mode" value="FINAL" checked={registrationMode === 'FINAL'} onChange={() => setRegistrationMode('FINAL')} className="hidden peer" />
                  <div className="p-3 text-center rounded-xl border border-slate-200 text-sm font-medium text-slate-600 cursor-pointer peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition-all">
                    2. Result Received (Valid)
                  </div>
                </label>
              </div>
            </div>

            {/* Dynamic Date Input based on Mode */}
            {registrationMode === 'PENDING' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sent Date</label>
                <input 
                  type="date"
                  value={sentDate}
                  onChange={(e) => setSentDate(e.target.value)}
                  required={registrationMode === 'PENDING'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Panel is sent to provider for testing. Status will be marked as Pending.</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Test Result Date</label>
                <input 
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  required={registrationMode === 'FINAL'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Expiration will automatically be set to 1 year from this date.</p>
              </div>
            )}

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
