'use client'
import { useState, useEffect, useRef, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { Search, ShieldAlert, PlusCircle, AlertTriangle, CheckCircle, XCircle, Upload, FileText, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LeadContentTest } from '@/types';

function LeadContentInventoryContent() {
  const { leadTests, items, fetchData, isLoading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [finalizeTestId, setFinalizeTestId] = useState<string | null>(null);
  
  // Modal state
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lightbox state
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  
  const searchParams = useSearchParams();
  const statusFilter = searchParams?.get('status');
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTests = leadTests.filter(test => {
    if (statusFilter && test.status !== statusFilter) return false;
    
    const item = items.find(i => i.item_code === test.item_code);
    const searchString = `${test.item_code} ${item?.item_name || ''} ${test.provider}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit";
    switch(status) {
      case 'VALID': return <div className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200`}>Valid</div>;
      case 'EXPIRING_SOON': return <div className={`${base} bg-amber-50 text-amber-700 border border-amber-200`}>Expiring Soon</div>;
      case 'EXPIRED': return <div className={`${base} bg-rose-50 text-rose-700 border border-rose-200`}>Expired</div>;
      case 'PENDING': return <div className={`${base} bg-blue-50 text-blue-700 border border-blue-200`}>Pending Result</div>;
      default: return null;
    }
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalizeTestId || !file) {
      setError('Please provide the test result document.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          const imageCompression = (await import('browser-image-compression')).default;
          fileToUpload = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
          });
        } catch (error) {
          console.error("Compression failed:", error);
        }
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('processId', finalizeTestId); // Just a generic ID for the filename

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }

      const { url } = await uploadRes.json();

      // 2. Finalize Test
      await useStore.getState().finalizeLeadContentRenewal(finalizeTestId, testDate, url);
      
      // Cleanup
      setFinalizeTestId(null);
      setFile(null);
      setTestDate(new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      setError(err.message || 'An error occurred during finalization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-16 md:mt-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-emerald-600" />
              Lead Content Tests
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track toxicity tests for your items.</p>
          </div>
          <Link 
            href="/lead-content/new"
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Test
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by Item Code, Name, or Provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Inventory List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading tests...</div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No tests found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search or add a new test.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Item Details</th>
                    <th className="px-6 py-4 font-semibold">Provider</th>
                    <th className="px-6 py-4 font-semibold">Test Date</th>
                    <th className="px-6 py-4 font-semibold">Expiration</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTests.map(test => {
                    const item = items.find(i => i.item_code === test.item_code);
                    return (
                      <tr key={test.test_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{test.item_code}</div>
                          <div className="text-xs text-slate-500">{item?.item_name || 'Unknown Item'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                            {test.provider}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {test.test_date ? format(new Date(test.test_date), 'dd MMM yyyy') : (test.sent_date ? `Sent: ${format(new Date(test.sent_date), 'dd MMM yyyy')}` : '-')}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {test.expiration_date ? format(new Date(test.expiration_date), 'dd MMM yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(test.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {test.status === 'PENDING' ? (
                            <button onClick={() => setFinalizeTestId(test.test_id)} className="text-blue-600 hover:text-blue-700 font-medium text-sm mr-4">
                              Finalize Result
                            </button>
                          ) : (
                            <button onClick={() => {
                              const sentDate = prompt("Enter the date panel was sent to provider (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
                              if (sentDate) {
                                useStore.getState().initiateLeadContentRenewal(test.item_code, test.provider, sentDate);
                              }
                            }} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm mr-4">
                              Renew
                            </button>
                          )}
                          {test.document_url && (
                            <button 
                              onClick={() => { setSelectedDoc(test.document_url || null); setZoom(1); }}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm mr-4"
                            >
                              View Doc
                            </button>
                          )}
                          <button onClick={() => {
                            if(confirm('Are you sure you want to delete this test?')) {
                              useStore.getState().deleteLeadContentTest(test.test_id);
                            }
                          }} className="text-rose-600 hover:text-rose-700 font-medium text-sm">
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Finalize Modal */}
        {finalizeTestId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Finalize Test Result</h3>
                <button 
                  onClick={() => { setFinalizeTestId(null); setFile(null); setError(''); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleFinalize} className="p-6 space-y-6">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Actual Test Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={testDate}
                    onChange={e => setTestDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">Expiration date will be automatically set to 1 year from this date.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Test Result Document (PDF/Image) <span className="text-rose-500">*</span>
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      accept="image/*,application/pdf"
                    />
                    {file ? (
                      <>
                        <FileText className="w-8 h-8 text-emerald-600 mb-2" />
                        <p className="text-sm font-medium text-emerald-700 text-center">{file.name}</p>
                        <p className="text-xs text-emerald-600 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-600">Click to upload document</p>
                        <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setFinalizeTestId(null); setFile(null); setError(''); }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    {isSubmitting ? 'Uploading & Saving...' : 'Save Result'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox for Document Viewer */}
      {selectedDoc && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
          onClick={() => { setSelectedDoc(null); setZoom(1); }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col" 
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '90vh' }}
          >
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" /> Document Preview
                </h3>
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch(selectedDoc);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      const ext = selectedDoc.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg';
                      link.download = `LeadTest_Result_${format(new Date(), 'yyyyMMdd_HHmmss')}.${ext}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Failed to download document:', err);
                      window.open(selectedDoc, '_blank');
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md flex items-center gap-2 text-sm font-semibold border border-indigo-200 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
              <button 
                onClick={() => { setSelectedDoc(null); setZoom(1); }} 
                className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-100 flex-1 overflow-auto flex justify-center items-center group relative min-h-[50vh]">
              {selectedDoc.startsWith('blob:') && (
                <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-300 shadow-sm z-10">
                  ⚠️ This is a temporary local file (blob). If it appears broken, please re-upload.
                </div>
              )}
              {selectedDoc.toLowerCase().endsWith('.pdf') ? (
                <iframe src={selectedDoc} className="w-full h-full min-h-[60vh] max-w-5xl bg-white rounded shadow-sm border border-slate-300 mx-auto" />
              ) : (
                <>
                  <img 
                    src={selectedDoc} 
                    alt="Document view" 
                    className="max-w-full max-h-[75vh] object-contain rounded border border-slate-300 shadow-sm transition-transform duration-200 ease-in-out hover:scale-[1.5] cursor-zoom-in" 
                    style={{ transformOrigin: 'center center' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Not+Found+or+Expired';
                    }}
                  />
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    Hover to Zoom
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadContentInventory() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Inventory...</div>}>
      <LeadContentInventoryContent />
    </Suspense>
  );
}
