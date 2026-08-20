'use client';

import Link from 'next/link';
import { Palette, Box } from 'lucide-react';

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">QC System</h1>
        <p className="text-lg text-slate-500">Select a monitoring module to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Module 1: Color Panels */}
        <Link href="/panels/dashboard" className="group">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-400 transition-all duration-300 h-full flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-transform duration-300">
              <Palette className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Monitoring Panel Warna</h2>
            <p className="text-slate-500">
              Manage color panel inventory, track expiration dates, and monitor validity for seat production.
            </p>
          </div>
        </Link>

        {/* Module 2: White Woods */}
        <Link href="/whitewood" className="group">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-400 transition-all duration-300 h-full flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-transform duration-300">
              <Box className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Monitoring White Wood</h2>
            <p className="text-slate-500">
              Track master samples, manage N1/MO loans, and handle Exim documentation workflows.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
