'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { PreProductionSample, QIRChecklist } from '@/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PPSPrintPage() {
  const params = useParams();
  const id = params?.id as string;
  const ppsRecords = useStore(state => state.ppsRecords);
  const fetchData = useStore(state => state.fetchData);
  const [pps, setPps] = useState<PreProductionSample | null>(null);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`QIR_${pps?.item_code || 'PPS'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  if (!pps) {
    return <div className="p-10 text-center font-bold text-xl">Loading document...</div>;
  }

  const qir = pps.qir_data;
  const checklist = qir?.checklist || {} as QIRChecklist;

  const renderChecklistRow = (category: string, itemLabel: string, key: keyof typeof checklist) => {
    const rawRow = checklist[key];
    const row = (typeof rawRow === 'object' && rawRow !== null) 
      ? rawRow 
      : { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false };

    return (
      <tr className="border-b border-gray-400 text-[10px] text-center">
        {category && <td className="border-r border-gray-400 bg-[#e6e6e6] font-bold p-1 uppercase" rowSpan={category === 'MATERIAL' ? 4 : 3}>{category}</td>}
        <td className="border-r border-gray-400 p-1 text-left font-semibold pl-2 uppercase">{itemLabel}</td>
        <td className="border-r border-gray-400 p-1 font-bold">{row.confirm === 'YES' ? '✔' : row.confirm === 'NO' ? '✘' : ''}</td>
        <td className="border-r border-gray-400 p-1 text-left">{row.remarks}</td>
        <td className="border-r border-gray-400 p-1 text-left">{row.description}</td>
        <td className="border-r border-gray-400 p-1">{row.critical ? '✔' : ''}</td>
        <td className="border-r border-gray-400 p-1">{row.major ? '✔' : ''}</td>
        <td className="p-1">{row.minor ? '✔' : ''}</td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-20">
      
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center bg-white p-4 rounded shadow">
        <p className="text-sm text-gray-600">Please make sure you have filled the QIR Data in the PPS Details Modal.</p>
        <button 
          onClick={handleDownloadPDF} 
          disabled={generating}
          className="bg-red-600 text-white px-6 py-2 rounded font-bold hover:bg-red-700 shadow flex items-center gap-2 disabled:opacity-50"
        >
          {generating ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-xl overflow-hidden relative">
        <div ref={printRef} className="bg-white text-black p-8 w-[210mm] min-h-[297mm] mx-auto box-border" style={{ fontFamily: 'Arial, sans-serif' }}>
          
          {/* Header */}
          <div className="flex items-center mb-6">
            <div className="w-1/4">
              <div className="w-24 h-24 bg-gray-200 flex items-center justify-center font-bold text-gray-400 border border-gray-400">LOGO</div>
            </div>
            <div className="w-3/4 flex flex-col items-end">
              <h1 className="bg-red-600 text-white text-3xl font-black uppercase tracking-wider py-2 px-6 w-full text-center">QUALITY INSPECTION REPORT</h1>
              <p className="text-xs text-gray-500 mt-1 font-bold">Doc No: {pps.pps_id}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="bg-[#fff2cc] border border-gray-400 font-bold text-center py-1 uppercase text-sm border-b-0">PRE PRODUCTION SAMPLE</h2>
            <div className="grid grid-cols-2 border border-gray-400 border-t-0 text-[11px]">
              
              <div className="border-r border-gray-400">
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Product Name</div><div className="w-2/3 p-1">{qir?.product_name || pps.project_name}</div></div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Item Number</div><div className="w-2/3 p-1">{pps.item_code}</div></div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Item Number Custom</div><div className="w-2/3 p-1">{qir?.item_number_custom}</div></div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Item Size</div><div className="w-2/3 p-1">{qir?.item_size}</div></div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Color</div><div className="w-2/3 p-1">{qir?.color}</div></div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Material</div><div className="w-2/3 p-1">{qir?.material}</div></div>
                <div className="flex"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Qty</div><div className="w-2/3 p-1">{qir?.qty || '1'}</div></div>
              </div>
              
              <div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Client Name</div><div className="w-2/3 p-1">{qir?.client_name}</div></div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Supplier Name</div><div className="w-2/3 p-1">{qir?.supplier_name || 'PT Far East Seating'}</div></div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Inspection Date</div><div className="w-2/3 p-1">{qir?.inspection_date}</div></div>
                <div className="flex border-b border-gray-400">
                  <div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Starting at</div><div className="w-1/6 p-1 border-r border-gray-400">{qir?.starting_at}</div>
                  <div className="w-1/4 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Finish at</div><div className="w-1/4 p-1">{qir?.finish_at}</div>
                </div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Inspection Location</div><div className="w-2/3 p-1">{qir?.inspection_location}</div></div>
                <div className="flex border-b border-gray-400"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Inspector</div><div className="w-2/3 p-1">{qir?.inspector || pps.handled_by}</div></div>
                <div className="flex"><div className="w-1/3 bg-[#e6e6e6] p-1 font-bold border-r border-gray-400">Made in</div><div className="w-2/3 p-1">{qir?.made_in || 'Indonesia'}</div></div>
              </div>
            </div>
          </div>

          {/* Inspection Standard */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-400 text-[11px]">
              <thead>
                <tr className="bg-red-600 text-white uppercase text-center font-bold">
                  <th colSpan={2} className="p-1 border border-gray-400">Inspection Standart</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-400">
                  <td className="w-1/2 p-1 border-r border-gray-400 bg-[#e6e6e6] font-bold">Plan</td>
                  <td className="w-1/2 p-1 text-center font-semibold">TECHNICAL QUALITY 100% / QTY 100%</td>
                </tr>
                <tr>
                  <td className="w-1/2 p-1 border-r border-gray-400 bg-[#e6e6e6] font-bold">Actual</td>
                  <td className="w-1/2 p-1 text-center font-semibold text-red-600">TECHNICAL QUALITY 100% / QTY 100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Defects Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-red-600 text-white uppercase text-[11px] font-bold text-center">
                  <th colSpan={8} className="p-1 border border-gray-400">Defects (points founding)</th>
                </tr>
                <tr className="bg-[#fff2cc] text-[10px] uppercase font-bold text-center border-b border-gray-400">
                  <th className="p-1 border-r border-gray-400 w-[15%]">Categories</th>
                  <th className="p-1 border-r border-gray-400 w-[15%]">Item</th>
                  <th className="p-1 border-r border-gray-400 w-[8%]">Confirm</th>
                  <th className="p-1 border-r border-gray-400 w-[20%]">Remarks</th>
                  <th className="p-1 border-r border-gray-400 w-[25%]">Description</th>
                  <th className="p-1 border-r border-gray-400 w-[5%]">Crit.</th>
                  <th className="p-1 border-r border-gray-400 w-[5%]">Major</th>
                  <th className="p-1 w-[5%]">Minor</th>
                </tr>
              </thead>
              <tbody>
                {renderChecklistRow('MATERIAL', 'MAHOGANY WOOD', 'mahogany_wood')}
                {renderChecklistRow('', 'DACRON', 'dacron')}
                {renderChecklistRow('', 'BUSA', 'busa')}
                {renderChecklistRow('', 'FABRIC', 'fabric')}
                
                {renderChecklistRow('HARDWARES', 'SLEEPER', 'sleeper')}
                {renderChecklistRow('', 'METAL STRECHER', 'metal_strecher')}
                {renderChecklistRow('', 'GLIDER', 'glider')}
                
                <tr className="border-b border-gray-400 text-[10px] text-center">
                  <td className="border-r border-gray-400 bg-[#e6e6e6] font-bold p-1 uppercase leading-tight">PRODUCT KNOWLEDGES</td>
                  <td colSpan={7} className="p-2 text-left font-bold text-red-600 uppercase">
                    QC ASSESSMENT: {checklist.product_knowledge_remarks}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pictures Title */}
          <h2 className="bg-red-600 text-white font-bold text-center py-1 uppercase text-sm border border-gray-400 mb-4">PICTURES</h2>

          {/* Iterate over latest submission or show general pics */}
          {pps.submissions.length > 0 && (() => {
            const latestSub = pps.submissions[pps.submissions.length - 1];
            return (
              <div className="space-y-6">
                
                {/* PPS CARD */}
                <div className="border border-gray-400">
                  <h3 className="bg-[#fff2cc] border-b border-gray-400 font-bold p-1 text-[11px] uppercase">1. PPS CARD</h3>
                  <div className="flex h-48">
                    <div className="w-1/2 border-r border-gray-400 p-2 flex items-center justify-center bg-gray-50">
                       <span className="text-gray-400 text-xs">(PPS CARD PHOTO)</span>
                    </div>
                    <div className="w-1/2 p-2">
                      <p className="text-[10px] font-bold underline mb-1">REMARKS:</p>
                      <p className="text-[10px]">{latestSub.overview}</p>
                    </div>
                  </div>
                </div>

                {/* OVERVIEW */}
                <div className="border border-gray-400">
                  <div className="flex justify-between items-center bg-[#fff2cc] border-b border-gray-400 p-1">
                    <h3 className="font-bold text-[11px] uppercase">2. OVERVIEW</h3>
                    <span className="text-[10px] font-bold text-red-600 uppercase">CONFIRMED</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 p-2 h-40">
                    <div className="border border-gray-300 p-1 flex items-center justify-center relative bg-gray-50">
                      {latestSub.photo_front ? <img src={latestSub.photo_front} className="max-w-full max-h-full object-contain" /> : <span className="text-gray-400 text-[10px]">NO PHOTO</span>}
                      <span className="absolute bottom-1 left-1 bg-white/80 px-1 text-[8px] font-bold">FRONT</span>
                    </div>
                    <div className="border border-gray-300 p-1 flex items-center justify-center relative bg-gray-50">
                      {latestSub.photo_top ? <img src={latestSub.photo_top} className="max-w-full max-h-full object-contain" /> : <span className="text-gray-400 text-[10px]">NO PHOTO</span>}
                      <span className="absolute bottom-1 left-1 bg-white/80 px-1 text-[8px] font-bold">TOP</span>
                    </div>
                    <div className="border border-gray-300 p-1 flex items-center justify-center relative bg-gray-50">
                      {latestSub.photo_bottom ? <img src={latestSub.photo_bottom} className="max-w-full max-h-full object-contain" /> : <span className="text-gray-400 text-[10px]">NO PHOTO</span>}
                      <span className="absolute bottom-1 left-1 bg-white/80 px-1 text-[8px] font-bold">BOTTOM</span>
                    </div>
                    <div className="border border-gray-300 p-1 flex items-center justify-center relative bg-gray-50">
                      {latestSub.photo_side ? <img src={latestSub.photo_side} className="max-w-full max-h-full object-contain" /> : <span className="text-gray-400 text-[10px]">NO PHOTO</span>}
                      <span className="absolute bottom-1 left-1 bg-white/80 px-1 text-[8px] font-bold">SIDE</span>
                    </div>
                  </div>
                </div>

                {/* DEFECTED */}
                {latestSub.defects && latestSub.defects.length > 0 && (
                  <div className="border border-gray-400">
                    <h3 className="bg-[#fff2cc] border-b border-gray-400 font-bold p-1 text-[11px] uppercase text-red-600">3. DEFECTED</h3>
                    <div className="grid grid-cols-2 gap-0 border-b border-gray-400 last:border-0 divide-x divide-gray-400">
                      {latestSub.defects.map((def, idx) => (
                        <div key={idx} className="flex p-2 gap-2 border-b border-gray-400">
                          <div className="w-1/2 flex flex-col gap-1">
                            {def.photo_far && <img src={def.photo_far} className="w-full h-24 object-cover border border-gray-300" />}
                            {def.photo_close && <img src={def.photo_close} className="w-full h-24 object-cover border border-gray-300" />}
                          </div>
                          <div className="w-1/2">
                            <p className="text-[10px] font-bold underline mb-1">REMARKS:</p>
                            <p className="text-[10px] text-red-600 font-semibold leading-tight">{def.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
