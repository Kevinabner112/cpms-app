'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewWhiteWoodPage() {
  const router = useRouter();
  const { addWhiteWood, whiteWoods } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    owner: 'N1' as 'N1' | 'MO',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.item_code.trim()) {
        throw new Error('Item Code is required');
      }

      const exists = whiteWoods.some(w => w.item_code.toUpperCase() === formData.item_code.trim().toUpperCase());
      if (exists) {
        throw new Error(`White Wood with item code ${formData.item_code} already exists!`);
      }

      await addWhiteWood({
        item_code: formData.item_code.trim().toUpperCase(),
        item_name: formData.item_name.trim(),
        owner: formData.owner,
        current_location: formData.owner,
      });

      router.push('/whitewood');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
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
          <h1 className="text-2xl font-bold text-slate-900">Add New Master</h1>
          <p className="text-slate-500 text-sm">Register a new White Wood item to the system.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Item Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.item_code}
                    onChange={e => setFormData(p => ({ ...p, item_code: e.target.value.toUpperCase() }))}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase"
                    placeholder="e.g. FEC-501-WW"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Item Name (Description)
                </label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={e => setFormData(p => ({ ...p, item_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Executive Office Chair Framework"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ownership <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`
                    border rounded-lg p-4 cursor-pointer transition-all flex items-center justify-center font-medium
                    ${formData.owner === 'N1' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
                  `}>
                    <input 
                      type="radio" 
                      name="owner" 
                      value="N1" 
                      className="sr-only"
                      checked={formData.owner === 'N1'}
                      onChange={() => setFormData(p => ({ ...p, owner: 'N1' }))}
                    />
                    N1
                  </label>
                  <label className={`
                    border rounded-lg p-4 cursor-pointer transition-all flex items-center justify-center font-medium
                    ${formData.owner === 'MO' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
                  `}>
                    <input 
                      type="radio" 
                      name="owner" 
                      value="MO" 
                      className="sr-only"
                      checked={formData.owner === 'MO'}
                      onChange={() => setFormData(p => ({ ...p, owner: 'MO' }))}
                    />
                    MO
                  </label>
                </div>
              </div>
            </div>

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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                {loading ? 'Saving...' : 'Save Master'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
