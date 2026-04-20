'use client';

import { FaTimes, FaEdit, FaUserGraduate, FaVenusMars, FaCalendarAlt, FaMoneyBillWave, FaIdCard } from 'react-icons/fa';
import { MdCategory, MdEmail, MdPhone, MdLocationOn, MdSchool } from 'react-icons/md';

export default function StudentDetailsModal({ student, onClose, onEdit }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status) => {
    switch(status?.toUpperCase()) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUserGraduate className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{student.candidate_name}</h2>
              <p className="text-sm text-gray-500">Application No: {student.application_number || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FaVenusMars className="text-gray-400" />
                <span className="text-gray-600">Gender:</span>
                <span className="font-medium">{student.gender === 'M' ? 'Male' : 'Female'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MdCategory className="text-gray-400" />
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{student.category || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400" />
                <span className="text-gray-600">Date of Birth:</span>
                <span className="font-medium">{formatDate(student.date_of_birth)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaIdCard className="text-gray-400" />
                <span className="text-gray-600">ID Card:</span>
                <span className="font-medium">{student.id_card_type} - {student.id_card_number}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MdPhone className="text-gray-400" />
                <span className="text-gray-600">Mobile:</span>
                <span className="font-medium">{student.mobile_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MdEmail className="text-gray-400" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{student.email_id || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <MdLocationOn className="text-gray-400" />
                <span className="text-gray-600">Address:</span>
                <span className="font-medium">{student.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Course Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Course Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MdSchool className="text-gray-400" />
                <span className="text-gray-600">Course:</span>
                <span className="font-medium">{student.course_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaIdCard className="text-gray-400" />
                <span className="text-gray-600">Centre:</span>
                <span className="font-medium">{student.centre_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaIdCard className="text-gray-400" />
                <span className="text-gray-600">Batch:</span>
                <span className="font-medium">{student.batch_name || 'Not Assigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MdSchool className="text-gray-400" />
                <span className="text-gray-600">Qualification:</span>
                <span className="font-medium">{student.qualification || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FaMoneyBillWave className="text-gray-400" />
                <span className="text-gray-600">Application Fee:</span>
                <span className="font-medium">₹{student.application_fee || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(student.payment_status)}`}>
                  {student.payment_status || 'PENDING'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400" />
                <span className="text-gray-600">Application Date:</span>
                <span className="font-medium">{formatDate(student.application_date)}</span>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          {(student.father_name || student.mother_name) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Parent Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.father_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Father's Name:</span>
                    <span className="font-medium">{student.father_name}</span>
                  </div>
                )}
                {student.mother_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Mother's Name:</span>
                    <span className="font-medium">{student.mother_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
            <p>Created: {formatDate(student.created_at)}</p>
            <p>Last Updated: {formatDate(student.updated_at)}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <FaEdit /> Edit Student
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