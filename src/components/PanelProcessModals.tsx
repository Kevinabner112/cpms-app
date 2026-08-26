import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PanelCreationProcess, PanelCreationCheck } from '@/types';
import { X, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import imageCompression from 'browser-image-compression';

export function NewProcessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, startPanelProcess } = useStore();
  const [itemCode, setItemCode] = useState('');
  const [handledBy, setHandledBy] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  if (!isOpen) return null;

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setItemCode(code);
    const selectedItem = items.find(i => i.item_code === code);
    if (selectedItem && selectedItem.handled_by) {
      setHandledBy(selectedItem.handled_by);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode || !handledBy) return alert('Please fill required fields');
    await startPanelProcess(itemCode, handledBy, startDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">New Development Process</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Item Selection</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
              value={itemCode}
              onChange={handleItemChange}
              required
            >
              <option value="">-- Select Master Item --</option>
              {items.map(i => (
                <option key={i.item_code} value={i.item_code}>{i.item_code} - {i.item_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Handled By</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded-lg px-4 py-2" 
              value={handledBy}
              onChange={e => setHandledBy(e.target.value)}
              placeholder="e.g. Akzo, Propan, Technician Name"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
            <input 
              type="date" 
              className="w-full border border-slate-300 rounded-lg px-4 py-2" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required 
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
              Start Process
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UpdateProcessModal({ isOpen, onClose, process }: { isOpen: boolean; onClose: () => void; process: PanelCreationProcess | null }) {
  const { addProcessCheck, finalizeProcess } = useStore();
  const [tab, setTab] = useState<'check' | 'finalize'>('check');

  // Check form
  const [checkDate, setCheckDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checkNotes, setCheckNotes] = useState('');
  const [checkStatus, setCheckStatus] = useState<'PENDING' | 'REVISED' | 'PASSED'>('REVISED');

  // Finalize form
  const [approvalDate, setApprovalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [finalStatus, setFinalStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [inspectorName, setInspectorName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen || !process) return null;

  const handleAddCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const checkNum = process.checks.length + 1;
    await addProcessCheck(process.process_id, {
      check_number: checkNum,
      date: checkDate,
      notes: checkNotes,
      status: checkStatus
    });
    onClose();
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return alert('Please upload a photo result');

    setUploading(true);
    try {
      console.log('Starting image compression...');
      const options = {
        maxSizeMB: 0.5, // Ukuran maksimal cukup kecil
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.3 // 30% quality = kompres hingga 70%
      };
      
      const compressedFile = await imageCompression(photoFile, options);
      console.log(`Image compressed from ${photoFile.size} to ${compressedFile.size} bytes`);

      // Upload to Next.js API Route (Cloudflare R2 or Local)
      console.log('Starting upload...');
      const formData = new FormData();
      formData.append('file', compressedFile, `photo.jpg`);
      formData.append('processId', process.process_id);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload to R2');
      }

      console.log('Upload successful, URL:', data.url);

      await finalizeProcess(process.process_id, approvalDate, data.url, finalStatus, inspectorName);
      onClose();
    } catch (err: any) {
      console.error('Upload Error:', err);
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Update Process {process.process_id}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {process.status === 'IN_PROGRESS' && (
          <div className="flex border-b border-slate-200">
            <button 
              className={`flex-1 py-3 text-sm font-semibold ${tab === 'check' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
              onClick={() => setTab('check')}
            >
              Add Check
            </button>
            <button 
              className={`flex-1 py-3 text-sm font-semibold ${tab === 'finalize' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}
              onClick={() => setTab('finalize')}
            >
              Finalize Result
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          {process.checks.length > 0 && (
            <div className={`space-y-3 ${process.status === 'IN_PROGRESS' ? 'border-b border-slate-200 mb-6 pb-4' : ''}`}>
              <h3 className="text-sm font-bold text-slate-700">Check History</h3>
              {process.checks.map(c => (
                <div key={c.check_number} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-700">Check #{c.check_number}</span>
                    <span className={c.status === 'PASSED' ? 'text-emerald-600' : c.status === 'REVISED' ? 'text-rose-600' : 'text-amber-600'}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs mb-2">{format(parseISO(c.date), 'dd MMM yyyy')}</div>
                  <p className="text-slate-700">{c.notes || '-'}</p>
                </div>
              ))}
            </div>
          )}

          {process.status === 'IN_PROGRESS' && (
            tab === 'check' ? (
            <form onSubmit={handleAddCheck} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                Adding Check #{process.checks.length + 1}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Check Date</label>
                <input type="date" className="w-full border border-slate-300 rounded-lg px-4 py-2" value={checkDate} onChange={e => setCheckDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select className="w-full border border-slate-300 rounded-lg px-4 py-2" value={checkStatus} onChange={e => setCheckStatus(e.target.value as any)}>
                  <option value="REVISED">Revised (Needs changes)</option>
                  <option value="PASSED">Passed (Good)</option>
                  <option value="PENDING">Pending (Waiting)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes / Revision details</label>
                <textarea className="w-full border border-slate-300 rounded-lg px-4 py-2" rows={3} value={checkNotes} onChange={e => setCheckNotes(e.target.value)}></textarea>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Save Check</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFinalize} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Approval Date</label>
                <input type="date" className="w-full border border-slate-300 rounded-lg px-4 py-2" value={approvalDate} onChange={e => setApprovalDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Final Status</label>
                <select className="w-full border border-slate-300 rounded-lg px-4 py-2" value={finalStatus} onChange={e => setFinalStatus(e.target.value as any)}>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              {finalStatus === 'APPROVED' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">QA Inspector Name</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg px-4 py-2" 
                    value={inspectorName} 
                    onChange={e => setInspectorName(e.target.value)} 
                    placeholder="Name of inspector approving this panel"
                    required 
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Result Photo</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input 
                    type="file" 
                    id="photo" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                    required
                  />
                  <label htmlFor="photo" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-blue-600">Click to upload photo</span>
                    <span className="text-xs text-slate-500 mt-1">{photoFile ? photoFile.name : 'Max size automatically compressed'}</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-2">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><CheckCircle className="w-4 h-4" /> Finalize</>}
                </button>
              </div>
            </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
