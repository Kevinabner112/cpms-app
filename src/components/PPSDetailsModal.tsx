'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PreProductionSample } from '@/types';
import QIRDataModal from './QIRDataModal';
import { ImagePreviewModal } from './ImagePreviewModal';

export default function PPSDetailsModal({ pps, onClose }: { pps: PreProductionSample, onClose: () => void }) {
  const updatePPSStatus = useStore(state => state.updatePPSStatus);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showQIRModal, setShowQIRModal] = useState(false);

  const handleCloseProject = async () => {
    if (confirm('Are you sure you want to mark this PPS Project as CLOSED? This means mass production is finished.')) {
      await updatePPSStatus(pps.pps_id, 'CLOSED');
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-2 md:p-4">
        <div className="bg-white rounded-lg p-4 md:p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">{pps.project_name}</h2>
            <p className="text-sm text-gray-500">{pps.pps_id} | {pps.item_code}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
          <div>
            <span className="block text-gray-500 mb-1">Status</span>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${pps.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                pps.status === 'REVISING' ? 'bg-blue-100 text-blue-800' : 
                pps.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {pps.status}
            </span>
          </div>
          <div>
            <span className="block text-gray-500 mb-1">PIC</span>
            <span className="font-medium text-gray-900">{pps.handled_by}</span>
          </div>
          <div>
            <span className="block text-gray-500 mb-1">Start Date</span>
            <span className="font-medium text-gray-900">{pps.start_date}</span>
          </div>
          <div>
            <span className="block text-gray-500 mb-1">Approval Date</span>
            <span className="font-medium text-gray-900">{pps.approval_date || '-'}</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Submission History</h3>
        
        <div className="space-y-6">
          {pps.submissions.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No submissions recorded yet.</p>
          ) : (
            pps.submissions.map((sub, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                
                {/* Header Section */}
                <div className="bg-gray-50 px-3 md:px-4 py-3 flex flex-col md:flex-row justify-between md:items-center gap-2 border-b border-gray-200">
                  <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
                    <span className="font-bold text-gray-900 text-sm md:text-base">Submission #{sub.submission_number}</span>
                    <span className="text-xs md:text-sm text-gray-500">{sub.submission_date}</span>
                  </div>
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md uppercase tracking-wide
                    ${sub.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' : 
                      sub.status === 'REVISED' ? 'bg-red-100 text-red-800' : 
                      'bg-green-100 text-green-800'
                    }`}
                  >
                    {sub.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Info Section */}
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div><span className="text-gray-500">Reviewer:</span> <span className="font-medium">{sub.reviewer_name || '-'}</span></div>
                    <div><span className="text-gray-500">Review Date:</span> <span className="font-medium">{sub.review_date || '-'}</span></div>
                  </div>

                  <div className="mb-4">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Overview / Notes</span>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{sub.overview}</p>
                  </div>

                  {/* 4 Angle Photos */}
                  <div className="mb-4 pt-2">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Product Photos</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {sub.photo_front && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Tampak Depan</span>
                          <img 
                            src={sub.photo_front} 
                            alt="Front" 
                            className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" 
                            onClick={() => setSelectedImage(sub.photo_front)}
                          />
                        </div>
                      )}
                      {sub.photo_top && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Tampak Atas</span>
                          <img 
                            src={sub.photo_top} 
                            alt="Top" 
                            className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" 
                            onClick={() => setSelectedImage(sub.photo_top)}
                          />
                        </div>
                      )}
                      {sub.photo_bottom && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Tampak Bawah</span>
                          <img 
                            src={sub.photo_bottom} 
                            alt="Bottom" 
                            className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(sub.photo_bottom)}
                          />
                        </div>
                      )}
                      {sub.photo_side && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Tampak Samping</span>
                          <img 
                            src={sub.photo_side} 
                            alt="Side" 
                            className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(sub.photo_side)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Defects Section */}
                  {sub.defects && sub.defects.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recorded Defects ({sub.defects.length})</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sub.defects.map((defect, dIdx) => (
                          <div key={defect.defect_id} className="bg-red-50 border border-red-100 rounded p-3 flex flex-col xl:flex-row gap-3">
                            <div className="p-3 w-full xl:w-96 border-b xl:border-b-0 xl:border-r border-gray-200 bg-gray-50 flex-shrink-0 flex gap-4">
                            {defect.photo_far && (
                              <div className="w-1/2 flex flex-col">
                                <img 
                                  src={defect.photo_far} 
                                  alt="Far" 
                                  className="w-full h-40 object-cover border border-gray-300 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setSelectedImage(defect.photo_far || null)}
                                />
                                <span className="text-xs text-center font-bold text-gray-500 mt-2 uppercase tracking-wide">Tampak Jauh</span>
                              </div>
                            )}
                            {defect.photo_close && (
                              <div className="w-1/2 flex flex-col">
                                <img 
                                  src={defect.photo_close} 
                                  alt="Close" 
                                  className="w-full h-40 object-cover border border-gray-300 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setSelectedImage(defect.photo_close || null)}
                                />
                                <span className="text-xs text-center font-bold text-gray-500 mt-2 uppercase tracking-wide">Tampak Dekat</span>
                              </div>
                            )}
                          </div>
                            <div>
                              <span className="text-xs font-bold text-red-800 block mb-1">Defect #{dIdx + 1}</span>
                              <p className="text-sm text-red-900 leading-snug">{defect.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 border-t pt-4">
          <a
            href={`/pps/print/${pps.pps_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export to PDF
          </a>
          
          <button
            onClick={() => setShowQIRModal(true)}
            className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 font-medium transition-colors"
          >
            Edit QIR Data
          </button>
          
          {pps.status !== 'CLOSED' && pps.status === 'APPROVED' && (
            <button
              onClick={handleCloseProject}
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black font-medium transition-colors"
            >
              Mark CLOSED
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>

      <ImagePreviewModal 
        isOpen={selectedImage !== null} 
        onClose={() => setSelectedImage(null)} 
        imageUrl={selectedImage} 
        title="PPS Defect Photo" 
      />

      {showQIRModal && (
        <QIRDataModal pps={pps} onClose={() => setShowQIRModal(false)} />
      )}
    </>
  );
}
