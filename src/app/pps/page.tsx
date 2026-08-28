'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { PreProductionSample } from '@/types';
import PPSSubmissionModal from '@/components/PPSSubmissionModal';
import PPSDetailsModal from '@/components/PPSDetailsModal';

export default function PPSInventoryPage() {
  const { ppsRecords, fetchData, deletePPSRecord } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REVISING' | 'APPROVED' | 'CLOSED'>('ALL');
  const [selectedPPS, setSelectedPPS] = useState<PreProductionSample | null>(null);
  const [modalType, setModalType] = useState<'DETAILS' | 'ADD_SUBMISSION' | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (ppsId: string) => {
    if (confirm('Are you sure you want to delete this PPS project?')) {
      try {
        await deletePPSRecord(ppsId);
      } catch (error) {
        console.error(error);
        alert('Failed to delete PPS project.');
      }
    }
  };

  const filteredRecords = useMemo(() => {
    return ppsRecords.filter(record => {
      const matchesSearch = 
        record.project_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        record.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.pps_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [ppsRecords, searchTerm, statusFilter]);

  const metrics = {
    pending: ppsRecords.filter(p => p.status === 'PENDING').length,
    revising: ppsRecords.filter(p => p.status === 'REVISING').length,
    approved: ppsRecords.filter(p => p.status === 'APPROVED').length,
    closed: ppsRecords.filter(p => p.status === 'CLOSED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pre Production Sample (PPS)</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track sample submissions</p>
        </div>
        <Link 
          href="/pps/new" 
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium w-full md:w-auto text-center"
        >
          + Create New PPS
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <button 
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-3 md:p-4 rounded-lg shadow border flex flex-col items-center justify-center transition-all cursor-pointer ${statusFilter === 'PENDING' ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-400' : 'bg-white border-gray-100 hover:bg-yellow-50/50'}`}
        >
          <span className="text-3xl font-bold text-yellow-500">{metrics.pending}</span>
          <span className="text-sm text-gray-500 uppercase tracking-wide mt-1">Pending</span>
        </button>
        <button 
          onClick={() => setStatusFilter(statusFilter === 'REVISING' ? 'ALL' : 'REVISING')}
          className={`p-3 md:p-4 rounded-lg shadow border flex flex-col items-center justify-center transition-all cursor-pointer ${statusFilter === 'REVISING' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400' : 'bg-white border-gray-100 hover:bg-blue-50/50'}`}
        >
          <span className="text-3xl font-bold text-blue-500">{metrics.revising}</span>
          <span className="text-sm text-gray-500 uppercase tracking-wide mt-1">Revising</span>
        </button>
        <button 
          onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
          className={`p-3 md:p-4 rounded-lg shadow border flex flex-col items-center justify-center transition-all cursor-pointer ${statusFilter === 'APPROVED' ? 'bg-green-50 border-green-300 ring-2 ring-green-400' : 'bg-white border-gray-100 hover:bg-green-50/50'}`}
        >
          <span className="text-3xl font-bold text-green-500">{metrics.approved}</span>
          <span className="text-sm text-gray-500 uppercase tracking-wide mt-1">Approved</span>
        </button>
        <button 
          onClick={() => setStatusFilter(statusFilter === 'CLOSED' ? 'ALL' : 'CLOSED')}
          className={`p-3 md:p-4 rounded-lg shadow border flex flex-col items-center justify-center transition-all cursor-pointer ${statusFilter === 'CLOSED' ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-400' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
        >
          <span className="text-3xl font-bold text-gray-500">{metrics.closed}</span>
          <span className="text-sm text-gray-500 uppercase tracking-wide mt-1">Closed</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-100 flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Search Project, Item Code or PPS ID..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="REVISING">Revising</option>
          <option value="APPROVED">Approved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No PPS records found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr 
                  key={record.pps_id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => { 
                    setSelectedPPS(record); 
                    setModalType('DETAILS'); 
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.project_name}</div>
                    <div className="text-xs text-gray-500">{record.pps_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.item_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${record.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        record.status === 'REVISING' ? 'bg-blue-100 text-blue-800' : 
                        record.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.start_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.submissions.length} checks
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-4 justify-end">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedPPS(record); setModalType('DETAILS'); }}
                        className="text-indigo-600 hover:text-indigo-900 px-3 py-1.5 rounded"
                      >
                        Details
                      </button>
                      {record.status !== 'CLOSED' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedPPS(record); setModalType('ADD_SUBMISSION'); }}
                          className="text-green-600 hover:text-green-900 px-3 py-1.5 rounded"
                        >
                          + Add Check
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(record.pps_id); }}
                        className="text-rose-600 hover:text-rose-900 px-3 py-1.5 rounded ml-2"
                        title="Delete PPS"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {modalType === 'DETAILS' && selectedPPS && (
        <PPSDetailsModal pps={selectedPPS} onClose={() => { setModalType(null); setSelectedPPS(null); }} />
      )}
      {modalType === 'ADD_SUBMISSION' && selectedPPS && (
        <PPSSubmissionModal pps={selectedPPS} onClose={() => { setModalType(null); setSelectedPPS(null); }} />
      )}
    </div>
  );
}
