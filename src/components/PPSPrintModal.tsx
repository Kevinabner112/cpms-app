import { useRef, useState } from 'react';
import { PreProductionSample, QIRChecklist } from '@/types';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

type PPSPrintModalProps = {
  pps: PreProductionSample;
  submissionIndex: number;
  onClose: () => void;
};

export default function PPSPrintModal({ pps, submissionIndex, onClose }: PPSPrintModalProps) {
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const submission =
    submissionIndex !== null && pps.submissions[submissionIndex]
      ? pps.submissions[submissionIndex]
      : pps.submissions.length > 0 ? pps.submissions[pps.submissions.length - 1] : null;

  const qir = submission?.qir_data || pps.qir_data;
  const checklist = (qir?.checklist || {}) as QIRChecklist;
  
  const hasOverviewPhotos = submission?.photo_front || submission?.photo_top || submission?.photo_bottom || submission?.photo_side;
  const defects = submission?.defects || [];

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setGenerating(true);
    try {
      const elements = Array.from(printRef.current.querySelectorAll('.pdf-page-element')) as HTMLElement[];
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const pdfHeightPage = pdf.internal.pageSize.getHeight() - (margin * 2);
      
      let currentY = margin;
      
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        
        // Render image with cache busting and better quality
        const imgData = await toPng(el, { 
          pixelRatio: 2, 
          cacheBust: true,
          style: { transform: 'scale(1)', transformOrigin: 'top left' }
        });
        
        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => {
          img.onload = resolve as () => void;
        });
        
        const imgRatio = img.height / img.width;
        let finalHeight = pdfWidth * imgRatio;
        
        // If element is larger than a single page, scale it down to fit one page
        if (finalHeight > pdfHeightPage) {
           finalHeight = pdfHeightPage;
        }

        // If this element will overflow the current page, and we aren't at the top, add a new page
        if (currentY + finalHeight > pdfHeightPage + margin && currentY > margin) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth, finalHeight);
        currentY += finalHeight;
      }
      
      pdf.save(`QIR_${pps.item_code || 'PPS'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  
  const renderChecklistRow = (
    category: string,
    itemLabel: string,
    key: keyof typeof checklist,
    isFirstInCategory: boolean,
    rowSpan: number
  ) => {
    const rawRow = checklist[key];
    const row = typeof rawRow === 'object' && rawRow !== null
        ? rawRow
        : { confirm: '', remarks: '', description: '', critical: false, major: false, minor: false };
    
    return (
      <tr className="border-b border-gray-400 text-[9px] text-center bg-gray-50">
        {isFirstInCategory && category && (
          <td className="border-r border-gray-400 bg-white font-bold p-1 uppercase" rowSpan={rowSpan}>
            {category}
          </td>
        )}
        <td className="border-r border-gray-400 p-1 text-left pl-2 uppercase bg-white">
          {itemLabel}
        </td>
        <td className="border-r border-gray-400 p-1 font-bold">
          {row.confirm === 'YES' ? 'V' : ''}
        </td>
        <td className="border-r border-gray-400 p-1 font-bold">
          {row.confirm === 'NO' ? 'V' : ''}
        </td>
        <td className="border-r border-gray-400 p-1 text-left">{row.remarks}</td>
        <td className="border-r border-gray-400 p-1 text-left bg-white">{row.description}</td>
        <td className="border-r border-gray-400 p-1 text-red-600 font-bold">{row.critical ? 'V' : ''}</td>
        <td className="border-r border-gray-400 p-1 text-red-600 font-bold">{row.major ? 'V' : ''}</td>
        <td className="p-1 text-red-600 font-bold">{row.minor ? 'V' : ''}</td>
      </tr>
    );
  };

  const itemPhoto = qir?.item_photo || pps.result_photo_url;
  const qcAssessment = checklist.product_knowledge_remarks || '-';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 p-4 overflow-y-auto flex justify-center items-start">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full relative mt-6 mb-10 flex flex-col overflow-hidden">
        {/* Header with close & download */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-100 sticky top-0 z-10 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">Print / Download QIR</h2>
          <div className="flex gap-4 items-center">
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="bg-[#e06666] text-white px-6 py-2 rounded font-bold shadow hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-3xl font-black px-2 leading-none">
              &times;
            </button>
          </div>
        </div>
        
        {/* Print content container */}
        <div className="bg-gray-200 w-full p-4 md:p-8 flex flex-col items-center pb-20" ref={printRef}>
          
          {/* SECTION 1: Main Report Table */}
          <div className="pdf-page-element w-[800px] shrink-0 bg-white flex flex-col text-[10px] text-gray-800 font-sans border-t border-x border-gray-400 mb-0">
            {/* Header Logo and Title */}
            <div className="flex border-b border-gray-400">
              <div className="w-[30%] flex flex-col items-center justify-center p-1 relative min-h-[90px] bg-gray-100 border-r border-gray-400">
                <img src="/logo.png" alt="FES Logo" className="w-full h-full max-h-[85px] object-contain" crossOrigin="anonymous" />
                <span className="text-[9px] absolute top-2 right-2 text-gray-500">QC</span>
              </div>
              <div className="w-[70%] flex items-center justify-center bg-[#e06666]">
                <h1 className="text-white text-[28px] font-normal tracking-wide">
                  QUALITY INSPECTION REPORT
                </h1>
              </div>
            </div>

            {/* Info Table */}
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-[30%] border-r border-b border-gray-400 p-2 relative bg-gray-100 align-top h-[280px]" rowSpan={10}>
                    {itemPhoto ? (
                      <div className="absolute inset-2 flex items-center justify-center">
                        <img 
                          src={itemPhoto} 
                          alt="Item" 
                          className="max-w-full max-h-full object-contain" 
                          crossOrigin="anonymous" 
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 italic flex justify-center w-full mt-10">No Item Photo</span>
                    )}
                  </td>
                  <td colSpan={2} className="w-[70%] bg-[#ffd966] font-bold text-center border-b border-gray-400 py-1">
                    PRE PRODUCTION SAMPLE
                  </td>
                </tr>
                <tr>
                  <td className="w-[30%] border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Product Name</td>
                  <td className="w-[40%] border-b border-gray-400 px-2 py-0.5">{qir?.product_name || pps.project_name}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Item Number</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{pps.item_code}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Item Number Custom</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.item_number_custom}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Item Size</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.item_size}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Color</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.color}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Material</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.material}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Qty</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.qty || '1 Pc'}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Client Name</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.client_name}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Supplier Name</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.supplier_name || 'Far East Seating'}</td>
                </tr>
                <tr>
                  {/* Empty cell under image */}
                  <td className="border-r border-b border-gray-400 bg-white"></td>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Inspection Date</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.inspection_date}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 bg-white"></td>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Starting at</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.starting_at}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 bg-white"></td>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Finish at</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.finish_at}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 bg-white"></td>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Inspection Location</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.inspection_location}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 bg-white"></td>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Inspector</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.inspector || pps.handled_by}</td>
                </tr>
                <tr>
                  <td className="border-r border-b border-gray-400 bg-white"></td>
                  <td className="border-r border-b border-gray-400 px-2 py-0.5 bg-gray-50">Made in</td>
                  <td className="border-b border-gray-400 px-2 py-0.5">{qir?.made_in || 'In-House'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pdf-page-element w-[800px] shrink-0 bg-white flex flex-col text-[10px] text-gray-800 font-sans border-x border-gray-400 mb-0">
            {/* Inspection Standard Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-[#e06666] text-white py-1 px-2 text-left font-normal" colSpan={2}>
                    Inspection Standart
                  </th>
                  <th className="bg-[#e06666] text-white py-1 font-normal border-l border-white" colSpan={4}>
                    DEFECTS (points founding)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-100 text-red-500 text-[8px]">
                  <td className="w-[15%] px-2 border-r border-b border-gray-400 font-bold">Plan</td>
                  <td className="w-[35%] px-2 border-r border-b border-gray-400">: TECHNICAL QUALITY 100% / QTY 100%</td>
                  <td className="w-[20%] border-b border-gray-400" rowSpan={2}></td>
                  <td className="w-[10%] border-b border-gray-400" rowSpan={2}></td>
                  <td className="w-[10%] border-b border-gray-400" rowSpan={2}></td>
                  <td className="w-[10%] border-b border-gray-400" rowSpan={2}></td>
                </tr>
                <tr className="bg-gray-100 text-red-500 text-[8px]">
                  <td className="px-2 border-r border-b border-gray-400 font-bold">Actual</td>
                  <td className="px-2 border-r border-b border-gray-400">: TECHNICAL QUALITY 100% / QTY 100%</td>
                </tr>
              </tbody>
            </table>
            
            {/* Checklist Table */}
            <table className="w-full border-collapse text-[9px] text-center border-b border-gray-400">
               <thead>
                 <tr className="bg-[#e06666] text-white font-normal uppercase">
                   <th rowSpan={2} className="border-r border-white w-[15%]">MATERIAL</th>
                   <th rowSpan={2} className="border-r border-white w-[15%]">ITEM</th>
                   <th colSpan={2} className="border-r border-b border-white w-[10%]">CONFIRM</th>
                   <th rowSpan={2} className="border-r border-white w-[15%]">REMARKS</th>
                   <th rowSpan={2} className="border-r border-white w-[25%]">Description</th>
                   <th rowSpan={2} className="border-r border-white w-[6%]">Critical</th>
                   <th rowSpan={2} className="border-r border-white w-[6%]">Major</th>
                   <th rowSpan={2} className="w-[8%]">Minor</th>
                 </tr>
                 <tr className="bg-[#e06666] text-white font-normal">
                   <th className="border-r border-white">YES</th>
                   <th>NO</th>
                 </tr>
               </thead>
               <tbody>
                 {renderChecklistRow('MATERIAL', 'WOOD', 'wood', true, 4)}
                 {renderChecklistRow('', 'DACRON', 'dacron', false, 0)}
                 {renderChecklistRow('', 'BUSA', 'busa', false, 0)}
                 {renderChecklistRow('', 'FABRIC', 'fabric', false, 0)}
                 {renderChecklistRow('HARDWARES', 'SLEEPER', 'sleeper', true, 2)}
                 {renderChecklistRow('', 'METAL STRECHER', 'metal_strecher', false, 0)}
                 {/* Gap row */}
                 <tr className="border-b border-gray-400 h-4 bg-gray-50"><td colSpan={5} className="border-r border-gray-400 bg-white"></td><td colSpan={4}></td></tr>
                 {renderChecklistRow('ACCESSORIES', 'GLIDER', 'glider', true, 1)}
                 <tr>
                   <td className="border-r border-gray-400 bg-gray-50 font-bold p-1 uppercase text-left" colSpan={2}>
                     Product Knowledges
                   </td>
                   <td className="border-r border-gray-400 bg-white" colSpan={3}></td>
                   <td className="bg-[#ffd966] font-bold p-2 uppercase border-l border-gray-400" colSpan={4}>
                     QC ASSESSMENT : {qcAssessment}
                   </td>
                 </tr>
               </tbody>
            </table>
          </div>

          {/* SECTION 2: PPS CARD */}
          {(hasOverviewPhotos || submission?.pps_card_photo) && (
            <div className="pdf-page-element w-[800px] shrink-0 bg-white flex flex-col text-[10px] text-gray-800 font-sans border-x border-gray-400 mb-0">
              <table className="w-full border-collapse border-b border-gray-400">
                 <thead>
                   <tr>
                     <th className="bg-[#e06666] text-white py-1 px-2 text-left font-normal uppercase" colSpan={2}>
                       PICTURES
                     </th>
                   </tr>
                   <tr className="bg-[#e06666] text-white uppercase text-[9px] font-normal">
                     <th className="border-r border-white py-1 px-2 text-left w-1/2">1. PPS CARD</th>
                     <th className="py-1 px-2 w-1/2">REMARKS</th>
                   </tr>
                 </thead>
                 <tbody>
                   {submission?.pps_card_photo ? (
                     <tr>
                       <td className="w-1/2 p-2 border-r border-gray-400 h-[300px] align-top bg-gray-100 relative">
                         <img src={submission.pps_card_photo} alt="PPS Card" className="absolute inset-2 m-auto max-w-full max-h-full object-contain" crossOrigin="anonymous" />
                       </td>
                       <td className="w-1/2 p-2 text-center font-bold text-xs uppercase align-middle whitespace-pre-wrap">
                         {submission?.pps_card_remarks || "ALL KIND OF RESUME HAS TO BE FOLLOW UP"}
                       </td>
                     </tr>
                   ) : (
                     <tr>
                       <td colSpan={2} className="p-4 text-center text-gray-400 italic">No PPS Card uploaded</td>
                     </tr>
                   )}
                 </tbody>
              </table>
            </div>
          )}

          {/* SECTION 3: OVERVIEW */}
          {hasOverviewPhotos && (
            <div className="pdf-page-element w-[800px] shrink-0 bg-white flex flex-col text-[10px] text-gray-800 font-sans border-x border-gray-400 mb-0">
              <table className="w-full border-collapse border-b border-gray-400">
                 <thead>
                   <tr className="bg-[#e06666] text-white uppercase text-[9px] font-normal">
                     <th className="border-r border-white py-1 px-2 text-left w-[60%]">2. OVERVIEW</th>
                     <th className="py-1 px-2 w-[40%]">REMARKS</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr>
                     <td className="w-[60%] p-2 border-r border-gray-400 bg-gray-50">
                       <div className="grid grid-cols-2 gap-2">
                         {['Front', 'Top', 'Bottom', 'Side'].map((angle) => {
                           const prop = `photo_${angle.toLowerCase()}` as keyof typeof submission;
                           const photoUrl = submission?.[prop] as string | undefined;
                           
                           return (
                             <div key={angle} className="relative bg-white border border-gray-300 flex items-center justify-center overflow-hidden h-[180px]">
                               {photoUrl ? (
                                 <img 
                                   src={photoUrl} 
                                   alt={`${angle} view`} 
                                   className="max-w-full max-h-full object-contain absolute inset-1 m-auto" 
                                   crossOrigin="anonymous" 
                                 />
                               ) : (
                                 <span className="text-gray-400 italic text-[9px]">No {angle} photo</span>
                               )}
                             </div>
                           );
                         })}
                       </div>
                     </td>
                     <td className="w-[40%] p-2 text-center font-bold text-xs uppercase align-middle whitespace-pre-wrap">
                       {submission?.overview_remarks || "CONFIRMED"}
                     </td>
                   </tr>
                 </tbody>
              </table>
            </div>
          )}

          {/* SECTION 4: DEFECTS */}
          {defects.length > 0 && (
            <div className="pdf-page-element w-[800px] shrink-0 bg-white flex flex-col text-[10px] text-gray-800 font-sans border-x border-gray-400 mb-0">
              <div className="bg-[#e06666] text-white py-1 px-2 text-left text-[9px] uppercase border-b border-gray-400">
                3. DEFECTED
              </div>
            </div>
          )}

          {defects.map((defect, i) => (
            <div key={defect.defect_id} className="pdf-page-element w-[800px] shrink-0 bg-white flex flex-col text-[10px] text-gray-800 font-sans border-x border-b border-gray-400 mb-0">
              <table className="w-full border-collapse">
                 <tbody>
                   <tr>
                     <td className="w-[30%] p-2 border-r border-gray-400 bg-gray-50 h-[220px] relative">
                       {defect.photo_far ? (
                         <img 
                           src={defect.photo_far} 
                           alt="Far View" 
                           className="max-w-full max-h-full object-contain absolute inset-2 m-auto" 
                           crossOrigin="anonymous" 
                         />
                       ) : (
                         <span className="text-gray-400 italic text-[9px] flex justify-center mt-10">No Far photo</span>
                       )}
                     </td>
                     <td className="w-[30%] p-2 border-r border-gray-400 bg-gray-50 relative">
                       {defect.photo_close ? (
                         <img 
                           src={defect.photo_close} 
                           alt="Close View" 
                           className="max-w-full max-h-full object-contain absolute inset-2 m-auto" 
                           crossOrigin="anonymous" 
                         />
                       ) : (
                         <span className="text-gray-400 italic text-[9px] flex justify-center mt-10">No Close photo</span>
                       )}
                     </td>
                     <td className="w-[40%] p-4 text-center font-bold text-xs uppercase align-middle whitespace-pre-wrap">
                       {defect.description}
                     </td>
                   </tr>
                 </tbody>
              </table>
            </div>
          ))}

          {/* Just an empty block at the end for final bottom border if no defects */}
          {defects.length === 0 && (
            <div className="w-[800px] border-t border-gray-400"></div>
          )}

        </div>
      </div>
    </div>
  );
}

