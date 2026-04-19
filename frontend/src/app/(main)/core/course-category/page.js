// app/core/categories/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FaEdit, FaSearch, FaPlus, FaDownload, FaFilter, 
  FaChevronLeft, FaChevronRight, FaTimes, FaEye,
  FaTags, FaInfoCircle, FaLayerGroup
} from 'react-icons/fa';
import { MdDelete, MdOutlineCategory, MdOutlineFileDownload } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CSVLink } from 'react-csv';

export default function CategoryListPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(categories);
    } else {
      const filtered = categories.filter(category => 
        category.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.category_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.course_category_desc?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/core/categories/');
      setCategories(response.data);
      setFilteredData(response.data);
    } catch (err) {
      setError('Failed to load categories data');
      console.error(err);
      toast.error('Failed to load categories data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/core/categories/${deleteId}/`);
      toast.success('Category deleted successfully');
      fetchCategories();
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error(err.response?.data?.error || 'Failed to delete category');
    }
  };

  const getCategoryTypeLabel = (type) => {
    const types = {
      'A': 'A - Long Term (>500hrs)',
      'B': 'B - Short Term (91-500hrs)',
      'C': 'C - Digital Competency (≤90hrs)',
      'D': 'D - NIELIT DLC Courses',
      'E': 'E - NIELIT DLC Exams',
      'F': 'F - Summer Training',
      'G': 'G - Workshop',
      'H': 'H - NSQF',
      'I': 'I - Non-NSQF',
    };
    return types[type] || type;
  };

  const getCategoryColor = (type) => {
    const colors = {
      'A': 'bg-blue-50 text-blue-700 border-blue-200',
      'B': 'bg-blue-50 text-blue-700 border-blue-200',
      'C': 'bg-green-50 text-green-700 border-green-200',
      'D': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'E': 'bg-teal-50 text-teal-700 border-teal-200',
      'F': 'bg-orange-50 text-orange-700 border-orange-200',
      'G': 'bg-amber-50 text-amber-700 border-amber-200',
      'H': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'I': 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // CSV headers and data
  const csvHeaders = [
    { label: 'S. No.', key: 'serial' },
    { label: 'Category Type', key: 'category_type' },
    { label: 'Category Name', key: 'category_name' },
    { label: 'Description', key: 'course_category_desc' },
    { label: 'Created Date', key: 'created_datetime' },
  ];

  const csvData = filteredData.map((category, index) => ({
    serial: index + 1,
    category_type: getCategoryTypeLabel(category.category_type),
    category_name: category.category_name || 'N/A',
    course_category_desc: category.course_category_desc || 'N/A',
    created_datetime: category.created_datetime ? new Date(category.created_datetime).toLocaleDateString() : 'N/A',
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
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
            onClick={fetchCategories}
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
          <h1 className="text-3xl font-bold text-gray-900">Course Categories</h1>
          <p className="mt-2 text-gray-600">Manage and organize course categories</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{categories.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <MdOutlineCategory className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Category Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {new Set(categories.map(c => c.category_type)).size}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <FaLayerGroup className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Descriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {categories.filter(c => c.course_category_desc).length}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <FaInfoCircle className="text-amber-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{categories.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <FaTags className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Search Bar */}
            <div className="w-full lg:w-96">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Search by name, type or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* Actions */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Add Category Button */}
              <Link
                href="/core/course-category/add"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
              >
                <FaPlus />
                Add New Category
              </Link>

              {/* Export CSV Button */}
              {filteredData.length > 0 && (
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`categories_list_${new Date().toISOString().split('T')[0]}.csv`}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  <MdOutlineFileDownload />
                  Export CSV
                </CSVLink>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {searchTerm && (
            <div className="mt-4 flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg">
              <FaFilter className="text-blue-600" />
              <span className="text-blue-700">Filtered by:</span>
              <span className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                "{searchTerm}"
              </span>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-auto"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        {currentItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentItems.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <MdOutlineCategory className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white truncate">
                          {category.category_name || 'Unnamed Category'}
                        </h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-lg border ${getCategoryColor(category.category_type)}`}>
                          {getCategoryTypeLabel(category.category_type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Description */}
                    {category.course_category_desc && (
                      <div className="flex items-start gap-3">
                        <FaInfoCircle className="text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                            {category.course_category_desc}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Created Date */}
                    {category.created_datetime && (
                      <div className="flex items-center gap-2 pt-2 text-xs text-gray-500 border-t border-gray-100">
                        <span>Created: {new Date(category.created_datetime).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowDetailsModal(true);
                        }}
                        className="flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                      >
                        <FaEye className="text-xs" />
                        View
                      </button>
                      <Link
                        href={`/core/course-category/edit/${category.id}`}
                        className="flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-200"
                      >
                        <FaEdit className="text-xs" />
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteId(category.id)}
                        className="flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-rose-200"
                      >
                        <MdDelete className="text-xs" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredData.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredData.length}</span> categories
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border ${
                      currentPage === 1
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FaChevronLeft className="text-sm" />
                  </button>
                  <div className="flex gap-1">
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
                          onClick={() => setCurrentPage(pageNum)}
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
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
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
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <MdOutlineCategory className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `No categories matching "${searchTerm}"` 
                : 'Get started by adding your first category'}
            </p>
            {!searchTerm && (
              <Link
                href="/core/course-category/add"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                <FaPlus /> Add Your First Category
              </Link>
            )}
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailsModal(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <MdOutlineCategory className="text-white text-xl" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Category Details</h2>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Category Name</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedCategory.category_name}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Category Type</p>
                    <span className={`inline-block px-4 py-2 text-sm font-medium rounded-lg border ${getCategoryColor(selectedCategory.category_type)}`}>
                      {getCategoryTypeLabel(selectedCategory.category_type)}
                    </span>
                  </div>

                  {selectedCategory.course_category_desc && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedCategory.course_category_desc}</p>
                      </div>
                    </div>
                  )}

                  {selectedCategory.created_datetime && (
                    <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
                      Created on: {new Date(selectedCategory.created_datetime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex gap-3">
                  <Link
                    href={`/core/course-category/edit/${selectedCategory.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-3 rounded-lg font-medium transition-colors border border-amber-200"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <FaEdit /> Edit Category
                  </Link>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setDeleteId(selectedCategory.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-3 rounded-lg font-medium transition-colors border border-rose-200"
                  >
                    <MdDelete /> Delete Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <MdDelete className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this category? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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