// app/core/categories/edit/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaArrowLeft, FaSave, FaTags, FaInfoCircle, 
  FaLayerGroup, FaTimes
} from 'react-icons/fa';
import { MdOutlineCategory } from 'react-icons/md';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '@/lib/api';

export default function EditCategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    category_type: '',
    category_name: '',
    course_category_desc: ''
  });
  const [errors, setErrors] = useState({});

  const categoryTypes = [
    { value: 'A', label: 'A - Long Term (>500hrs)', description: 'Courses with duration more than 500 hours' },
    { value: 'B', label: 'B - Short Term (91-500hrs)', description: 'Courses with duration between 91-500 hours' },
    { value: 'C', label: 'C - Digital Competency (≤90hrs)', description: 'Digital competency courses up to 90 hours' },
    { value: 'D', label: 'D - NIELIT DLC Courses', description: 'NIELIT Digital Learning Courses' },
    { value: 'E', label: 'E - NIELIT DLC Exams', description: 'NIELIT Digital Learning Exams' },
    { value: 'F', label: 'F - Summer Training', description: 'Summer training programs' },
    { value: 'G', label: 'G - Workshop', description: 'Workshop programs' },
    { value: 'H', label: 'H - NSQF', description: 'National Skills Qualifications Framework courses' },
    { value: 'I', label: 'I - Non-NSQF', description: 'Non-NSQF courses' },
  ];

  useEffect(() => {
    if (id) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/core/categories/${id}/`);
      
      setFormData({
        category_type: response.data.category_type || '',
        category_name: response.data.category_name || '',
        course_category_desc: response.data.course_category_desc || ''
      });
    } catch (error) {
      console.error('Fetch Error:', error);
      setError('Failed to load category data');
      toast.error('Failed to load category data');
      setTimeout(() => {
        router.push('/core/categories');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.category_type) {
      newErrors.category_type = "Please select a category type";
    }
    if (!formData.category_name.trim()) {
      newErrors.category_name = "Category name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    
    setSaving(true);
    const toastId = toast.loading("Updating category...");
    
    try {
      const response = await api.put(`/core/categories/${id}/`, formData);
      
      toast.update(toastId, {
        render: response.data.message || "Category updated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
      
      setTimeout(() => {
        router.push('/core/categories');
      }, 1500);
      
    } catch (error) {
      console.error("Update Error:", error);
      
      let errorMessage = "Failed to update category";
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join(', ');
          errorMessage = fieldErrors || error.response.data.message || errorMessage;
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }
      
      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 4000
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading category data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/core/course-category"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <FaArrowLeft /> Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Link 
            href="/core/course-category"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4 group"
          >
            <FaArrowLeft className="mr-2 text-sm group-hover:-translate-x-1 transition-transform" />
            Back to Categories
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
            <p className="mt-2 text-gray-600">Update the category information below</p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <MdOutlineCategory className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Edit Category Information</h2>
                <p className="text-amber-100 text-sm mt-0.5">Update the details for this category</p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Category Type */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Category Type <span className="text-red-500">*</span>
              </label>
              <div className={`relative rounded-lg shadow-sm ${errors.category_type ? 'ring-2 ring-red-500' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLayerGroup className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="category_type"
                  value={formData.category_type}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${errors.category_type ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition duration-200 text-gray-900 appearance-none`}
                >
                  <option value="">Select category type</option>
                  {categoryTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category_type && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FaInfoCircle className="text-xs" /> {errors.category_type}
                </p>
              )}
              {formData.category_type && (
                <p className="text-xs text-gray-500">
                  {categoryTypes.find(t => t.value === formData.category_type)?.description}
                </p>
              )}
            </div>

            {/* Category Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Category Name <span className="text-red-500">*</span>
              </label>
              <div className={`relative rounded-lg shadow-sm ${errors.category_name ? 'ring-2 ring-red-500' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaTags className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="category_name" 
                  className={`block w-full pl-10 pr-3 py-3 border ${errors.category_name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400`}  
                  value={formData.category_name} 
                  onChange={handleChange} 
                  required 
                  disabled={saving}
                  placeholder="e.g., Professional Certification Courses"
                />
              </div>
              {errors.category_name && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FaInfoCircle className="text-xs" /> {errors.category_name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                  <FaInfoCircle className="h-5 w-5 text-gray-400" />
                </div>
                <textarea 
                  name="course_category_desc" 
                  rows="4"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400 resize-none"  
                  value={formData.course_category_desc} 
                  onChange={handleChange} 
                  disabled={saving}
                  placeholder="Provide a detailed description of this category"
                />
              </div>
              <p className="text-xs text-gray-500">Optional but recommended for better organization</p>
            </div>

            {/* Form Footer with Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                <Link
                  href="/core/course-category"
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 text-center"
                >
                  <FaTimes className="inline mr-2" />
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={saving}
                  className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 ${
                    saving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating Category...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <FaSave className="mr-2" />
                      Update Category
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Card */}
        <div className="mt-6 bg-amber-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-amber-600 text-lg mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Important Information</h3>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>Changing category type may affect how courses are displayed</li>
                <li>Category name should be unique and descriptive</li>
                <li>Description helps users understand what courses belong to this category</li>
                <li>Changes will be reflected immediately in all associated courses</li>
              </ul>
            </div>
          </div>
        </div>
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