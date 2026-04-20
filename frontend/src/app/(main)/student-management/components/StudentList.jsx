'use client';

import { FaEye, FaEdit, FaTrash, FaUserGraduate, FaVenusMars, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import { MdCategory, MdEmail, MdPhone } from 'react-icons/md';

export default function StudentList({ students, viewMode, onView, onEdit, onDelete }) {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <FaUserGraduate className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No students found</h3>
        <p className="text-gray-600">Try adjusting your filters or add a new student</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <div key={student.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaUserGraduate className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.candidate_name || 'N/A'}</h3>
                    <p className="text-xs text-gray-500">App No: {student.application_number || 'N/A'}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentStatusBadge(student.payment_status)}`}>
                  {student.payment_status || 'N/A'}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <FaVenusMars className="text-gray-400" />
                  <span>{student.gender === 'M' ? 'Male' : 'Female'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdCategory className="text-gray-400" />
                  <span>{student.category || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MdPhone className="text-gray-400" />
                <span>{student.mobile_number || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm truncate">
                <MdEmail className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{student.email_id || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <FaCalendarAlt className="text-gray-400" />
                <span>Applied: {formatDate(student.application_date)}</span>
              </div>

              <div className="pt-2 text-xs text-gray-500">
                <p>Course: {student.course_name || 'N/A'}</p>
                <p>Centre: {student.centre_name || 'N/A'}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => onView(student)}
                  className="flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaEye className="text-sm" /> View
                </button>
                <button
                  onClick={() => onEdit(student)}
                  className="flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaEdit className="text-sm" /> Edit
                </button>
                <button
                  onClick={() => onDelete(student)}
                  className="flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaTrash className="text-sm" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List/Table View
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-800 text-white font-semibold text-sm">
            <tr>
              <th className="px-6 py-3 text-left  uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-3 text-left  uppercase tracking-wider text-nowrap">App No.</th>
              <th className="px-6 py-3 text-left  uppercase tracking-wider">Gender</th>
              <th className="px-6 py-3 text-left  uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left  uppercase tracking-wider">Mobile</th>
              <th className="px-6 py-3 text-left  uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left  uppercase tracking-wider">Centre</th>
              <th className="px-6 py-3 text-left  uppercase tracking-wider">Payment</th>
              <th className="px-6 py-3 text-right  uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors border-b border-black">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FaUserGraduate className="text-blue-600 text-sm" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{student.candidate_name || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{student.application_number || 'N/A'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{student.gender === 'M' ? 'Male' : 'Female'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{student.category || 'N/A'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{student.mobile_number || 'N/A'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{student.course_name || 'N/A'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{student.centre_name || 'N/A'}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentStatusBadge(student.payment_status)}`}>
                    {student.payment_status || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onView(student)} title="View" className='px-1.5 py-0.5 bg-blue-600 flex gap-1 text-white font-semibold items-center rounded-sm'>View <FaEye /> </button>
                    <button onClick={() => onEdit(student)} title="Edit" className='px-1.5 py-0.5 bg-yellow-500 flex gap-1 text-black font-semibold items-center rounded-sm'>Edit <FaEdit /> </button>
                    <button onClick={() => onDelete(student)} title="Delete" className='px-1.5 py-0.5 bg-red-700 flex gap-1 text-white font-semibold items-center rounded-sm'>Delete <FaTrash /> </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}