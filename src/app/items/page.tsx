'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Database, PlusCircle, Search, Trash2, X } from 'lucide-react';
import { Item } from '@/types';

export default function MasterItemsPage() {
  const { items, fetchData, addItem, deleteItem } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newItemData, setNewItemData] = useState({
    item_code: '',
    item_name: '',
    main_wood: '',
    handled_by: 'Akzo'
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const search = searchTerm.toLowerCase();
      return (
        item.item_code.toLowerCase().includes(search) || 
        item.item_name.toLowerCase().includes(search) ||
        (item.main_wood && item.main_wood.toLowerCase().includes(search))
      );
    });
  }, [items, searchTerm]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addItem(newItemData);
      setIsModalOpen(false);
      setNewItemData({
        item_code: '',
        item_name: '',
        main_wood: '',
        handled_by: 'Akzo'
      });
      // Refresh items
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to add item. Item Code might already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemCode: string) => {
    if (confirm(`Are you sure you want to delete ${itemCode}? This might fail if the item is linked to existing records (PPS, Panels, etc.)`)) {
      try {
        await deleteItem(itemCode);
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete item. It might be used in other records.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-purple-600" />
            Master Items
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage global item catalog across all modules</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-medium w-full md:w-auto text-center flex justify-center items-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Add New Item
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by Code, Name, or Wood..."
              className="pl-10 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Main Wood</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Handled By</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.item_code} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                      {item.item_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {item.main_wood || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {item.handled_by ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.handled_by === 'Akzo' ? 'bg-blue-100 text-blue-800' : item.handled_by === 'Propan' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                          {item.handled_by}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDeleteItem(item.item_code)}
                        className="text-rose-600 hover:text-rose-900 bg-rose-50 p-1.5 rounded-md hover:bg-rose-100 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {filteredItems.length} items</span>
        </div>
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Add New Item</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-item-form" onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Code <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="e.g. FEC-999"
                    value={newItemData.item_code}
                    onChange={(e) => setNewItemData({...newItemData, item_code: e.target.value})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Must be unique (e.g. CH-293)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="e.g. Modern White Chair"
                    value={newItemData.item_name}
                    onChange={(e) => setNewItemData({...newItemData, item_name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Main Wood</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="e.g. Oak / Mahogany"
                    value={newItemData.main_wood}
                    onChange={(e) => setNewItemData({...newItemData, main_wood: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Handled By</label>
                  <select 
                    className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                    value={newItemData.handled_by}
                    onChange={(e) => setNewItemData({...newItemData, handled_by: e.target.value})}
                  >
                    <option value="Akzo">Akzo</option>
                    <option value="Propan">Propan</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-item-form"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
