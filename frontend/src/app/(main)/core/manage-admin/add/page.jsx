// app/(main)/core/manage-admin/add/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaArrowLeft, FaSave, FaUser, FaEnvelope, FaPhone, 
  FaLock, FaBuilding, FaUserTag, FaTimes, FaInfoCircle
} from 'react-icons/fa';
import { MdAdminPanelSettings } from 'react-icons/md';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '@/lib/api';

export default function AddAdminPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [centres, setCentres] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact: '',
    role: '',
    assigned_centre: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRolesAndCentres();
  }, []);

  const fetchRolesAndCentres = async () => {
    try {
      const [rolesRes, centresRes] = await Promise.all([
        api.get('/auth/roles/'),
        api.get('/core/centres/')
      ]);
      setRoles(rolesRes.data);
      setCentres(centresRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
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
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    if (formData.role === 'centreadmin' && !formData.assigned_centre) {
      newErrors.assigned_centre = 'Centre Admin must be assigned a centre';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
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
    const toastId = toast.loading('Creating admin...');
    
    try {
      const submitData = {
        full_name: formData.full_name,
        email: formData.email || null,
        contact: formData.contact || null,
        role: formData.role,
        assigned_centre: formData.assigned_centre || null,
        password: formData.password,
        confirm_password: formData.confirm_password
      };
      
      const response = await api.post('/auth/admins/', submitData);
      
      toast.update(toastId, {
        render: response.data.message || 'Admin created successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
      
      setTimeout(() => {
        router.push('/core/manage-admin');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating admin:', error);
      
      let errorMessage = 'Failed to create admin';
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

  const getRoleDescription = (roleValue) => {
    const role = roles.find(r => r.value === roleValue);
    return role?.description || '';
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Add New Admin</h1>
            <p className="mt-2 text-gray-600">Create a new system administrator with specific role and permissions</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <MdAdminPanelSettings className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Admin Information</h2>
                <p className="text-blue-100 text-sm mt-0.5">Fill in the details to create a new admin</p>
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@example.com"
                  />
                </div>
                <p className="text-xs text-gray-500">Either email or contact is required</p>
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <div className={`relative rounded-lg shadow-sm ${errors.role ? 'ring-2 ring-red-500' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserTag className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              {formData.role && (
                <p className="text-xs text-gray-500">{getRoleDescription(formData.role)}</p>
              )}
              {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
            </div>

            {/* Centre Assignment (for Centre Admin) */}
            {formData.role === 'centreadmin' && (
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg shadow-sm ${errors.password ? 'ring-2 ring-red-500' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg shadow-sm ${errors.confirm_password ? 'ring-2 ring-red-500' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm password"
                  />
                </div>
                {errors.confirm_password && <p className="text-sm text-red-600">{errors.confirm_password}</p>}
              </div>
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
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaSave />
                {submitting ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Role Information</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li><strong>Super Admin</strong> - Full system access (can only be created via backend)</li>
                <li><strong>Core Admin</strong> - Can manage centres and centre admins</li>
                <li><strong>Centre Admin</strong> - Can manage their assigned centre only</li>
                <li><strong>Operator</strong> - Limited operational access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}