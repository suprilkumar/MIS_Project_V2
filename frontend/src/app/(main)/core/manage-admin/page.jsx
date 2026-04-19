'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaTimes, 
  FaUserShield, FaUserTie, FaUserCog, FaUser, FaCheckCircle,
  FaTimesCircle, FaFilter, FaChevronLeft, FaChevronRight,
  FaDownload, FaToggleOn, FaToggleOff, FaExclamationTriangle
} from 'react-icons/fa';
import { MdAdminPanelSettings, MdOutlineFileDownload } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CSVLink } from 'react-csv';

export default function AdminListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    // Check if user has permission to view this page
    if (user && !['superadmin', 'coreadmin', 'centreadmin'].includes(user.role)) {
      toast.error("You don't have permission to access this page");
      router.push('/dashboard');
      return;
    }
    
    fetchPermissions();
    fetchAdmins();
  }, [user]);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/auth/check-permissions/');
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/auth/admins/');
      console.log('Admins fetched:', response.data);
      setAdmins(response.data);
      setFilteredAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      
      if (error.response?.status === 403) {
        setError("You don't have permission to view admins");
        toast.error("Access denied. You don't have permission to view admins.");
      } else if (error.response?.status === 401) {
        setError("Please login again");
        toast.error("Session expired. Please login again.");
        router.push('/login');
      } else {
        setError("Failed to load admins. Please try again.");
        toast.error("Failed to load admins");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/auth/admins/${deleteId}/`);
      toast.success('Admin deleted successfully');
      fetchAdmins();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    try {
      const response = await api.post(`/auth/admins/${adminId}/toggle-status/`);
      toast.success(response.data.message);
      fetchAdmins();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update admin status');
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'superadmin': return <FaUserShield className="text-red-600" />;
      case 'coreadmin': return <MdAdminPanelSettings className="text-purple-600" />;
      case 'centreadmin': return <FaUserTie className="text-blue-600" />;
      case 'operator': return <FaUserCog className="text-green-600" />;
      default: return <FaUser className="text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'superadmin': return 'bg-red-100 text-red-800 border-red-200';
      case 'coreadmin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'centreadmin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'operator': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'superadmin': return 'Super Admin';
      case 'coreadmin': return 'Core Admin';
      case 'centreadmin': return 'Centre Admin';
      case 'operator': return 'Operator';
      default: return role;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAdmins.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);

  // CSV Export
  const csvHeaders = [
    { label: 'S.No', key: 'serial' },
    { label: 'Full Name', key: 'full_name' },
    { label: 'Email', key: 'email' },
    { label: 'Contact', key: 'contact' },
    { label: 'Role', key: 'role_label' },
    { label: 'Status', key: 'status' },
    { label: 'Created At', key: 'created_at' },
  ];

  const csvData = filteredAdmins.map((admin, index) => ({
    serial: index + 1,
    full_name: admin.full_name,
    email: admin.email || 'N/A',
    contact: admin.contact || 'N/A',
    role_label: getRoleLabel(admin.role),
    status: admin.is_active ? 'Active' : 'Inactive',
    created_at: new Date(admin.created_at).toLocaleDateString(),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="mt-2 text-gray-600">Manage system administrators and their permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Admins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{admins.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <FaUserShield className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Admins</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {admins.filter(a => a.is_active).length}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Admins</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {admins.filter(a => !a.is_active).length}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <FaTimesCircle className="text-red-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Centre Admins</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {admins.filter(a => a.role === 'centreadmin').length}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <FaUserTie className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="w-full lg:w-96">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email or contact..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-wrap gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="coreadmin">Core Admin</option>
                <option value="centreadmin">Centre Admin</option>
                <option value="operator">Operator</option>
              </select>

              <Link
                href="/core/manage-admin/add"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              >
                <FaPlus /> Add New Admin
              </Link>

              {filteredAdmins.length > 0 && (
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`admins_list_${new Date().toISOString().split('T')[0]}.csv`}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <MdOutlineFileDownload /> Export CSV
                </CSVLink>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || roleFilter !== 'all') && (
            <div className="mt-4 flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg">
              <FaFilter className="text-blue-600" />
              <span className="text-blue-700">Active Filters:</span>
              {searchTerm && (
                <span className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs border border-blue-200">
                  Search: "{searchTerm}"
                </span>
              )}
              {roleFilter !== 'all' && (
                <span className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs border border-blue-200">
                  Role: {getRoleLabel(roleFilter)}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                }}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Assigned Centre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentItems.length > 0 ? (
                  currentItems.map((admin, index) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getRoleColor(admin.role)}`}>
                            {getRoleIcon(admin.role)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{admin.full_name}</p>
                            {admin.email && (
                              <p className="text-xs text-gray-500">{admin.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{admin.contact || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getRoleColor(admin.role)}`}>
                          {getRoleLabel(admin.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {admin.assigned_centre_name || (admin.role === 'centreadmin' ? 'Not Assigned' : '—')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(admin.id, admin.is_active)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            admin.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } transition-colors`}
                        >
                          {admin.is_active ? <FaToggleOn /> : <FaToggleOff />}
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDetailsModal(true);
                            }}
                            className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <Link
                            href={`/core/manage-admin/edit/${admin.id}`}
                            className="text-amber-600 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          {admin.role !== 'superadmin' && (
                            <button
                              onClick={() => setDeleteId(admin.id)}
                              className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <FaUserShield className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p>No admins found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAdmins.length)} of {filteredAdmins.length} admins
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
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
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
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailsModal(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    {getRoleIcon(selectedAdmin.role)}
                  </div>
                  <h2 className="text-xl font-semibold text-white">Admin Details</h2>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-white/80 hover:text-white">
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="text-center pb-4 border-b">
                    <div className={`inline-flex p-4 rounded-full ${getRoleColor(selectedAdmin.role)} mb-3`}>
                      {getRoleIcon(selectedAdmin.role)}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedAdmin.full_name}</h3>
                    <span className={`inline-flex mt-2 px-3 py-1 text-sm font-medium rounded-full border ${getRoleColor(selectedAdmin.role)}`}>
                      {getRoleLabel(selectedAdmin.role)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email Address</p>
                      <p className="text-gray-900 mt-1">{selectedAdmin.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contact Number</p>
                      <p className="text-gray-900 mt-1">{selectedAdmin.contact || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assigned Centre</p>
                      <p className="text-gray-900 mt-1">{selectedAdmin.assigned_centre_name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${selectedAdmin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedAdmin.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created At</p>
                      <p className="text-gray-900 mt-1">{new Date(selectedAdmin.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Login</p>
                      <p className="text-gray-900 mt-1">{selectedAdmin.last_login ? new Date(selectedAdmin.last_login).toLocaleString() : 'Never'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Link
                    href={`/core/manage-admin/edit/${selectedAdmin.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-3 rounded-lg font-medium transition-colors"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <FaEdit /> Edit Admin
                  </Link>
                  {selectedAdmin.role !== 'superadmin' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setDeleteId(selectedAdmin.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      <FaTrash /> Delete Admin
                    </button>
                  )}
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
                  <FaTrash className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this admin? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}