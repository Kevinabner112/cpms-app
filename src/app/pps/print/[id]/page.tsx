'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { PreProductionSample, QIRChecklist } from '@/types';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

function PPSPrintContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const subIndexStr = searchParams?.get('sub');
  const subIndex = subIndexStr ? parseInt(subIndexStr, 10) : null;
  
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
      const imgData = await toPng(printRef.current, { pixelRatio: 2, cacheBust: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // We need image dimensions. Let's create an Image object to get dimensions
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdfHeight = (img.height * pdfWidth) / img.width;
      
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

  const qir = subIndex !== null && pps.submissions[subIndex] ? pps.submissions[subIndex].qir_data : pps.qir_data;
  const checklist = qir?.checklist || {} as QIRChecklist;

  const renderChecklistRow = (category: string, itemLabel: string, key: keyof typeof checklist) => {
    const rawRow = checklist[key];
    const row = (typeof rawRow === 'object' && rawRow !== null) 
      ? rawRow 
      : { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false };

    return (
      <tr className="border-b border-gray-400 text-[10px] text-center">
        {category && (
          <td 
            className="border-r border-gray-400 bg-[#e6e6e6] font-bold p-1 uppercase" 
            rowSpan={category === 'MATERIAL' ? 4 : category === 'HARDWARES' ? 2 : 1}
          >
            {category}
          </td>
        )}
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
          {/* Header */}
          <div className="flex items-center mb-6 gap-6">
            <div className="shrink-0">
              <div className="w-24 h-24 flex items-center justify-center p-1">
                <img src="/logo.png" alt="FES Logo" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <h1 className="bg-red-600 text-white text-3xl font-black uppercase tracking-wider py-2 px-6 w-full text-center">QUALITY INSPECTION REPORT</h1>
              <p className="text-xs text-gray-500 mt-1 font-bold self-end">Doc No: {pps.pps_id}</p>
            </div>
          </div>

          <div className="mb-6 flex border border-gray-400">
            {/* Left side: Item Photo */}
            <div className="w-1/4 border-r border-gray-400 flex flex-col items-center justify-center bg-gray-50 p-2 overflow-hidden">
              {qir?.item_photo ? (
                <img src={qir.item_photo} alt="Item" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-gray-400 italic">Item Photo</span>
              )}
            </div>
            
            {/* Right side: Table */}
            <div className="w-3/4 flex flex-col">
              <h2 className="bg-[#fff2cc] border-b border-gray-400 font-bold text-center py-1 uppercase text-sm">PRE PRODUCTION SAMPLE</h2>
              <div className="grid grid-cols-2 text-[11px]">
                
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
                <tr className="bg-[#fff2cc] text-[10px] uppercase font-bold text-center border-b border-gray-400">
                  <th className="p-1 border-r border-gray-400 w-[15%]" rowSpan={2}>Categories</th>
                  <th className="p-1 border-r border-gray-400 w-[15%]" rowSpan={2}>Item</th>
                  <th className="p-1 border-r border-gray-400 w-[8%]" rowSpan={2}>Confirm</th>
                  <th className="p-1 border-r border-gray-400 w-[20%]" rowSpan={2}>Remarks</th>
                  <th colSpan={4} className="p-1 border-b border-gray-400">DEFECT ( poins founding )</th>
                </tr>
                <tr className="bg-[#fff2cc] text-[10px] uppercase font-bold text-center border-b border-gray-400">
                  <th className="p-1 border-r border-gray-400 w-[25%]">Description</th>
                  <th className="p-1 border-r border-gray-400 w-[5%]">Crit.</th>
                  <th className="p-1 border-r border-gray-400 w-[5%]">Major</th>
                  <th className="p-1 w-[5%]">Minor</th>
                </tr>
              </thead>
              <tbody>
                {renderChecklistRow('MATERIAL', 'WOOD', 'mahogany_wood')}
                {renderChecklistRow('', 'DACRON', 'dacron')}
                {renderChecklistRow('', 'BUSA', 'busa')}
                {renderChecklistRow('', 'FABRIC', 'fabric')}
                
                {renderChecklistRow('HARDWARES', 'SLEEPER', 'sleeper')}
                {renderChecklistRow('', 'METAL STRECHER', 'metal_strecher')}
                
                {renderChecklistRow('PRODUCT KNOWLEDGES', 'GLIDER', 'glider')}
                
                <tr className="border-b border-gray-400 text-[10px] text-center">
                  <td className="border-r border-gray-400 bg-[#e6e6e6] font-bold p-1 uppercase leading-tight"></td>
                  <td colSpan={7} className="p-2 text-left font-bold text-red-600 uppercase">
                    QC ASSESSMENT: {checklist.product_knowledge_remarks}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pictures Title */}
          <h2 className="bg-red-600 text-white font-bold text-center py-1 uppercase text-sm border border-gray-400 mb-4">PICTURES</h2>

          {/* Iterate over chosen submission or show general pics */}
          {pps.submissions.length > 0 && (() => {
            const displaySub = subIndex !== null && pps.submissions[subIndex] 
              ? pps.submissions[subIndex] 
              : pps.submissions[pps.submissions.length - 1];
            return (
              <div className="space-y-6">
                
                {/* PPS CARD */}
                <div className="border border-gray-400">
                  <h3 className="bg-[#fff2cc] border-b border-gray-400 font-bold p-1 text-[11px] uppercase">1. PPS CARD</h3>
                  <div className="flex h-72">
                    <div className="w-1/2 border-r border-gray-400 p-2 flex items-center justify-center bg-gray-50">
                       {displaySub.pps_card_photo ? (
                         <img src={displaySub.pps_card_photo} className="max-w-full max-h-full object-contain" />
                       ) : (
                         <span className="text-gray-400 text-xs italic">PPS CARD PHOTO</span>
                       )}
                    </div>
                    <div className="w-1/2 p-2">
                      <p className="text-[10px] font-bold underline mb-1">REMARKS:</p>
                      <p className="text-[10px]">{displaySub.pps_card_remarks}</p>
                    </div>
                  </div>
                </div>

                {/* OVERVIEW */}
                <div className="border border-gray-400">
                  <div className="flex justify-between items-center bg-[#fff2cc] border-b border-gray-400 p-1">
                    <h3 className="font-bold text-[11px] uppercase">2. OVERVIEW</h3>
                    <span className="text-[10px] font-bold text-red-600 uppercase">CONFIRMED</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 p-2 h-64">
                    <div className="border border-gray-300 p-1 flex items-center justify-center relative bg-gray-50">
                      {displaySub.photo_front ? <img src={displaySub.photo_front} className="max-w-full max-h-full object-contain" /> : <span className="text-gray-400 text-[10px]">NO PHOTO</span>}
                      <span className="absolute bottom-1 left-1 bg-white/80 px-1 text-[8px] font-bold">FRONT</span>
                    </div>
                    <div className="border border-gray-300 p-1 flex items-center justify-center relative bg-gray-50">
                      {displaySub.photo_top ? <img src={displaySub.photo_top} className="max-w-full max-h-full object-contain" /> : <span className="text-gray-400 text-[10px]">NO PHOTO</span>}
                      <span className="absolute bottom-1 left-1 bg-white/80 px-1 text-[8px] font-bold">TOP</span>
                    </div>
                    <div className="border border-gray-300 p-1 flex items-center justify-center relative bg-gray-50">
                      {displaySub.photo_bottom ? <img src={displaySub.photo_bottom} className="max-w-full max-h-full object-contain" /> : <span className="text-gray-400 text-[10px]">NO PHOTO</span>}
                      <span className="absolute bottom-1 left-1 bg-white/80 px-1 text-[8px] font-bold">BOTTOM</span>
                    </div>
                    <div className="border border-gray-300 p-1 flex items-center justify-center relative bg-gray-50">
                      {displaySub.photo_side ? <img src={displaySub.photo_side} className="max-w-full max-h-full object-contain" /> : <span className="text-gray-400 text-[10px]">NO PHOTO</span>}
                      <span className="absolute bottom-1 left-1 bg-white/80 px-1 text-[8px] font-bold">SIDE</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-400 p-2">
                    <p className="text-[10px] font-bold underline mb-1">REMARKS:</p>
                    <p className="text-[10px]">{displaySub.overview_remarks}</p>
                  </div>
                </div>

                {/* DEFECTED */}
                {displaySub.defects && displaySub.defects.length > 0 && (
                  <div className={`border border-gray-400 ${displaySub.defects.length > 2 ? 'break-before-page' : ''}`}>
                    <h3 className="bg-[#fff2cc] border-b border-gray-400 font-bold p-1 text-[11px] uppercase text-red-600">3. DEFECTED</h3>
                    <div className="flex flex-col">
                      {displaySub.defects.map((def, idx) => (
                        <div key={idx} className="flex p-2 gap-2 border-b border-gray-400 last:border-b-0 break-inside-avoid">
                          <div className="w-1/2 flex gap-2">
                            {def.photo_far && <img src={def.photo_far} className="w-1/2 h-40 object-cover border border-gray-300" />}
                            {def.photo_close && <img src={def.photo_close} className="w-1/2 h-40 object-cover border border-gray-300" />}
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

export default function PPSPrintPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-xl">Loading document...</div>}>
      <PPSPrintContent />
    </Suspense>
  );
}
