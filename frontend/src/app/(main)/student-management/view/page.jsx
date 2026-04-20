'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FaSearch, FaPlus, FaDownload, FaFilter, FaList, FaThLarge,
  FaSort, FaSortUp, FaSortDown, FaTimes, FaEye, FaEdit, FaTrash,
  FaUserGraduate, FaUsers, FaMoneyBillWave, FaCalendarAlt,
  FaVenusMars, FaChartPie, FaBuilding, FaBookOpen, FaUserCheck,
  FaChevronLeft, FaChevronRight, FaSpinner
} from 'react-icons/fa';
import { MdCategory, MdDelete, MdEmail, MdPhone } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CSVLink } from 'react-csv';

// Import components
import StudentList from '../components/StudentList';
import StudentForm from '../components/StudentForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import StudentDetailsModal from '../components/StudentDetailsModal';



export default function StudentManagementPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [courses, setCourses] = useState([]);
  const [centres, setCentres] = useState([]);
  const [batches, setBatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    centre: '',
    course: '',
    batch: '',
    gender: '',
    category: '',
    payment_status: '',
  });
  
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    key: 'candidate_name',
    direction: 'asc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...students];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(student => 
        student.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registration_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.mobile_number?.includes(searchTerm) ||
        student.email_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.centre) {
      filtered = filtered.filter(student => student.centre === filters.centre);
    }
    if (filters.course) {
      filtered = filtered.filter(student => student.course === filters.course);
    }
    if (filters.batch) {
      filtered = filtered.filter(student => student.batch === filters.batch);
    }
    if (filters.gender) {
      filtered = filtered.filter(student => student.gender === filters.gender);
    }
    if (filters.category) {
      filtered = filtered.filter(student => student.category === filters.category);
    }
    if (filters.payment_status) {
      filtered = filtered.filter(student => student.payment_status === filters.payment_status);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [searchTerm, students, filters, sortConfig]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, coursesRes, centresRes, batchesRes] = await Promise.all([
        api.get('/student-management/students/'),
        api.get('/core/courses/'),
        api.get('/core/centres/'),
        api.get('/core/batches/').catch(() => ({ data: [] }))
      ]);
      
      setStudents(studentsRes.data.students || []);
      setFilteredStudents(studentsRes.data.students || []);
      setCourses(coursesRes.data);
      setCentres(centresRes.data);
      setBatches(batchesRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load student data');
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/student-management/students/statistics/');
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
      batch: '',
      gender: '',
      category: '',
      payment_status: '',
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

  // Student CRUD operations
  const handleAddStudent = () => {
    setEditingStudent(null);
    setShowFormModal(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowFormModal(true);
  };

  const handleDeleteStudent = (student) => {
    setDeletingStudent(student);
  };

  const handleViewStudent = (student) => {
    setViewingStudent(student);
    setShowViewModal(true);
  };

  const handleSaveStudent = async (studentData) => {
    try {
      if (editingStudent) {
        const response = await api.put(`/student-management/students/${editingStudent.id}/`, studentData);
        setStudents(students.map(s => s.id === response.data.id ? response.data : s));
        toast.success('Student updated successfully');
      } else {
        const response = await api.post('/student-management/students/', studentData);
        setStudents([...students, response.data]);
        toast.success('Student created successfully');
      }
      setShowFormModal(false);
      setEditingStudent(null);
      fetchData();
      fetchStatistics();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(error.response?.data?.message || 'Failed to save student');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    
    try {
      await api.delete(`/student-management/students/${deletingStudent.id}/`);
      setStudents(students.filter(s => s.id !== deletingStudent.id));
      toast.success(`Student "${deletingStudent.candidate_name}" deleted successfully`);
      setDeletingStudent(null);
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.error || 'Failed to delete student');
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // CSV data
  const csvHeaders = [
    { label: 'S. No.', key: 'serial' },
    { label: 'Application No', key: 'application_number' },
    { label: 'Registration ID', key: 'registration_id' },
    { label: 'Student Name', key: 'candidate_name' },
    { label: 'Gender', key: 'gender' },
    { label: 'Category', key: 'category' },
    { label: 'Mobile Number', key: 'mobile_number' },
    { label: 'Email', key: 'email_id' },
    { label: 'Course', key: 'course_name' },
    { label: 'Centre', key: 'centre_name' },
    { label: 'Payment Status', key: 'payment_status' },
    { label: 'Application Date', key: 'application_date' },
  ];

  const csvData = filteredStudents.map((student, index) => ({
    serial: index + 1,
    application_number: student.application_number || 'N/A',
    registration_id: student.registration_id || 'N/A',
    candidate_name: student.candidate_name || 'N/A',
    gender: student.gender === 'M' ? 'Male' : 'Female',
    category: student.category || 'N/A',
    mobile_number: student.mobile_number || 'N/A',
    email_id: student.email_id || 'N/A',
    course_name: student.course_name || 'N/A',
    centre_name: student.centre_name || 'N/A',
    payment_status: student.payment_status || 'N/A',
    application_date: student.application_date ? new Date(student.application_date).toLocaleDateString() : 'N/A',
  }));

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // Get unique values for filters
  const uniqueGenders = [...new Set(students.map(s => s.gender).filter(Boolean))];
  const uniqueCategories = [...new Set(students.map(s => s.category).filter(Boolean))];
  const uniquePaymentStatuses = [...new Set(students.map(s => s.payment_status).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
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
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="mt-2 text-gray-600">Manage and monitor all students across centres</p>
        </div>

        {/* Stats Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total_students}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <FaUsers className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active (Paid)</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{statistics.active_students}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <FaUserCheck className="text-green-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{statistics.pending_students}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <FaMoneyBillWave className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Centres</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{centres.length}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <FaBuilding className="text-purple-600 text-xl" />
                </div>
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
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search students by name, application number, mobile..."
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
                onClick={handleAddStudent}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
              >
                <FaPlus />
                Add Student
              </button>

              {filteredStudents.length > 0 && (
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`students_${new Date().toISOString().split('T')[0]}.csv`}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  <FaDownload />
                  Export CSV
                </CSVLink>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Centre</label>
                  <select
                    value={filters.centre}
                    onChange={(e) => handleFilterChange('centre', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Centres</option>
                    {centres.map(centre => (
                      <option key={centre.id} value={centre.id}>
                        {centre.centre_name}
                      </option>
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
                      <option key={course.id} value={course.id}>
                        {course.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Genders</option>
                    {uniqueGenders.map(gender => (
                      <option key={gender} value={gender}>
                        {gender === 'M' ? 'Male' : 'Female'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Status</label>
                  <select
                    value={filters.payment_status}
                    onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    {uniquePaymentStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(searchTerm || activeFilterCount > 0) && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FaFilter className="text-blue-600" />
                    <span className="text-blue-700">Active filters applied</span>
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Student List Component */}
        <StudentList
          students={currentItems}
          viewMode={viewMode}
          onView={handleViewStudent}
          onEdit={handleEditStudent}
          onDelete={handleDeleteStudent}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredStudents.length)}</span>{' '}
              of <span className="font-medium">{filteredStudents.length}</span> students
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
        <StudentForm
          student={editingStudent}
          courses={courses}
          centres={centres}
          batches={batches}
          onSave={handleSaveStudent}
          onClose={() => {
            setShowFormModal(false);
            setEditingStudent(null);
          }}
        />
      )}

      {deletingStudent && (
        <DeleteConfirmModal
          student={deletingStudent}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingStudent(null)}
        />
      )}

      {showViewModal && viewingStudent && (
        <StudentDetailsModal
          student={viewingStudent}
          onClose={() => setShowViewModal(false)}
          onEdit={() => {
            setShowViewModal(false);
            handleEditStudent(viewingStudent);
          }}
        />
      )}

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}