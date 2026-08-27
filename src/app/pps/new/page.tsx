'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Link from 'next/link';

export default function NewPPSPage() {
  const router = useRouter();
  const startPPS = useStore(state => state.startPPS);
  const addItem = useStore(state => state.addItem);

  const [projectName, setProjectName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [handledBy, setHandledBy] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isNewItem, setIsNewItem] = useState(false);
  const [newItemData, setNewItemData] = useState({
    item_code: '',
    item_name: '',
    main_wood: '',
    handled_by: 'Akzo'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        if (!finalItemCode || finalItemCode === 'NEW_ITEM') {
          setIsSubmitting(false);
          return;
        }
      }

      await startPPS(projectName, finalItemCode, handledBy, startDate);
      router.push('/pps');
    } catch (error) {
      console.error(error);
      alert('Failed to create PPS. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pps" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New PPS</h1>
          <p className="text-sm text-gray-500 mt-1">Start a new Pre Production Sample tracking process</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Project Name</label>
              <input 
                type="text" 
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. PMW"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Code</label>
              <select 
                required
                className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={isNewItem ? 'NEW_ITEM' : itemCode}
                onChange={e => {
                  if (e.target.value === 'NEW_ITEM') {
                    setIsNewItem(true);
                    setItemCode('NEW_ITEM');
                  } else {
                    setIsNewItem(false);
                    setItemCode(e.target.value);
                  }
                }}
              >
                <option value="" disabled>Select an Item</option>
                <option value="NEW_ITEM" className="font-semibold text-indigo-600">Create New Item</option>
                {items.map(item => (
                  <option key={item.item_code} value={item.item_code}>
                    {item.item_code} - {item.item_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isNewItem && (
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200 space-y-4">
              <h3 className="text-sm font-bold text-indigo-900 pb-2">New Item Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-indigo-800 mb-1">Item Code</label>
                  <input 
                    type="text" 
                    className="w-full border border-indigo-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. FEC-999"
                    value={newItemData.item_code}
                    onChange={(e) => setNewItemData({...newItemData, item_code: e.target.value})}
                    required={isNewItem}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-800 mb-1">Item Name</label>
                  <input 
                    type="text" 
                    className="w-full border border-indigo-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Modern White Chair"
                    value={newItemData.item_name}
                    onChange={(e) => setNewItemData({...newItemData, item_name: e.target.value})}
                    required={isNewItem}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-800 mb-1">Main Wood</label>
                  <input 
                    type="text" 
                    className="w-full border border-indigo-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Oak / Mahogany"
                    value={newItemData.main_wood}
                    onChange={(e) => setNewItemData({...newItemData, main_wood: e.target.value})}
                    required={isNewItem}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-800 mb-1">Handled By</label>
                  <select 
                    className="w-full border border-indigo-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
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

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Handled By (PIC)</label>
              <input 
                type="text" 
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={handledBy}
                onChange={e => setHandledBy(e.target.value)}
                placeholder="e.g. John Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input 
                type="date" 
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link
              href="/pps"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create PPS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
