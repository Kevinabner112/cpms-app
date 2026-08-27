'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PreProductionSample, PPSSubmission, PPSDefect, QIRData, QIRChecklist } from '@/types';
import { compressImage } from '@/utils/imageCompressor';

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

export default function PPSSubmissionModal({ pps, submissionIndex, onClose }: { pps: PreProductionSample, submissionIndex?: number, onClose: () => void }) {
  const addPPSSubmissionCheck = useStore(state => state.addPPSSubmissionCheck);
  const updatePPSSubmission = useStore(state => state.updatePPSSubmission);
  
  const initialSub = submissionIndex !== undefined ? pps.submissions[submissionIndex] : null;

  const [submissionDate, setSubmissionDate] = useState(initialSub?.submission_date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'PENDING_REVIEW' | 'REVISED' | 'PASSED'>(initialSub?.status || 'PENDING_REVIEW');
  
  const [ppsCardRemarks, setPpsCardRemarks] = useState(initialSub?.pps_card_remarks || '');
  const [overviewRemarks, setOverviewRemarks] = useState(initialSub?.overview_remarks || '');
  const [ppsCardPhoto, setPpsCardPhoto] = useState(initialSub?.pps_card_photo || '');
  
  // 4 Mandatory Photo states
  const [photoFront, setPhotoFront] = useState(initialSub?.photo_front || '');
  const [photoTop, setPhotoTop] = useState(initialSub?.photo_top || '');
  const [photoBottom, setPhotoBottom] = useState(initialSub?.photo_bottom || '');
  const [photoSide, setPhotoSide] = useState(initialSub?.photo_side || '');
  
  const [defects, setDefects] = useState<PPSDefect[]>(initialSub?.defects || []);
  
  const currentQir = initialSub?.qir_data || (pps.submissions.length > 0 
    ? pps.submissions[pps.submissions.length - 1].qir_data 
    : pps.qir_data);

  const [qirFormData, setQirFormData] = useState<Partial<QIRData>>({
    product_name: currentQir?.product_name || pps.project_name || '',
    item_number_custom: currentQir?.item_number_custom || pps.item_code || '',
    item_size: currentQir?.item_size || '',
    color: currentQir?.color || '',
    material: currentQir?.material || '',
    qty: currentQir?.qty || '1',
    item_photo: currentQir?.item_photo || '',
    client_name: currentQir?.client_name || '',
    supplier_name: currentQir?.supplier_name || 'PT Far East Seating',
    inspection_date: currentQir?.inspection_date || new Date().toISOString().split('T')[0],
    starting_at: currentQir?.starting_at || '09:00',
    finish_at: currentQir?.finish_at || '17:00',
    inspection_location: currentQir?.inspection_location || 'Factory',
    inspector: currentQir?.inspector || pps.handled_by || '',
    made_in: currentQir?.made_in || 'Indonesia',
    checklist: currentQir?.checklist || defaultChecklist
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQirChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQirFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChecklistChange = (
    key: keyof QIRChecklist, 
    field: string, 
    value: string | boolean
  ) => {
    setQirFormData(prev => ({
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

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 0.3, 800);
        setter(compressed);
      } catch (err) {
        console.error("Image compression failed", err);
        alert("Failed to compress image.");
      }
    }
  };

  const handleDefectImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    defectId: string,
    field: 'photo_far' | 'photo_close'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 0.3, 800);
        updateDefect(defectId, field, compressed);
      } catch (err) {
        console.error("Defect image compression failed", err);
        alert("Failed to compress defect image.");
      }
    }
  };

  const addDefect = () => {
    setDefects([
      ...defects, 
      { 
        defect_id: `def-${Date.now()}-${Math.floor(Math.random()*1000)}`, 
        description: '', 
        photo_far: '',
        photo_close: ''
      }
    ]);
  };

  const removeDefect = (id: string) => {
    setDefects(defects.filter(d => d.defect_id !== id));
  };

  const updateDefect = (id: string, field: 'description' | 'photo_far' | 'photo_close', value: string) => {
    setDefects(defects.map(d => d.defect_id === id ? { ...d, [field]: value } : d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFront || !photoTop || !photoBottom || !photoSide) {
      alert("Please upload all 4 mandatory product photos (Front, Top, Bottom, Side).");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newSubmission: PPSSubmission = {
        submission_number: initialSub ? initialSub.submission_number : (pps.submissions.length + 1),
        submission_date: submissionDate,
        status,
        pps_card_remarks: ppsCardRemarks,
        overview_remarks: overviewRemarks,
        pps_card_photo: ppsCardPhoto || undefined,
        photo_front: photoFront,
        photo_top: photoTop,
        photo_bottom: photoBottom,
        photo_side: photoSide,
        defects: defects.filter(d => d.description.trim() !== ''), // only save defects with actual description
        qir_data: qirFormData as QIRData
      };
      
      if (submissionIndex !== undefined) {
        await updatePPSSubmission(pps.pps_id, submissionIndex, newSubmission);
      } else {
        await addPPSSubmissionCheck(pps.pps_id, newSubmission);
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-start md:items-center mb-4 border-b pb-4 gap-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            {submissionIndex !== undefined ? `Edit PPS Submission #${initialSub?.submission_number}` : `Add PPS Submission #${pps.submissions.length + 1}`}
          </h2>
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
              <label className="block text-sm font-medium text-gray-700">Submission Date</label>
              <input 
                type="date" 
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={submissionDate}
                onChange={e => setSubmissionDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
              >
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="REVISED">Revised (Needs changes)</option>
                <option value="PASSED">Passed</option>
              </select>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">QIR Data Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input type="text" name="product_name" value={qirFormData.product_name} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Item Number</label>
                <input type="text" name="item_number_custom" value={qirFormData.item_number_custom} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Item Size</label>
                <input type="text" name="item_size" value={qirFormData.item_size} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <input type="text" name="color" value={qirFormData.color} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Material</label>
                <input type="text" name="material" value={qirFormData.material} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Qty</label>
                <input type="text" name="qty" value={qirFormData.qty} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Name</label>
                <input type="text" name="client_name" value={qirFormData.client_name} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                <input type="text" name="supplier_name" value={qirFormData.supplier_name} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inspection Date</label>
                <input type="date" name="inspection_date" value={qirFormData.inspection_date} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input type="time" name="starting_at" value={qirFormData.starting_at} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Finish Time</label>
                  <input type="time" name="finish_at" value={qirFormData.finish_at} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inspection Location</label>
                <input type="text" name="inspection_location" value={qirFormData.inspection_location} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inspector Name</label>
                <input type="text" name="inspector" value={qirFormData.inspector} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Made in</label>
                <input type="text" name="made_in" value={qirFormData.made_in} onChange={handleQirChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Photo (PPS Card Header)</label>
                {qirFormData.item_photo ? (
                  <div className="relative inline-block">
                    <img src={qirFormData.item_photo} alt="Item" className="h-32 w-auto object-contain border border-gray-300 rounded" />
                    <button type="button" onClick={() => setQirFormData(p => ({ ...p, item_photo: '' }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <span>Upload Item Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const comp = await compressImage(file, 0.3, 800);
                          setQirFormData(p => ({ ...p, item_photo: comp }));
                        } catch (err) {}
                      }
                    }} />
                  </label>
                )}
              </div>
            </div>
            
            <div className="mt-6 border-t pt-4">
              <h4 className="text-md font-bold text-gray-900 mb-2">Checklist Items</h4>
              <p className="text-xs text-gray-500 mb-4">Leave Confirm as empty to not show checkmarks in the PDF.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse mb-4 mt-2">
                  <thead>
                    <tr className="bg-gray-100 text-xs text-center">
                      <th className="px-2 py-1 font-bold border w-32" rowSpan={2}></th>
                      <th className="px-2 py-1 font-bold border w-20" rowSpan={2}>Confirm (YES/NO)</th>
                      <th className="px-2 py-1 font-bold border w-32" rowSpan={2}>Remark</th>
                      <th className="px-2 py-1 font-bold border" colSpan={4}>DEFECT ( poins founding )</th>
                    </tr>
                    <tr className="bg-gray-100 text-xs text-center">
                      <th className="px-2 py-1 font-bold border w-48">Description</th>
                      <th className="px-2 py-1 font-bold border w-12">Crit.</th>
                      <th className="px-2 py-1 font-bold border w-12">Maj.</th>
                      <th className="px-2 py-1 font-bold border w-12">Min.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-200">
                      <td colSpan={7} className="px-2 py-1 font-bold text-xs uppercase">Material</td>
                    </tr>
                    {[
                      { key: 'mahogany_wood', label: 'Wood' },
                      { key: 'dacron', label: 'Dacron' },
                      { key: 'busa', label: 'Busa' },
                      { key: 'fabric', label: 'Fabric' },
                    ].map(({ key, label }) => {
                      const cData = (qirFormData.checklist?.[key as keyof QIRChecklist] || defaultChecklist[key as keyof QIRChecklist]) as any;
                      return (
                        <tr key={key} className="border-b">
                          <td className="px-2 py-1 border font-medium">{label}</td>
                          <td className="px-2 py-1 border">
                            <select 
                              value={cData.confirm as string}
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
                            <input type="text" value={cData.description as string} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'description', e.target.value)} className="w-full border p-1 rounded text-xs" />
                          </td>
                          <td className="px-2 py-1 border text-center">
                            <input type="checkbox" checked={cData.critical as boolean} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'critical', e.target.checked)} />
                          </td>
                          <td className="px-2 py-1 border text-center">
                            <input type="checkbox" checked={cData.major as boolean} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'major', e.target.checked)} />
                          </td>
                          <td className="px-2 py-1 border text-center">
                            <input type="checkbox" checked={cData.minor as boolean} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'minor', e.target.checked)} />
                          </td>
                        </tr>
                      );
                    })}
                    
                    <tr className="bg-gray-200">
                      <td colSpan={7} className="px-2 py-1 font-bold text-xs uppercase">Hardwares</td>
                    </tr>
                    {[
                      { key: 'sleeper', label: 'Sleeper' },
                      { key: 'metal_strecher', label: 'Metal Strecher' },
                    ].map(({ key, label }) => {
                      const cData = (qirFormData.checklist?.[key as keyof QIRChecklist] || defaultChecklist[key as keyof QIRChecklist]) as any;
                      return (
                        <tr key={key} className="border-b">
                          <td className="px-2 py-1 border font-medium">{label}</td>
                          <td className="px-2 py-1 border">
                            <select 
                              value={cData.confirm as string}
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
                            <input type="text" value={cData.description as string} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'description', e.target.value)} className="w-full border p-1 rounded text-xs" />
                          </td>
                          <td className="px-2 py-1 border text-center">
                            <input type="checkbox" checked={cData.critical as boolean} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'critical', e.target.checked)} />
                          </td>
                          <td className="px-2 py-1 border text-center">
                            <input type="checkbox" checked={cData.major as boolean} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'major', e.target.checked)} />
                          </td>
                          <td className="px-2 py-1 border text-center">
                            <input type="checkbox" checked={cData.minor as boolean} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'minor', e.target.checked)} />
                          </td>
                        </tr>
                      );
                    })}
                    
                    <tr className="bg-gray-200">
                      <td colSpan={7} className="px-2 py-1 font-bold text-xs uppercase">Product Knowledges</td>
                    </tr>
                    {[
                      { key: 'glider', label: 'Glider' },
                    ].map(({ key, label }) => {
                      const cData = (qirFormData.checklist?.[key as keyof QIRChecklist] || defaultChecklist[key as keyof QIRChecklist]) as any;
                      return (
                        <tr key={key} className="border-b">
                          <td className="px-2 py-1 border font-medium">{label}</td>
                          <td className="px-2 py-1 border">
                            <select 
                              value={cData.confirm as string}
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
                            <input type="text" value={cData.description as string} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'description', e.target.value)} className="w-full border p-1 rounded text-xs" />
                          </td>
                          <td className="px-2 py-1 border text-center">
                            <input type="checkbox" checked={cData.critical as boolean} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'critical', e.target.checked)} />
                          </td>
                          <td className="px-2 py-1 border text-center">
                            <input type="checkbox" checked={cData.major as boolean} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'major', e.target.checked)} />
                          </td>
                          <td className="px-2 py-1 border text-center">
                            <input type="checkbox" checked={cData.minor as boolean} onChange={(e) => handleChecklistChange(key as keyof QIRChecklist, 'minor', e.target.checked)} />
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
                  value={qirFormData.checklist?.product_knowledge_remarks} 
                  onChange={(e) => setQirFormData(prev => ({
                    ...prev,
                    checklist: { ...prev.checklist!, product_knowledge_remarks: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border h-16" 
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-md font-semibold text-gray-800 uppercase">Pictures</h3>
              <span className="bg-red-100 text-red-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Required</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Please upload PPS Card and photos from 4 specific angles.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {/* PPS Card Photo */}
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">PPS Card</label>
                {ppsCardPhoto ? (
                  <div className="relative group">
                    <img src={ppsCardPhoto} alt="PPS Card" className="h-32 w-full object-cover rounded border border-gray-300" />
                    <button type="button" onClick={() => setPpsCardPhoto('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer p-4 h-32">
                    <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="mt-2 block text-xs font-medium text-gray-900 text-center">Add Photo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const comp = await compressImage(file, 0.5, 800);
                          setPpsCardPhoto(comp);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }} />
                  </label>
                )}
                <textarea 
                  rows={2}
                  placeholder="PPS Card Remarks..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                  value={ppsCardRemarks}
                  onChange={e => setPpsCardRemarks(e.target.value)}
                />
              </div>
              {/* Front Photo */}
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">Tampak Depan</label>
                {photoFront ? (
                  <div className="relative group">
                    <img src={photoFront} alt="Front" className="h-32 w-full object-cover rounded border border-gray-300" />
                    <button type="button" onClick={() => setPhotoFront('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50">
                    <span className="text-xs text-gray-500 text-center px-2">Tap to Capture/Upload</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleImageUpload(e, setPhotoFront)} />
                  </label>
                )}
              </div>

              {/* Top Photo */}
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">Tampak Atas</label>
                {photoTop ? (
                  <div className="relative group">
                    <img src={photoTop} alt="Top" className="h-32 w-full object-cover rounded border border-gray-300" />
                    <button type="button" onClick={() => setPhotoTop('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50">
                    <span className="text-xs text-gray-500 text-center px-2">Tap to Capture/Upload</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleImageUpload(e, setPhotoTop)} />
                  </label>
                )}
              </div>

              {/* Bottom Photo */}
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">Tampak Bawah</label>
                {photoBottom ? (
                  <div className="relative group">
                    <img src={photoBottom} alt="Bottom" className="h-32 w-full object-cover rounded border border-gray-300" />
                    <button type="button" onClick={() => setPhotoBottom('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50">
                    <span className="text-xs text-gray-500 text-center px-2">Tap to Capture/Upload</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleImageUpload(e, setPhotoBottom)} />
                  </label>
                )}
              </div>

              {/* Side Photo */}
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">Tampak Samping</label>
                {photoSide ? (
                  <div className="relative group">
                    <img src={photoSide} alt="Side" className="h-32 w-full object-cover rounded border border-gray-300" />
                    <button type="button" onClick={() => setPhotoSide('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50">
                    <span className="text-xs text-gray-500 text-center px-2">Tap to Capture/Upload</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleImageUpload(e, setPhotoSide)} />
                  </label>
                )}
              </div>
            </div>
            
            <div className="mt-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">Overview Remarks (For 4 Angle Photos)</label>
              <textarea 
                rows={2}
                placeholder="Enter remarks for the overview pictures..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={overviewRemarks}
                onChange={e => setOverviewRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t pt-4 border-gray-100 bg-gray-50 -mx-4 md:-mx-6 px-4 md:px-6 pb-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-3 gap-3">
              <div>
                <h3 className="text-md font-semibold text-gray-800">Defects</h3>
                <p className="text-xs text-gray-500">Add any specific issues found. You can upload photos for each defect.</p>
              </div>
              <button
                type="button"
                onClick={addDefect}
                className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50 font-medium"
              >
                + Add Defect
              </button>
            </div>
            
            {defects.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-2">No defects added.</p>
            ) : (
              <div className="space-y-3">
                {defects.map((defect, idx) => (
                  <div key={defect.defect_id} className="bg-white border border-gray-200 p-3 rounded flex flex-col md:flex-row gap-4 md:items-start relative">
                    
                    {/* Defect Photo Uploads */}
                    <div className="flex gap-2 flex-shrink-0">
                      {/* Photo Far */}
                      <div className="w-20">
                        {defect.photo_far ? (
                          <div className="relative group">
                            <img src={defect.photo_far} alt="Far" className="h-20 w-20 object-cover rounded border border-gray-300" />
                            <button type="button" onClick={() => updateDefect(defect.defect_id, 'photo_far', '')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <span className="absolute bottom-0 w-full text-center bg-black/50 text-white text-[8px] uppercase font-bold py-0.5 rounded-b">Tampak Jauh</span>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50 bg-white">
                            <span className="text-[9px] text-gray-500 text-center px-1 font-bold">Tampak Jauh</span>
                            <span className="text-[8px] text-gray-400 mt-1">Tap to Upload</span>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleDefectImageUpload(e, defect.defect_id, 'photo_far')} />
                          </label>
                        )}
                      </div>

                      {/* Photo Close */}
                      <div className="w-20">
                        {defect.photo_close ? (
                          <div className="relative group">
                            <img src={defect.photo_close} alt="Close" className="h-20 w-20 object-cover rounded border border-gray-300" />
                            <button type="button" onClick={() => updateDefect(defect.defect_id, 'photo_close', '')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <span className="absolute bottom-0 w-full text-center bg-black/50 text-white text-[8px] uppercase font-bold py-0.5 rounded-b">Tampak Dekat</span>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50 bg-white">
                            <span className="text-[9px] text-gray-500 text-center px-1 font-bold">Tampak Dekat</span>
                            <span className="text-[8px] text-gray-400 mt-1">Tap to Upload</span>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleDefectImageUpload(e, defect.defect_id, 'photo_close')} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Description #{idx + 1}</label>
                        <textarea 
                          required
                          rows={2}
                          placeholder="e.g. Color mismatch on the edge"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={defect.description}
                          onChange={e => updateDefect(defect.defect_id, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                      <button
                        type="button"
                        onClick={() => removeDefect(defect.defect_id)}
                        className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded absolute top-2 right-2 md:relative md:top-auto md:right-auto"
                        title="Remove defect"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-6 border-t pt-4 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Submission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
