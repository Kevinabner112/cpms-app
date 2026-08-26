'use client'
import { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import { format } from 'date-fns';

function NewPanelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialItemCode = searchParams?.get('item_code') || '';
  
  const { items, panels, renewPanel, addPanel, addItem, deleteItem, importItems, startPanelProcess } = useStore();
  
  const [isRenewal, setIsRenewal] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);

  const [formData, setFormData] = useState({
    item_code: initialItemCode,
    validity_period_months: '6',
    qa_inspector_name: '',
    last_updated_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const [newItemData, setNewItemData] = useState({
    item_code: '',
    item_name: '',
    main_wood: '',
    handled_by: 'Akzo'
  });

  const selectedItem = items.find(i => i.item_code === formData.item_code);
  const existingPanel = panels.find(p => p.item_code === formData.item_code);

  useEffect(() => {
    if (formData.item_code === 'NEW_ITEM') {
      setIsNewItem(true);
      setIsRenewal(false);
    } else {
      setIsNewItem(false);
      if (existingPanel) {
        setIsRenewal(true);
      } else {
        setIsRenewal(false);
      }
    }
  }, [formData.item_code, existingPanel]);

  const handleDeleteItem = (itemCode: string) => {
    if (confirm(`Are you sure you want to delete master item ${itemCode}? This cannot be undone.`)) {
      deleteItem(itemCode);
      setFormData({...formData, item_code: ''});
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        alert('Invalid CSV. Must contain at least a header and one row of data.');
        return;
      }
      
      const parsedItems = [];
      
      // format: item_code, item_name, main_wood, handled_by
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const item = {
          item_code: values[0]?.trim() || '',
          item_name: values[1]?.trim() || '',
          main_wood: values[2]?.trim() || '',
          handled_by: values[3]?.trim() || 'Akzo',
        };
        if (item.item_code && item.item_name) {
          parsedItems.push(item);
        }
      }
      
      if (parsedItems.length > 0) {
        if (confirm(`Found ${parsedItems.length} items. Do you want to import them?`)) {
          await importItems(parsedItems);
          alert('Import successful!');
        }
      } else {
        alert('No valid items found in CSV. Format should be: item_code,item_name,main_wood,handled_by');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalItemCode = formData.item_code;
    setIsSubmitting(true);

    try {
      if (isNewItem) {
        if (!newItemData.item_code || !newItemData.item_name) {
          setIsSubmitting(false);
          return;
        }
        await addItem(newItemData);
        finalItemCode = newItemData.item_code;
      } else {
        if (!selectedItem) {
          setIsSubmitting(false);
          return;
        }
      }

      if (isRenewal && existingPanel && !isNewItem) {
        // Instead of directly renewing, we start a new panel process
        await startPanelProcess(
          existingPanel.item_code,
          formData.qa_inspector_name || 'System',
          formData.last_updated_date
        );
        router.push('/panels/dashboard');
        return;
      } else {
        await addPanel(
          finalItemCode, 
          parseInt(formData.validity_period_months), 
          formData.qa_inspector_name,
          formData.last_updated_date
        );
      }

      router.push('/panels');
    } catch (error) {
      console.error(error);
      alert('Failed to save data. Please try again or check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isRenewal ? 'Renew Color Panel' : 'New Color Panel'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRenewal ? 'Update physical panel and reset expiration date' : 'Register a new physical color panel'}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-slate-700">Item Selection</label>
                <div>
                  <input type="file" id="csv-upload" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  <label htmlFor="csv-upload" className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                    <Upload className="w-3 h-3" />
                    Import CSV
                  </label>
                </div>
              </div>
              <select 
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                value={formData.item_code}
                onChange={(e) => setFormData({...formData, item_code: e.target.value})}
                required
              >
                <option value="">Select an Item...</option>
                <option value="NEW_ITEM" className="font-semibold text-blue-600">Create New Item</option>
                {items.map(item => (
                  <option key={item.item_code} value={item.item_code}>
                    {item.item_code} - {item.item_name}
                  </option>
                ))}
              </select>
            </div>

            {isNewItem && (
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 space-y-4">
                <h3 className="text-sm font-bold text-blue-900 pb-2">New Item Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 mb-1">Item Code</label>
                    <input 
                      type="text" 
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. FEC-999"
                      value={newItemData.item_code}
                      onChange={(e) => setNewItemData({...newItemData, item_code: e.target.value})}
                      required={isNewItem}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 mb-1">Item Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Modern White Chair"
                      value={newItemData.item_name}
                      onChange={(e) => setNewItemData({...newItemData, item_name: e.target.value})}
                      required={isNewItem}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 mb-1">Main Wood</label>
                    <input 
                      type="text" 
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Oak / Mahogany"
                      value={newItemData.main_wood}
                      onChange={(e) => setNewItemData({...newItemData, main_wood: e.target.value})}
                      required={isNewItem}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 mb-1">Handled By</label>
                    <select 
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
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

            {!isNewItem && selectedItem && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Main Wood</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedItem.main_wood || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Handled By</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">{selectedItem.handled_by || '-'}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => handleDeleteItem(selectedItem.item_code)}
                  className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-xs font-semibold ml-4"
                >
                  Delete Master Item
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date Approval</label>
                <input 
                  type="date"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.last_updated_date}
                  onChange={(e) => setFormData({...formData, last_updated_date: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Validity Period</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  value={formData.validity_period_months}
                  onChange={(e) => setFormData({...formData, validity_period_months: e.target.value})}
                  required
                >
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">QA Inspector Name</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Inspector name"
                  value={formData.qa_inspector_name}
                  onChange={(e) => setFormData({...formData, qa_inspector_name: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Notes (Optional)</label>
              <textarea 
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]"
                placeholder="Add any remarks..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={(!selectedItem && !isNewItem)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isRenewal ? 'Start Renewal Process' : 'Save New Panel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewPanelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPanelContent />
    </Suspense>
  );
}
