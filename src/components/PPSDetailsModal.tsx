'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PreProductionSample } from '@/types';
import QIRDataModal from './QIRDataModal';
import { ImagePreviewModal } from './ImagePreviewModal';
import PPSSubmissionModal from './PPSSubmissionModal';
import PPSPrintModal from './PPSPrintModal';

export default function PPSDetailsModal({ pps, onClose }: { pps: PreProductionSample, onClose: () => void }) {
  const updatePPSStatus = useStore(state => state.updatePPSStatus);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedQIRIndex, setSelectedQIRIndex] = useState<number | null>(null);
  const [editingSubmissionIndex, setEditingSubmissionIndex] = useState<number | null>(null);
  const [printingSubmissionIndex, setPrintingSubmissionIndex] = useState<number | null>(null);

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
                <div className="p-4 flex gap-3 flex-wrap">
                  <button
                    onClick={() => setEditingSubmissionIndex(idx)}
                    className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 font-medium transition-colors text-sm"
                  >
                    View / Edit Submission
                  </button>
                  
                  {sub.qir_data && (
                    <button
                      onClick={() => setPrintingSubmissionIndex(idx)}
                      className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Print / Download QIR
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 border-t pt-4">
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

      {selectedQIRIndex !== null && (
        <QIRDataModal 
          pps={pps} 
          submissionIndex={selectedQIRIndex}
          onClose={() => setSelectedQIRIndex(null)} 
        />
      )}

      {editingSubmissionIndex !== null && (
        <PPSSubmissionModal 
          pps={pps}
          submissionIndex={editingSubmissionIndex}
          onClose={() => setEditingSubmissionIndex(null)}
        />
      )}

      {printingSubmissionIndex !== null && (
        <PPSPrintModal
          pps={pps}
          submissionIndex={printingSubmissionIndex}
          onClose={() => setPrintingSubmissionIndex(null)}
        />
      )}
    </>
  );
}
