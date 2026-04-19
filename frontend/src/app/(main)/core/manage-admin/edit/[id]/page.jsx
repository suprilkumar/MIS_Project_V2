// app/(main)/core/manage-admin/edit/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaArrowLeft, FaSave, FaUser, FaEnvelope, FaPhone, 
  FaBuilding, FaUserTag, FaTimes, FaInfoCircle
} from 'react-icons/fa';
import { MdAdminPanelSettings } from 'react-icons/md';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '@/lib/api';

export default function EditAdminPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [centres, setCentres] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact: '',
    assigned_centre: ''
  });
  const [originalRole, setOriginalRole] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminRes, centresRes] = await Promise.all([
        api.get(`/auth/admins/${id}/`),
        api.get('/core/centres/')
      ]);
      
      setFormData({
        full_name: adminRes.data.full_name,
        email: adminRes.data.email || '',
        contact: adminRes.data.contact || '',
        assigned_centre: adminRes.data.assigned_centre || ''
      });
      setOriginalRole(adminRes.data.role);
      setCentres(centresRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
      router.push('/core/manage-admin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    if (originalRole === 'centreadmin' && !formData.assigned_centre) {
      newErrors.assigned_centre = 'Centre Admin must be assigned a centre';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    setSubmitting(true);
    const toastId = toast.loading('Updating admin...');
    
    try {
      const submitData = {
        full_name: formData.full_name,
        email: formData.email || null,
        contact: formData.contact || null,
        assigned_centre: formData.assigned_centre || null
      };
      
      await api.put(`/auth/admins/${id}/`, submitData);
      
      toast.update(toastId, {
        render: 'Admin updated successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
      
      setTimeout(() => {
        router.push('/core/manage-admin');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating admin:', error);
      
      let errorMessage = 'Failed to update admin';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const messages = Object.values(error.response.data).flat();
          errorMessage = messages.join(', ');
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }
      
      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 4000
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/core/manage-admin"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4 group"
          >
            <FaArrowLeft className="mr-2 text-sm group-hover:-translate-x-1 transition-transform" />
            Back to Admins
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Admin</h1>
            <p className="mt-2 text-gray-600">Update administrator information</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <MdAdminPanelSettings className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Edit Admin Information</h2>
                <p className="text-amber-100 text-sm mt-0.5">Update the details for this admin</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className={`relative rounded-lg shadow-sm ${errors.full_name ? 'ring-2 ring-red-500' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              {errors.full_name && <p className="text-sm text-red-600">{errors.full_name}</p>}
            </div>

            {/* Email and Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Contact Number</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>

            {/* Centre Assignment (for Centre Admin) */}
            {originalRole === 'centreadmin' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Assign Centre <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg shadow-sm ${errors.assigned_centre ? 'ring-2 ring-red-500' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="assigned_centre"
                    value={formData.assigned_centre}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select a centre</option>
                    {centres.map(centre => (
                      <option key={centre.id} value={centre.id}>
                        {centre.centre_name} - {centre.centre_state}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.assigned_centre && <p className="text-sm text-red-600">{errors.assigned_centre}</p>}
              </div>
            )}

            {/* Role Display (Read-only) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Role</label>
              <div className="relative rounded-lg shadow-sm bg-gray-50">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserTag className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={originalRole === 'superadmin' ? 'Super Admin' : 
                         originalRole === 'coreadmin' ? 'Core Admin' :
                         originalRole === 'centreadmin' ? 'Centre Admin' : 'Operator'}
                  disabled
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500">Role cannot be changed after creation</p>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-end">
              <Link
                href="/core/manage-admin"
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center"
              >
                <FaTimes className="inline mr-2" />
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaSave />
                {submitting ? 'Updating...' : 'Update Admin'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-amber-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-amber-600 text-lg mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Note</h3>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>Role cannot be changed after creation for security reasons</li>
                <li>To change password, admin can use the "Change Password" feature</li>
                <li>Deactivating an admin will prevent them from logging in</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}