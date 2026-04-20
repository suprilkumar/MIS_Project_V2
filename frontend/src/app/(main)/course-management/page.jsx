'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FaEdit, FaSearch, FaBook, FaBuilding, 
  FaPlus, FaDownload, FaFilter, FaList, FaThLarge,
  FaSort, FaSortUp, FaSortDown, FaCalendarAlt,
  FaClock, FaTag, FaInfoCircle, FaChevronLeft, FaChevronRight,
  FaTimes, FaEye, FaChartLine, FaGraduationCap, FaMapMarkerAlt,
  FaSpinner
} from 'react-icons/fa';
import { TbListDetails } from "react-icons/tb";
import { MdDelete, MdCategory, MdSchedule, MdOutlineCategory } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CSVLink } from 'react-csv';

// Import components
import CourseList from './components/CourseList';
import CourseForm from './components/CourseForm';
import DeleteConfirmModal from './components/DeleteConfirmModal';

export default function CourseManagementPage() {
  const { user } = useAuth();
  const [courseData, setCourseData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [courseCategories, setCourseCategories] = useState([]);
  const [centres, setCentres] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    centre: '',
    mode: '',
    status: '',
  });
  
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    key: 'course_name',
    direction: 'asc'
  });

  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter dropdowns
  const uniqueModes = useMemo(() => {
    const modes = new Set(courseData.map(c => c.course_mode).filter(Boolean));
    return Array.from(modes);
  }, [courseData]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(courseData.map(c => c.course_status).filter(Boolean));
    return Array.from(statuses);
  }, [courseData]);

  useEffect(() => {
    fetchCourseData();
    fetchCourseCategories();
    fetchCentres();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...courseData];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(course => 
        course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_centre_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_mode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_scheme?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(course => 
        course.course_category === filters.category || 
        course.course_category_name === filters.category
      );
    }

    if (filters.centre) {
      filtered = filtered.filter(course => 
        course.course_centre === filters.centre || 
        course.course_centre_name === filters.centre
      );
    }

    if (filters.mode) {
      filtered = filtered.filter(course => course.course_mode === filters.mode);
    }

    if (filters.status) {
      filtered = filtered.filter(course => course.course_status === filters.status);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'category') {
          aVal = a.course_category_name || getCategoryName(a.course_category);
          bVal = b.course_category_name || getCategoryName(b.course_category);
        } else if (sortConfig.key === 'centre') {
          aVal = a.course_centre_name || getCentreName(a.course_centre);
          bVal = b.course_centre_name || getCentreName(b.course_centre);
        } else {
          aVal = a[sortConfig.key] || '';
          bVal = b[sortConfig.key] || '';
        }

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, courseData, filters, sortConfig]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/core/courses/');
      setCourseData(response.data);
      setFilteredData(response.data);
    } catch (err) {
      setError('Failed to load course data');
      console.error(err);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseCategories = async () => {
    try {
      const response = await api.get('/core/categories/');
      setCourseCategories(response.data);
    } catch (err) {
      console.error('Error fetching course categories:', err);
    }
  };

  const fetchCentres = async () => {
    try {
      const response = await api.get('/core/centres/');
      setCentres(response.data);
    } catch (err) {
      console.error('Error fetching centres:', err);
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
      category: '',
      centre: '',
      mode: '',
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

  // Course CRUD operations
  const handleAddCourse = () => {
    setEditingCourse(null);
    setShowFormModal(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowFormModal(true);
  };

  const handleDeleteCourse = (course) => {
    setDeletingCourse(course);
  };

  const handleViewCourse = (course) => {
    setViewingCourse(course);
    setShowViewModal(true);
  };

  const handleSaveCourse = async (courseData) => {
    try {
      if (editingCourse) {
        const response = await api.put(`/core/courses/${editingCourse.id}/`, courseData);
        setCourseData(courseData.map(c => c.id === response.data.id ? response.data : c));
        toast.success('Course updated successfully');
      } else {
        const response = await api.post('/core/courses/', courseData);
        setCourseData([...courseData, response.data]);
        toast.success('Course created successfully');
      }
      setShowFormModal(false);
      setEditingCourse(null);
      fetchCourseData();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;
    
    try {
      await api.delete(`/core/courses/${deletingCourse.id}/`);
      setCourseData(courseData.filter(c => c.id !== deletingCourse.id));
      toast.success(`Course "${deletingCourse.course_name}" deleted successfully`);
      setDeletingCourse(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(error.response?.data?.error || 'Failed to delete course');
    }
  };

  // Helper functions
  const getCategoryName = (categoryId) => {
    const category = courseCategories.find(c => c.id === categoryId);
    return category?.category_name || 'N/A';
  };

  const getCentreName = (centreId) => {
    const centre = centres.find(c => c.id === centreId);
    return centre?.centre_name || 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // CSV data
  const csvHeaders = [
    { label: 'S. No.', key: 'serial' },
    { label: 'Course Name', key: 'course_name' },
    { label: 'Category', key: 'category' },
    { label: 'Centre', key: 'centre' },
    { label: 'Mode', key: 'mode' },
    { label: 'Duration (Hours)', key: 'duration' },
    { label: 'Scheme', key: 'scheme' },
    { label: 'Status', key: 'status' },
    { label: 'Start Date', key: 'start_date' },
    { label: 'End Date', key: 'end_date' },
    { label: 'Description', key: 'description' },
  ];

  const csvData = filteredData.map((course, index) => ({
    serial: index + 1,
    course_name: course.course_name || 'N/A',
    category: course.course_category_name || getCategoryName(course.course_category) || 'N/A',
    centre: course.course_centre_name || getCentreName(course.course_centre) || 'N/A',
    mode: course.course_mode || 'N/A',
    duration: course.duration_hours || 'N/A',
    scheme: course.course_scheme || 'N/A',
    status: course.course_status || 'N/A',
    start_date: formatDate(course.start_date),
    end_date: formatDate(course.end_date),
    description: course.course_desc || 'N/A',
  }));

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // Status and mode badge colors
  const getStatusBadgeClass = (status) => {
    switch(status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border border-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'UPCOMING': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'COMPLETED': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border border-red-200';
      case 'HOLD': return 'bg-amber-100 text-amber-700 border border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getModeBadgeClass = (mode) => {
    switch(mode?.toLowerCase()) {
      case 'online': return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
      case 'offline': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'hybrid': return 'bg-purple-100 text-purple-700 border border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

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
                <div className="border-b border-gray-200 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchCourseData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="mt-2 text-gray-600">Manage and monitor all courses across centres</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{courseData.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <FaGraduationCap className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {courseData.filter(c => c.course_status?.toUpperCase() === 'ACTIVE').length}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <FaChartLine className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{courseCategories.length}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <MdOutlineCategory className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Centres</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{centres.length}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <FaMapMarkerAlt className="text-amber-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

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
                  placeholder="Search courses..."
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
                onClick={handleAddCourse}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
              >
                <FaPlus />
                Add Course
              </button>

              {filteredData.length > 0 && (
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`courses_${new Date().toISOString().split('T')[0]}.csv`}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {courseCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>

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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mode</label>
                  <select
                    value={filters.mode}
                    onChange={(e) => handleFilterChange('mode', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Modes</option>
                    {uniqueModes.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(searchTerm || activeFilterCount > 0) && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FaFilter className="text-blue-600" />
                    <span className="text-blue-700">Active filters:</span>
                    {searchTerm && (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                        Search: "{searchTerm}"
                      </span>
                    )}
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

        {/* Course List Component */}
        <CourseList
          courses={currentItems}
          viewMode={viewMode}
          onView={handleViewCourse}
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
          getStatusBadgeClass={getStatusBadgeClass}
          getModeBadgeClass={getModeBadgeClass}
          getCategoryName={getCategoryName}
          getCentreName={getCentreName}
          formatDate={formatDate}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredData.length)}</span>{' '}
              of <span className="font-medium">{filteredData.length}</span> courses
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
        <CourseForm
          course={editingCourse}
          centres={centres}
          categories={courseCategories}
          onSave={handleSaveCourse}
          onClose={() => {
            setShowFormModal(false);
            setEditingCourse(null);
          }}
        />
      )}

      {deletingCourse && (
        <DeleteConfirmModal
          course={deletingCourse}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingCourse(null)}
        />
      )}

      {showViewModal && viewingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Course Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="bg-blue-100 p-4 rounded-full">
                    <FaBook className="text-blue-600 text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Course Name</p>
                    <p className="text-xl font-semibold text-gray-900">{viewingCourse.course_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                    <div className="flex items-center gap-2">
                      <MdCategory className="text-gray-400" />
                      <p className="text-gray-900">{viewingCourse.course_category_name || getCategoryName(viewingCourse.course_category)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Centre</p>
                    <div className="flex items-center gap-2">
                      <FaBuilding className="text-gray-400" />
                      <p className="text-gray-900">{viewingCourse.course_centre_name || getCentreName(viewingCourse.course_centre)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Mode</p>
                    <span className={`inline-block text-sm px-3 py-1.5 rounded-lg ${getModeBadgeClass(viewingCourse.course_mode)}`}>
                      {viewingCourse.course_mode || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Duration</p>
                    <p className="text-gray-900">{viewingCourse.duration_hours ? `${viewingCourse.duration_hours} hours` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                    <span className={`inline-block text-sm px-3 py-1.5 rounded-lg ${getStatusBadgeClass(viewingCourse.course_status)}`}>
                      {viewingCourse.course_status || 'N/A'}
                    </span>
                  </div>
                </div>

                {viewingCourse.course_scheme && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Scheme</p>
                    <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                      {viewingCourse.course_scheme}
                    </p>
                  </div>
                )}

                {viewingCourse.course_fees && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Course Fees</p>
                    <p className="text-gray-900">₹{viewingCourse.course_fees}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {viewingCourse.course_desc || 'No description provided'}
                    </p>
                  </div>
                </div>

                {viewingCourse.created_at && (
                  <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
                    Created: {new Date(viewingCourse.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditCourse(viewingCourse);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-3 rounded-lg font-medium transition-colors border border-amber-200"
                >
                  <FaEdit /> Edit Course
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteCourse(viewingCourse);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-3 rounded-lg font-medium transition-colors border border-rose-200"
                >
                  <MdDelete /> Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>
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