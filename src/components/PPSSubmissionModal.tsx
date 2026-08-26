'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PreProductionSample, PPSSubmission, PPSDefect } from '@/types';
import { compressImage } from '@/utils/imageCompressor';

export default function PPSSubmissionModal({ pps, onClose }: { pps: PreProductionSample, onClose: () => void }) {
  const addPPSSubmissionCheck = useStore(state => state.addPPSSubmissionCheck);
  
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [status, setStatus] = useState<'PENDING_REVIEW' | 'REVISED' | 'PASSED'>('PENDING_REVIEW');
  
  const [overview, setOverview] = useState('');
  
  // 4 Mandatory Photo states
  const [photoFront, setPhotoFront] = useState('');
  const [photoTop, setPhotoTop] = useState('');
  const [photoBottom, setPhotoBottom] = useState('');
  const [photoSide, setPhotoSide] = useState('');
  
  const [defects, setDefects] = useState<PPSDefect[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        submission_number: pps.submissions.length + 1,
        submission_date: submissionDate,
        reviewer_name: reviewerName || undefined,
        review_date: reviewDate || undefined,
        status,
        overview,
        photo_front: photoFront,
        photo_top: photoTop,
        photo_bottom: photoBottom,
        photo_side: photoSide,
        defects: defects.filter(d => d.description.trim() !== '') // only save defects with actual description
      };
      
      await addPPSSubmissionCheck(pps.pps_id, newSubmission);
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
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Add PPS Submission #{pps.submissions.length + 1}</h2>
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
                <option value="PASSED">Passed (Approved)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reviewer Name (Optional)</label>
              <input 
                type="text" 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Review Date (Optional)</label>
              <input 
                type="date" 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={reviewDate}
                onChange={e => setReviewDate(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t pt-4 border-gray-100">
            <h3 className="text-md font-semibold text-gray-800 mb-3">General Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Overview / Notes</label>
                <textarea 
                  rows={2}
                  required
                  placeholder="General notes about this submission..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={overview}
                  onChange={e => setOverview(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-md font-semibold text-gray-800">Product Photos</h3>
              <span className="bg-red-100 text-red-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Required</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Please upload or capture photos from 4 specific angles. Photos will be automatically compressed to save storage.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
