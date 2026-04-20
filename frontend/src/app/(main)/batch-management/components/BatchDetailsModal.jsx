'use client';

import { FaTimes, FaEdit, FaCalendarAlt, FaChalkboardTeacher, FaUsers, FaUserPlus } from 'react-icons/fa';
import { MdLocationOn, MdSchool, MdSchedule } from 'react-icons/md';

export default function BatchDetailsModal({ batch, onClose, onEdit, onAddStudents }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBatchStatus = () => {
    const today = new Date();
    const startDate = new Date(batch.batch_start_date);
    const endDate = new Date(batch.batch_end_date);
    
    if (batch.is_full) return { label: 'Full', color: 'bg-red-100 text-red-700' };
    if (startDate > today) return { label: 'Upcoming', color: 'bg-orange-100 text-orange-700' };
    if (endDate < today) return { label: 'Completed', color: 'bg-purple-100 text-purple-700' };
    if (startDate <= today && endDate >= today) return { label: 'Active', color: 'bg-green-100 text-green-700' };
    return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
  };

  const status = getBatchStatus();
  const displayName = batch.custom_batch_name || batch.batch_name || 'Unnamed Batch';
  const enrollmentPercentage = batch.max_capacity ? (batch.current_enrollment / batch.max_capacity) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <MdSchedule className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-500">{batch.course_name} - {batch.centre_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Batch Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MdSchool className="text-gray-400" />
                <span className="text-gray-600">Course:</span>
                <span className="font-medium">{batch.course_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MdLocationOn className="text-gray-400" />
                <span className="text-gray-600">Centre:</span>
                <span className="font-medium">{batch.centre_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaChalkboardTeacher className="text-gray-400" />
                <span className="text-gray-600">Faculty:</span>
                <span className="font-medium">{batch.faculty_name || 'Not Assigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUsers className="text-gray-400" />
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{batch.current_enrollment} / {batch.max_capacity || 'Unlimited'} students</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400" />
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{formatDate(batch.batch_start_date)} - {formatDate(batch.batch_end_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Capacity Progress */}
          {batch.max_capacity && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Capacity</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Enrollment Progress</span>
                  <span className="font-medium">{Math.round(enrollmentPercentage)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${enrollmentPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {batch.max_capacity - batch.current_enrollment} seats available
                </p>
              </div>
            </div>
          )}

          {/* Students List */}
          {batch.students && batch.students.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Enrolled Students</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">App No.</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Gender</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mobile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {batch.students.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{student.candidate_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{student.application_number || 'N/A'}</td>
                        <td className="px-4 py-2 text-center text-sm">{student.gender === 'M' ? 'Male' : 'Female'}</td>
                        <td className="px-4 py-2 text-center text-sm">{student.category}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{student.mobile_number || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
            <p>Created: {formatDate(batch.created_at)}</p>
            <p>Last Updated: {formatDate(batch.updated_at)}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FaEdit /> Edit Batch
            </button>
            <button
              onClick={onAddStudents}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FaUserPlus /> Add Students
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}