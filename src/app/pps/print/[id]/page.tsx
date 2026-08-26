'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { PreProductionSample } from '@/types';

export default function PPSPrintPage() {
  const params = useParams();
  const id = params?.id as string;
  const ppsRecords = useStore(state => state.ppsRecords);
  const fetchData = useStore(state => state.fetchData);
  const [pps, setPps] = useState<PreProductionSample | null>(null);

  useEffect(() => {
    if (ppsRecords.length === 0) {
      fetchData();
    }
  }, [fetchData, ppsRecords.length]);

  useEffect(() => {
    if (id && ppsRecords.length > 0) {
      const found = ppsRecords.find(p => p.pps_id === id);
      setPps(found || null);
    }
  }, [id, ppsRecords]);

  if (!pps) {
    return <div className="p-10 text-center font-bold text-xl">Loading document...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white p-4 print:p-0">
      
      {/* Non-printable Controls */}
      <div className="max-w-4xl mx-auto mb-4 print:hidden flex justify-between items-center bg-white p-4 rounded shadow">
        <p className="text-sm text-gray-600">Please make sure background graphics are enabled in print settings.</p>
        <button 
          onClick={() => window.print()} 
          className="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 shadow flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Save PDF
        </button>
      </div>

      {/* A4 Document Container */}
      <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 print:w-full print:max-w-none text-black">
        
        {/* Document Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <div className="flex justify-between items-end mb-2">
            <h1 className="text-3xl font-black uppercase tracking-wider text-gray-900">PPS Report</h1>
            <span className="text-sm font-bold text-gray-500">Document ID: {pps.pps_id}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold mb-1">Project Name</p>
              <p className="text-lg font-bold">{pps.project_name}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold mb-1">Item Code</p>
              <p className="text-lg font-bold">{pps.item_code}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold mb-1">Status</p>
              <p className="font-semibold">{pps.status}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold mb-1">PIC / Start Date</p>
              <p className="font-semibold">{pps.handled_by} &mdash; {pps.start_date}</p>
            </div>
          </div>
        </div>

        {/* Submissions Iteration */}
        {pps.submissions.length === 0 ? (
          <p className="text-center text-gray-500 italic mt-10">No submissions have been made yet.</p>
        ) : (
          <div className="space-y-12 print:space-y-8">
            {pps.submissions.map((sub, idx) => (
              <div key={idx} className="print-section" style={{ pageBreakInside: 'avoid' }}>
                {/* Header Sub */}
                <div className="bg-gray-100 border-l-4 border-gray-900 p-3 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Submission #{sub.submission_number}</h2>
                    <p className="text-xs font-bold text-gray-600 mt-1">{sub.submission_date} &bull; Reviewer: {sub.reviewer_name || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
                    <p className="font-black text-gray-900">{sub.status.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 uppercase mb-1">Overview</p>
                  <p className="text-sm leading-relaxed text-gray-800">{sub.overview}</p>
                </div>

                {/* 4 Photos Grid */}
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-700 uppercase mb-2">Product Photos</p>
                  <div className="grid grid-cols-4 gap-2">
                    {sub.photo_front && (
                      <div className="text-center">
                        <img src={sub.photo_front} alt="Front" className="w-full h-32 object-cover border border-gray-300 rounded" />
                        <span className="text-[10px] font-bold mt-1 block">TAMPAK DEPAN</span>
                      </div>
                    )}
                    {sub.photo_top && (
                      <div className="text-center">
                        <img src={sub.photo_top} alt="Top" className="w-full h-32 object-cover border border-gray-300 rounded" />
                        <span className="text-[10px] font-bold mt-1 block">TAMPAK ATAS</span>
                      </div>
                    )}
                    {sub.photo_bottom && (
                      <div className="text-center">
                        <img src={sub.photo_bottom} alt="Bottom" className="w-full h-32 object-cover border border-gray-300 rounded" />
                        <span className="text-[10px] font-bold mt-1 block">TAMPAK BAWAH</span>
                      </div>
                    )}
                    {sub.photo_side && (
                      <div className="text-center">
                        <img src={sub.photo_side} alt="Side" className="w-full h-32 object-cover border border-gray-300 rounded" />
                        <span className="text-[10px] font-bold mt-1 block">TAMPAK SAMPING</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Defects Table */}
                {sub.defects && sub.defects.length > 0 && (
                  <div className="mt-4 border-t-2 border-dashed border-gray-200 pt-4">
                    <p className="text-sm font-bold text-gray-700 uppercase mb-3">Recorded Defects</p>
                    
                    <div className="w-full border border-gray-300 rounded overflow-hidden">
                      {sub.defects.map((defect, dIdx) => (
                        <div key={defect.defect_id} className={`flex ${dIdx !== 0 ? 'border-t border-gray-200' : ''}`}>
                          <div className="w-12 bg-gray-100 p-2 flex items-center justify-center font-bold text-gray-500 border-r border-gray-200">
                            #{dIdx + 1}
                          </div>
                          
                          <div className="p-3 w-96 border-r border-gray-200 bg-gray-50 flex-shrink-0 flex gap-4">
                            {defect.photo_far && (
                              <div className="w-1/2 flex flex-col">
                                <img src={defect.photo_far} alt="Far" className="w-full h-40 object-cover border border-gray-300 rounded-sm" />
                                <span className="text-xs text-center font-bold text-gray-600 mt-2 uppercase tracking-wide">Tampak Jauh</span>
                              </div>
                            )}
                            {defect.photo_close && (
                              <div className="w-1/2 flex flex-col">
                                <img src={defect.photo_close} alt="Close" className="w-full h-40 object-cover border border-gray-300 rounded-sm" />
                                <span className="text-xs text-center font-bold text-gray-600 mt-2 uppercase tracking-wide">Tampak Dekat</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3 flex-1 flex items-center">
                            <p className="text-sm font-medium text-gray-900">{defect.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500 print:block hidden">
          Document generated via CPMS App &bull; {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
