'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { PreProductionSample, QIRData, QIRChecklist } from '@/types';

const defaultChecklist: QIRChecklist = {
  mahogany_wood: { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false },
  dacron: { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false },
  busa: { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false },
  fabric: { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false },
  sleeper: { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false },
  metal_strecher: { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false },
  glider: { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false },
  product_knowledge_remarks: ''
};

export default function QIRDataModal({ pps, onClose }: { pps: PreProductionSample, onClose: () => void }) {
  const updatePPSRecord = useStore(state => state.updatePPSRecord);
  const [formData, setFormData] = useState<Partial<QIRData>>({
    product_name: pps.qir_data?.product_name || pps.project_name || '',
    item_number_custom: pps.qir_data?.item_number_custom || pps.item_code || '',
    item_size: pps.qir_data?.item_size || '',
    color: pps.qir_data?.color || '',
    material: pps.qir_data?.material || '',
    qty: pps.qir_data?.qty || '1',
    client_name: pps.qir_data?.client_name || '',
    supplier_name: pps.qir_data?.supplier_name || 'PT Far East Seating',
    inspection_date: pps.qir_data?.inspection_date || new Date().toISOString().split('T')[0],
    starting_at: pps.qir_data?.starting_at || '09:00',
    finish_at: pps.qir_data?.finish_at || '17:00',
    inspection_location: pps.qir_data?.inspection_location || 'Factory',
    inspector: pps.qir_data?.inspector || pps.handled_by || '',
    made_in: pps.qir_data?.made_in || 'Indonesia',
    checklist: pps.qir_data?.checklist || defaultChecklist
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updatePPSRecord(pps.pps_id, { qir_data: formData as QIRData });
    setSaving(false);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChecklistChange = (
    key: keyof QIRChecklist, 
    field: string, 
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...(prev.checklist || defaultChecklist),
        [key]: {
          // @ts-ignore
          ...(prev.checklist?.[key] || defaultChecklist[key]),
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-[70] p-2 md:p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit QIR Form Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input type="text" name="product_name" value={formData.product_name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Number</label>
              <input type="text" name="item_number_custom" value={formData.item_number_custom} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Size</label>
              <input type="text" name="item_size" value={formData.item_size} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <input type="text" name="color" value={formData.color} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Material</label>
              <input type="text" name="material" value={formData.material} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Qty</label>
              <input type="text" name="qty" value={formData.qty} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Name</label>
              <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
              <input type="text" name="supplier_name" value={formData.supplier_name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Inspection Date</label>
              <input type="date" name="inspection_date" value={formData.inspection_date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input type="time" name="starting_at" value={formData.starting_at} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Finish Time</label>
                <input type="time" name="finish_at" value={formData.finish_at} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Inspection Location</label>
              <input type="text" name="inspection_location" value={formData.inspection_location} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Inspector Name</label>
              <input type="text" name="inspector" value={formData.inspector} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Checklist Items</h3>
            <p className="text-xs text-gray-500 mb-4">Leave Confirm as empty to not show checkmarks in the PDF.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border">
                <thead className="bg-gray-100 uppercase text-xs">
                  <tr>
                    <th className="px-2 py-2 border">Item</th>
                    <th className="px-2 py-2 border w-24">Confirm</th>
                    <th className="px-2 py-2 border">Remarks</th>
                    <th className="px-2 py-2 border">Description</th>
                    <th className="px-2 py-2 border w-16">Crit.</th>
                    <th className="px-2 py-2 border w-16">Maj.</th>
                    <th className="px-2 py-2 border w-16">Min.</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'mahogany_wood', label: 'Mahogany Wood' },
                    { key: 'dacron', label: 'Dacron' },
                    { key: 'busa', label: 'Busa' },
                    { key: 'fabric', label: 'Fabric' },
                    { key: 'sleeper', label: 'Sleeper' },
                    { key: 'metal_strecher', label: 'Metal Strecher' },
                    { key: 'glider', label: 'Glider' },
                  ].map(({ key, label }) => {
                    // @ts-ignore
                    const cData = formData.checklist?.[key] || defaultChecklist[key];
                    return (
                      <tr key={key} className="border-b">
                        <td className="px-2 py-1 border font-medium">{label}</td>
                        <td className="px-2 py-1 border">
                          <select 
                            value={cData.confirm}
                            onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'confirm', e.target.value)}
                            className="w-full border p-1 rounded text-xs"
                          >
                            <option value="">-</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                          </select>
                        </td>
                        <td className="px-2 py-1 border">
                          <input type="text" value={cData.remarks} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'remarks', e.target.value)} className="w-full border p-1 rounded text-xs" />
                        </td>
                        <td className="px-2 py-1 border">
                          <input type="text" value={cData.description} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'description', e.target.value)} className="w-full border p-1 rounded text-xs" />
                        </td>
                        <td className="px-2 py-1 border text-center">
                          <input type="checkbox" checked={cData.critical} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'critical', e.target.checked)} />
                        </td>
                        <td className="px-2 py-1 border text-center">
                          <input type="checkbox" checked={cData.major} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'major', e.target.checked)} />
                        </td>
                        <td className="px-2 py-1 border text-center">
                          <input type="checkbox" checked={cData.minor} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'minor', e.target.checked)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Product Knowledge / QC Assessment Remarks</label>
              <textarea 
                value={formData.checklist?.product_knowledge_remarks} 
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  checklist: { ...prev.checklist!, product_knowledge_remarks: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border h-16" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center">
              {saving ? 'Saving...' : 'Save QIR Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
