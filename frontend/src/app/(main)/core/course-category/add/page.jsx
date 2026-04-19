// app/core/categories/add/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaArrowLeft, FaSave, FaTags, FaInfoCircle, 
  FaLayerGroup, FaTimes
} from 'react-icons/fa';
import { MdOutlineCategory } from 'react-icons/md';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '@/lib/api';

export default function AddCategoryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
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
    
    setSubmitting(true);
    const toastId = toast.loading("Adding category...");
    
    try {
      const response = await api.post('/core/categories/', formData);
      
      toast.update(toastId, {
        render: response.data.message || "Category added successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
      
      // Reset form
      setFormData({
        category_type: '',
        category_name: '',
        course_category_desc: ''
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/core/course-category');
      }, 1500);
      
    } catch (error) {
      console.error("Error adding category:", error);
      
      let errorMessage = "Failed to add category";
      
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
      setSubmitting(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Add New Category</h1>
            <p className="mt-2 text-gray-600">Create a new course category for organizing courses</p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <MdOutlineCategory className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Category Information</h2>
                <p className="text-blue-100 text-sm mt-0.5">Fill in the details to create a new course category</p>
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
                  className={`block w-full pl-10 pr-3 py-3 border ${errors.category_type ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 appearance-none`}
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
                  className={`block w-full pl-10 pr-3 py-3 border ${errors.category_name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400`}  
                  value={formData.category_name} 
                  onChange={handleChange} 
                  required 
                  disabled={submitting}
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400 resize-none"  
                  value={formData.course_category_desc} 
                  onChange={handleChange} 
                  disabled={submitting}
                  placeholder="Provide a detailed description of this category, including typical course types, target audience, etc."
                />
              </div>
              <p className="text-xs text-gray-500">Optional but recommended for better organization</p>
            </div>

            {/* Form Footer with Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                <Link
                  href="/core/course-category"
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 text-center"
                >
                  <FaTimes className="inline mr-2" />
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding Category...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <FaSave className="mr-2" />
                      Add Category
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Card */}
        <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">About Course Categories</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Categories help organize courses for better management</li>
                <li>Each category has a unique type code (A through I)</li>
                <li>Categories can have multiple courses associated with them</li>
                <li>Choose the appropriate type based on course duration and nature</li>
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