import React, { useState } from 'react';
import { XCircle, Download, ZoomIn, ZoomOut, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, title = 'Photo Preview' }: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Photo_${format(new Date(), 'yyyyMMdd_HHmmss')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download image via fetch, using fallback:', err);
      // Fallback: create an <a> tag and click it. 
      // Do NOT use window.open as it will navigate away (berpindah web) especially for base64.
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `Photo_${format(new Date(), 'yyyyMMdd_HHmmss')}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col" 
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
              <ImageIcon className="w-5 h-5" /> {title}
            </h3>
            <button 
              onClick={handleDownload}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md flex items-center gap-2 text-sm font-semibold border border-indigo-200 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <div className="flex items-center gap-2 ml-4 border-l pl-4 border-slate-300">
              <button 
                onClick={() => setScale(Math.max(1, scale - 0.5))}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
              <button 
                onClick={() => setScale(Math.min(4, scale + 0.5))}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 bg-slate-100 flex-1 overflow-auto flex justify-center items-center relative min-h-[50vh]">
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="max-w-full max-h-[75vh] object-contain rounded border border-slate-300 shadow-sm transition-transform duration-200 ease-in-out cursor-zoom-in" 
            style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'center center' 
            }}
            onClick={() => setScale(scale === 1 ? 2 : 1)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Not+Found+or+Expired';
            }}
          />
        </div>
      </div>
    </div>
  );
}
