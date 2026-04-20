'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FaSearch, FaPlus, FaDownload, FaFilter, FaList, FaThLarge,
  FaSort, FaSortUp, FaSortDown, FaTimes, FaEye, FaEdit, FaTrash,
  FaCalendarAlt, FaUsers, FaChalkboardTeacher, FaBuilding,
  FaBookOpen, FaClock, FaChevronLeft, FaChevronRight, FaSpinner,
  FaUserGraduate, FaCheckCircle, FaHourglassHalf, FaChartLine,
  FaCheckSquare, FaSquare, FaCheckDouble
} from 'react-icons/fa';
import { MdDelete, MdSchedule, MdPeople, MdLocationOn } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CSVLink } from 'react-csv';

// Import components
import BatchList from '../components/BatchList';
import BatchForm from '../components/BatchForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import BatchDetailsModal from '../components/BatchDetailsModal';
import AddStudentsModal from '../components/AddStudentsModal';

export default function BatchManagementPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [courses, setCourses] = useState([]);
  const [centres, setCentres] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [statistics, setStatistics] = useState(null);
  
  // Selection state for bulk operations
  const [selectedBatches, setSelectedBatches] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [showBulkStatusDropdown, setShowBulkStatusDropdown] = useState(false);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(null);
  const [viewingBatch, setViewingBatch] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [selectedBatchForStudents, setSelectedBatchForStudents] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    centre: '',
    course: '',
    batch_status: '',
    status: '',
  });
  
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    key: 'batch_name',
    direction: 'asc'
  });

  const [showFilters, setShowFilters] = useState(false);

  // Status options
  const batchStatusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
    { value: 'COMPLETED', label: 'Completed', color: 'blue' },
    { value: 'UPCOMING', label: 'Upcoming', color: 'orange' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
    { value: 'HOLD', label: 'Hold', color: 'yellow' },
  ];

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...batches];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(batch => 
        batch.batch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.custom_batch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.centre_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.centre) {
      filtered = filtered.filter(batch => batch.centre === filters.centre);
    }
    if (filters.course) {
      filtered = filtered.filter(batch => batch.course === filters.course);
    }
    if (filters.batch_status) {
      filtered = filtered.filter(batch => batch.batch_status === filters.batch_status);
    }
    if (filters.status) {
      const today = new Date();
      if (filters.status === 'date_active') {
        filtered = filtered.filter(batch => 
          new Date(batch.batch_start_date) <= today && new Date(batch.batch_end_date) >= today
        );
      } else if (filters.status === 'upcoming') {
        filtered = filtered.filter(batch => new Date(batch.batch_start_date) > today);
      } else if (filters.status === 'completed') {
        filtered = filtered.filter(batch => new Date(batch.batch_end_date) < today);
      } else if (filters.status === 'full') {
        filtered = filtered.filter(batch => batch.is_full);
      }
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';
        
        if (sortConfig.key === 'batch_status') {
          aVal = a.batch_status || '';
          bVal = b.batch_status || '';
        }
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredBatches(filtered);
    setCurrentPage(1);
  }, [searchTerm, batches, filters, sortConfig]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, coursesRes, centresRes, studentsRes] = await Promise.all([
        api.get('/batch-management/batches/'),
        api.get('/core/courses/'),
        api.get('/core/centres/'),
        api.get('/student-management/students/')
      ]);
      
      setBatches(batchesRes.data.batches || []);
      setFilteredBatches(batchesRes.data.batches || []);
      setCourses(coursesRes.data);
      setCentres(centresRes.data);
      setStudents(studentsRes.data.students || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load batch data');
      toast.error('Failed to load batch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/batch-management/batches/statistics/');
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      centre: '',
      course: '',
      batch_status: '',
      status: '',
    });
    setSearchTerm('');
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="text-blue-600" /> : 
      <FaSortDown className="text-blue-600" />;
  };

  // Batch selection handlers
  const handleSelectBatch = (batchId) => {
    const newSelected = new Set(selectedBatches);
    if (newSelected.has(batchId)) {
      newSelected.delete(batchId);
    } else {
      newSelected.add(batchId);
    }
    setSelectedBatches(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBatches.size === currentItems.length) {
      setSelectedBatches(new Set());
    } else {
      setSelectedBatches(new Set(currentItems.map(b => b.id)));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedBatches.size === 0) {
      toast.error('Please select at least one batch');
      return;
    }
    
    if (!bulkStatus) {
      toast.error('Please select a status');
      return;
    }
    
    try {
      const response = await api.post('/batch-management/batches/bulk-update-status/', {
        batch_ids: Array.from(selectedBatches),
        batch_status: bulkStatus
      });
      
      toast.success(response.data.message);
      setSelectedBatches(new Set());
      setBulkStatus('');
      setShowBulkStatusDropdown(false);
      fetchData();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating batch status:', error);
      toast.error(error.response?.data?.error || 'Failed to update batch status');
    }
  };

  // Batch CRUD operations
  const handleAddBatch = () => {
    setEditingBatch(null);
    setShowFormModal(true);
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setShowFormModal(true);
  };

  const handleDeleteBatch = (batch) => {
    setDeletingBatch(batch);
  };

  const handleViewBatch = (batch) => {
    setViewingBatch(batch);
    setShowViewModal(true);
  };

  const handleAddStudents = (batch) => {
    setSelectedBatchForStudents(batch);
    setShowAddStudentsModal(true);
  };

  const handleSaveBatch = async (batchData) => {
    try {
      if (editingBatch) {
        const response = await api.put(`/batch-management/batches/${editingBatch.id}/`, batchData);
        setBatches(batches.map(b => b.id === response.data.id ? response.data : b));
        toast.success('Batch updated successfully');
      } else {
        const response = await api.post('/batch-management/batches/', batchData);
        setBatches([...batches, response.data]);
        toast.success('Batch created successfully');
      }
      setShowFormModal(false);
      setEditingBatch(null);
      fetchData();
      fetchStatistics();
    } catch (error) {
      console.error('Error saving batch:', error);
      toast.error(error.response?.data?.message || 'Failed to save batch');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBatch) return;
    
    try {
      await api.delete(`/batch-management/batches/${deletingBatch.id}/`);
      setBatches(batches.filter(b => b.id !== deletingBatch.id));
      toast.success(`Batch deleted successfully`);
      setDeletingBatch(null);
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error(error.response?.data?.error || 'Failed to delete batch');
    }
  };

  const handleAddStudentsToBatch = async (batchId, studentIds) => {
    try {
      const response = await api.post(`/batch-management/batches/${batchId}/add-students/`, {
        student_ids: studentIds
      });
      toast.success(response.data.message);
      fetchData();
      fetchStatistics();
    } catch (error) {
      console.error('Error adding students:', error);
      toast.error(error.response?.data?.error || 'Failed to add students');
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBatches.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // CSV data
  const csvHeaders = [
    { label: 'S. No.', key: 'serial' },
    { label: 'Batch Name', key: 'batch_name' },
    { label: 'Custom Name', key: 'custom_batch_name' },
    { label: 'Course', key: 'course_name' },
    { label: 'Centre', key: 'centre_name' },
    { label: 'Faculty', key: 'faculty_name' },
    { label: 'Start Date', key: 'batch_start_date' },
    { label: 'End Date', key: 'batch_end_date' },
    { label: 'Status', key: 'batch_status' },
    { label: 'Max Capacity', key: 'max_capacity' },
    { label: 'Enrolled Students', key: 'current_enrollment' },
  ];

  const csvData = filteredBatches.map((batch, index) => ({
    serial: index + 1,
    batch_name: batch.batch_name || 'N/A',
    custom_batch_name: batch.custom_batch_name || 'N/A',
    course_name: batch.course_name || 'N/A',
    centre_name: batch.centre_name || 'N/A',
    faculty_name: batch.faculty_name || 'N/A',
    batch_start_date: batch.batch_start_date ? new Date(batch.batch_start_date).toLocaleDateString() : 'N/A',
    batch_end_date: batch.batch_end_date ? new Date(batch.batch_end_date).toLocaleDateString() : 'N/A',
    batch_status: batch.batch_status || 'N/A',
    max_capacity: batch.max_capacity || 'N/A',
    current_enrollment: batch.current_enrollment || 0,
  }));

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'INACTIVE': return 'bg-gray-100 text-gray-700';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700';
      case 'UPCOMING': return 'bg-orange-100 text-orange-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'HOLD': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Loading skeletons... */}
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="w-full lg:w-96 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex gap-3">
                <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Batch Management</h1>
          <p className="mt-2 text-gray-600">Manage and monitor all training batches across centres</p>
        </div>

        {/* Stats Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_batches}</p>
                </div>
                <MdSchedule className="text-blue-500 text-xl" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.active_status_count}</p>
                </div>
                <FaCheckCircle className="text-green-500 text-xl" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Upcoming</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.upcoming_status_count}</p>
                </div>
                <FaHourglassHalf className="text-orange-500 text-xl" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.completed_status_count}</p>
                </div>
                <FaChartLine className="text-purple-500 text-xl" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">On Hold</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.hold_status_count || 0}</p>
                </div>
                <FaClock className="text-yellow-500 text-xl" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Full</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.full_batches}</p>
                </div>
                <FaUsers className="text-red-500 text-xl" />
              </div>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <FaFilter className="text-sm" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaThLarge /> Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FaList /> List
                </button>
              </div>

              <button
                onClick={handleAddBatch}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <FaPlus /> Add Batch
              </button>

              {filteredBatches.length > 0 && (
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`batches_${new Date().toISOString().split('T')[0]}.csv`}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaDownload /> Export CSV
                </CSVLink>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Centre</label>
                  <select
                    value={filters.centre}
                    onChange={(e) => handleFilterChange('centre', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Centres</option>
                    {centres.map(centre => (
                      <option key={centre.id} value={centre.id}>{centre.centre_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
                  <select
                    value={filters.course}
                    onChange={(e) => handleFilterChange('course', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.course_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Batch Status</label>
                  <select
                    value={filters.batch_status}
                    onChange={(e) => handleFilterChange('batch_status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    {batchStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="date_active">Date Active</option>
                    <option value="upcoming">Date Upcoming</option>
                    <option value="completed">Date Completed</option>
                    <option value="full">Full Capacity</option>
                  </select>
                </div>
              </div>
              {(searchTerm || activeFilterCount > 0) && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FaFilter className="text-blue-600" />
                    <span className="text-blue-700">Active filters applied</span>
                  </div>
                  <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 font-medium">
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedBatches.size > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <FaCheckDouble className="text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">
                {selectedBatches.size} batch{selectedBatches.size !== 1 ? 'es' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Change Status to...</option>
                  {batchStatusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Apply Status
              </button>
              <button
                onClick={() => setSelectedBatches(new Set())}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Batch List Component */}
        <BatchList
          batches={currentItems}
          viewMode={viewMode}
          selectedBatches={selectedBatches}
          onSelectBatch={handleSelectBatch}
          onSelectAll={handleSelectAll}
          onView={handleViewBatch}
          onEdit={handleEditBatch}
          onDelete={handleDeleteBatch}
          onAddStudents={handleAddStudents}
          getStatusBadgeClass={getStatusBadgeClass}
          onSort={handleSort}
          sortConfig={sortConfig}
          getSortIcon={getSortIcon}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredBatches.length)}</span>{' '}
              of <span className="font-medium">{filteredBatches.length}</span> batches
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border ${
                  currentPage === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FaChevronLeft className="text-sm" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border ${
                  currentPage === totalPages
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        <BatchForm
          batch={editingBatch}
          courses={courses}
          centres={centres}
          batchStatusOptions={batchStatusOptions}
          onSave={handleSaveBatch}
          onClose={() => {
            setShowFormModal(false);
            setEditingBatch(null);
          }}
        />
      )}

      {deletingBatch && (
        <DeleteConfirmModal
          batch={deletingBatch}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingBatch(null)}
        />
      )}

      {showViewModal && viewingBatch && (
        <BatchDetailsModal
          batch={viewingBatch}
          onClose={() => setShowViewModal(false)}
          onEdit={() => {
            setShowViewModal(false);
            handleEditBatch(viewingBatch);
          }}
          onAddStudents={() => {
            setShowViewModal(false);
            handleAddStudents(viewingBatch);
          }}
          getStatusBadgeClass={getStatusBadgeClass}
        />
      )}

      {showAddStudentsModal && selectedBatchForStudents && (
        <AddStudentsModal
          batch={selectedBatchForStudents}
          students={students.filter(s => !s.batch)}
          onAdd={(studentIds) => handleAddStudentsToBatch(selectedBatchForStudents.id, studentIds)}
          onClose={() => {
            setShowAddStudentsModal(false);
            setSelectedBatchForStudents(null);
          }}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}