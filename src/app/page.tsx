'use client';

import Link from 'next/link';
import { Palette, Box, ShieldAlert, ClipboardCheck, Database } from 'lucide-react';

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background blobs (Light Blue & Gray) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30"></div>
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-sky-400 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-slate-400 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
      </div>

      <div className="text-center mb-12 relative z-10">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3 drop-shadow-md">QC System</h1>
        <p className="text-lg text-blue-200">Select a monitoring module to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl relative z-10">
        {/* Module 1: Color Panels */}
        <Link href="/panels/dashboard" className="group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-400 transition-all duration-300 h-full flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-100 transition-transform duration-300">
              <Palette className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-sm md:text-base font-bold text-slate-800 mb-1">Monitoring Panel Warna</h2>
            <p className="text-[10px] md:text-xs text-slate-500 leading-snug">
              Manage color panel inventory, track expiration dates, and monitor validity for seat production.
            </p>
          </div>
        </Link>

        {/* Module 2: White Woods */}
        <Link href="/whitewood" className="group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-400 transition-all duration-300 h-full flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-100 transition-transform duration-300">
              <Box className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-sm md:text-base font-bold text-slate-800 mb-1">Monitoring White Wood</h2>
            <p className="text-[10px] md:text-xs text-slate-500 leading-snug">
              Track master samples, manage N1/MO loans, and handle Exim documentation workflows.
            </p>
          </div>
        </Link>
        {/* Module 3: Lead Content */}
        <Link href="/lead-content/dashboard" className="group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-400 transition-all duration-300 h-full flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-100 transition-transform duration-300">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-sm md:text-base font-bold text-slate-800 mb-1">Monitoring Lead Content</h2>
            <p className="text-[10px] md:text-xs text-slate-500 leading-snug">
              Track toxicity tests for materials, monitor expiration dates, and manage BV / Intertek documents.
            </p>
          </div>
        </Link>

        {/* Module 4: PPS */}
        <Link href="/pps" className="group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-xl hover:border-amber-400 transition-all duration-300 h-full flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-100 transition-transform duration-300">
              <ClipboardCheck className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-sm md:text-base font-bold text-slate-800 mb-1">Pre Production Sample</h2>
            <p className="text-[10px] md:text-xs text-slate-500 leading-snug">
              Track PPS submissions, iterative reviews, and final approvals before mass production.
            </p>
          </div>
        </Link>
        
        {/* Module 5: Master Data */}
        <Link href="/items" className="group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-xl hover:border-purple-400 transition-all duration-300 h-full flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-100 transition-transform duration-300">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-sm md:text-base font-bold text-slate-800 mb-1">Master Items</h2>
            <p className="text-[10px] md:text-xs text-slate-500 leading-snug">
              Centralized catalog to manage, view, add, and delete items used across all modules.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
