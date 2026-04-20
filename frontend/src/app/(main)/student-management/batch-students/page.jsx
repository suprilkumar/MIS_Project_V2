'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FaSearch, FaChevronLeft, FaChevronRight, FaSpinner, 
  FaCheckSquare, FaSquare, FaUsers, FaGraduationCap,
  FaUserCheck, FaChartLine, FaBuilding, FaBookOpen,
  FaCalendarAlt, FaFilter, FaTimes, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { MdSchedule, MdPeople, MdSchool } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function BatchStudentManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [batchInfo, setBatchInfo] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      const response = await api.get('/student-management/centres-with-batches/');
      setCentres(response.data.centres);
    } catch (error) {
      console.error('Error fetching centres:', error);
      toast.error('Failed to load centres');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async (centreId) => {
    setLoading(true);
    try {
      const response = await api.get(`/student-management/centres/${centreId}/batches/?search=${searchTerm}&status=${statusFilter}`);
      setBatches(response.data.batches);
      setSelectedBatch(null);
      setStudents([]);
      setStatistics(null);
      setSelectedStudents(new Set());
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchStudents = async (batchId) => {
    setLoading(true);
    try {
      const [studentsRes, statsRes] = await Promise.all([
        api.get(`/student-management/batches/${batchId}/students/`),
        api.get(`/student-management/batches/${batchId}/statistics/`)
      ]);
      setStudents(studentsRes.data.students);
      setBatchInfo(studentsRes.data.batch);
      setStatistics(statsRes.data.statistics);
      setSelectedStudents(new Set());
    } catch (error) {
      console.error('Error fetching batch students:', error);
      toast.error('Failed to load batch students');
    } finally {
      setLoading(false);
    }
  };

  const handleCentreSelect = (centreId) => {
    setSelectedCentre(centreId);
    fetchBatches(centreId);
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    fetchBatchStudents(batch.id);
  };

  const handleSearch = () => {
    if (selectedCentre) {
      fetchBatches(selectedCentre);
    }
  };

  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleBulkStatusUpdate = async (statusType, value) => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      const response = await api.post(`/student-management/batches/${selectedBatch.id}/students/bulk-update/`, {
        student_ids: Array.from(selectedStudents),
        updates: { [statusType]: value }
      });
      
      toast.success(response.data.message);
      fetchBatchStudents(selectedBatch.id);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleBulkTrainingUpdate = async (statusType, value) => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      const response = await api.post(`/student-management/batches/${selectedBatch.id}/students/bulk-training/`, {
        student_ids: Array.from(selectedStudents),
        status_type: statusType,
        value: value
      });
      
      toast.success(response.data.message);
      fetchBatchStudents(selectedBatch.id);
    } catch (error) {
      console.error('Error updating training status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const getStatusBadge = (value, type) => {
    if (value) {
      return <span className="text-green-600 font-medium">✓ Yes</span>;
    }
    return <span className="text-red-600">✗ No</span>;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(students.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span className="text-gray-400">/</span>
            <Link href="/student-management" className="hover:text-blue-600">Student Management</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Batch Students</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Student Management</h1>
          <p className="mt-2 text-gray-600">Manage student enrollment, training, and certification status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Centre and Batch Selection */}
          <div className="lg:col-span-1 space-y-4">
            {/* Centre Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaBuilding className="text-blue-600" />
                Select Centre
              </h2>
              <select
                value={selectedCentre || ''}
                onChange={(e) => handleCentreSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a centre...</option>
                {centres.map(centre => (
                  <option key={centre.id} value={centre.id}>{centre.name}</option>
                ))}
              </select>
            </div>

            {/* Batch List */}
            {selectedCentre && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-800 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MdSchedule className="text-purple-600" />
                    Batches
                  </h2>
                  <span className="text-sm text-gray-500">{batches.length} batches</span>
                </div>
                
                {/* Search and Filter */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search batches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    <FaSearch />
                  </button>
                </div>

                {/* Batch List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loading && !students.length ? (
                    <div className="flex justify-center py-8">
                      <FaSpinner className="animate-spin text-2xl text-blue-600" />
                    </div>
                  ) : batches.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No batches found</p>
                  ) : (
                    batches.map(batch => (
                      <div
                        key={batch.id}
                        onClick={() => handleBatchSelect(batch)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedBatch?.id === batch.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{batch.display_name}</p>
                            <p className="text-xs text-gray-500 mt-1">{batch.course_name}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <FaCalendarAlt className="text-xs" />
                              <span>
                                {batch.batch_start_date ? new Date(batch.batch_start_date).toLocaleDateString() : 'N/A'} - 
                                {batch.batch_end_date ? new Date(batch.batch_end_date).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              batch.batch_status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                              batch.batch_status === 'UPCOMING' ? 'bg-orange-100 text-orange-700' :
                              batch.batch_status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {batch.batch_status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {batch.current_enrollment}/{batch.max_capacity || '∞'} students
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Student List and Status Management */}
          <div className="lg:col-span-2 space-y-4">
            {selectedBatch ? (
              <>
                {/* Batch Info Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{batchInfo?.name}</h2>
                      <p className="text-sm opacity-90 mt-1">{batchInfo?.course_name} - {batchInfo?.centre_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt /> {batchInfo?.batch_start_date ? new Date(batchInfo.batch_start_date).toLocaleDateString() : 'N/A'} - {batchInfo?.batch_end_date ? new Date(batchInfo.batch_end_date).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MdPeople /> {students.length}/{batchInfo?.max_capacity || '∞'} students
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowStats(!showStats)}
                      className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm flex items-center gap-1"
                    >
                      {showStats ? <FaEyeSlash /> : <FaEye />} Stats
                    </button>
                  </div>
                </div>

                {/* Statistics Panel */}
                {showStats && statistics && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FaChartLine className="text-blue-600" />
                      Batch Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">Enrolled</p>
                        <p className="text-2xl font-bold text-green-700">{statistics.enrolled}</p>
                        <p className="text-xs text-green-600">{statistics.enrollment_rate}%</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600">Trained</p>
                        <p className="text-2xl font-bold text-blue-700">{statistics.trained}</p>
                        <p className="text-xs text-blue-600">{statistics.training_rate}%</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600">Certified</p>
                        <p className="text-2xl font-bold text-purple-700">{statistics.certified}</p>
                        <p className="text-xs text-purple-600">{statistics.certification_rate}%</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-600">Placed</p>
                        <p className="text-2xl font-bold text-orange-700">{statistics.placed}</p>
                        <p className="text-xs text-orange-600">{statistics.placement_rate}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulk Actions Bar */}
                {selectedStudents.size > 0 && (
                  <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <FaUserCheck className="text-blue-600" />
                      <span className="text-sm text-blue-800 font-medium">
                        {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleBulkTrainingUpdate('trained', true)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Mark Trained
                      </button>
                      <button
                        onClick={() => handleBulkTrainingUpdate('trained', false)}
                        className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                      >
                        Mark Not Trained
                      </button>
                      <button
                        onClick={() => handleBulkTrainingUpdate('certified', true)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                      >
                        Mark Certified
                      </button>
                      <button
                        onClick={() => handleBulkTrainingUpdate('certified', false)}
                        className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                      >
                        Mark Not Certified
                      </button>
                      <button
                        onClick={() => setSelectedStudents(new Set())}
                        className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Student Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-700 text-white font-semibold text-sm border-b border-black">
                        <tr>
                          <th className="px-4 py-3 text-left w-12">
                            <button onClick={handleSelectAll} className="focus:outline-none">
                              {selectedStudents.size === students.length && students.length > 0 ? 
                                <FaCheckSquare className="text-blue-600 text-xl" /> : 
                                <FaSquare className="text-gray-400 text-xl" />
                              }
                            </button>
                          </th>
                          <th className="px-4 py-3 text-left  uppercase">Name</th>
                          <th className="px-4 py-3 text-left  uppercase">App No.</th>
                          <th className="px-4 py-3 text-center  uppercase">Gender</th>
                          <th className="px-4 py-3 text-center  uppercase">Category</th>
                          <th className="px-4 py-3 text-center  uppercase">Enrolled</th>
                          <th className="px-4 py-3 text-center  uppercase">Trained</th>
                          <th className="px-4 py-3 text-center  uppercase">Certified</th>
                          <th className="px-4 py-3 text-center  uppercase">Placed</th>
                          <th className="px-4 py-3 text-left  uppercase">Mobile</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loading && !students.length ? (
                          <tr>
                            <td colSpan="10" className="text-center py-12">
                              <FaSpinner className="animate-spin text-2xl text-blue-600 mx-auto" />
                            </td>
                          </tr>
                        ) : currentStudents.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="text-center py-12 text-gray-500">
                              No students found in this batch
                            </td>
                          </tr>
                        ) : (
                          currentStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <button onClick={() => handleSelectStudent(student.id)}>
                                  {selectedStudents.has(student.id) ? 
                                    <FaCheckSquare className="text-blue-600" /> : 
                                    <FaSquare className="text-gray-400" />
                                  }
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{student.candidate_name}</p>
                                  <p className="text-xs text-gray-500">{student.registration_id || 'No Reg ID'}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{student.application_number || 'N/A'}</td>
                              <td className="px-4 py-3 text-center text-sm">{student.gender === 'M' ? 'Male' : 'Female'}</td>
                              <td className="px-4 py-3 text-center text-sm">{student.category}</td>
                              <td className="px-4 py-3 text-center">{getStatusBadge(student.enrollment?.is_enrolled, 'enrolled')}</td>
                              <td className="px-4 py-3 text-center">{getStatusBadge(student.enrollment?.is_trained, 'trained')}</td>
                              <td className="px-4 py-3 text-center">{getStatusBadge(student.enrollment?.is_certified, 'certified')}</td>
                              <td className="px-4 py-3 text-center">{getStatusBadge(student.enrollment?.is_placed, 'placed')}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{student.mobile_number || 'N/A'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, students.length)} of {students.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded border disabled:opacity-50"
                        >
                          <FaChevronLeft />
                        </button>
                        <span className="px-3 py-2 text-sm">Page {currentPage} of {totalPages}</span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded border disabled:opacity-50"
                        >
                          <FaChevronRight />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <MdPeople className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Batch Selected</h3>
                <p className="text-gray-500">Select a centre and then a batch to view and manage students</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}