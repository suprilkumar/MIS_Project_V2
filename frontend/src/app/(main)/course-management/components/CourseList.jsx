'use client';

import { FaEye, FaEdit, FaTrash, FaBook, FaBuilding, FaClock, FaTag, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import { MdCategory, MdSchedule } from 'react-icons/md';
import Link from 'next/link';

export default function CourseList({ 
  courses, 
  viewMode, 
  onView, 
  onEdit, 
  onDelete,
  getStatusBadgeClass,
  getModeBadgeClass,
  getCategoryName,
  getCentreName,
  formatDate
}) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
        <p className="text-gray-600">Try adjusting your filters or add a new course</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200">
            {/* Card Header */}
            <div className="border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <FaBook className="text-blue-600 text-base" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg truncate" title={course.course_name}>
                    {course.course_name || 'Unnamed Course'}
                  </h3>
                </div>
                <span className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium ${getStatusBadgeClass(course.course_status)}`}>
                  {course.course_status || 'N/A'}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Category</p>
                  <div className="flex items-center gap-2">
                    <MdCategory className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {course.course_category_name || getCategoryName(course.course_category)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Centre</p>
                  <div className="flex items-center gap-2">
                    <FaBuilding className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {course.course_centre_name || getCentreName(course.course_centre)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Mode</p>
                  <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-medium ${getModeBadgeClass(course.course_mode)}`}>
                    {course.course_mode || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Duration</p>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {course.duration_hours ? `${course.duration_hours} hours` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {course.course_scheme && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Scheme</p>
                  <div className="flex items-center gap-2">
                    <FaTag className="text-gray-400" />
                    <span className="text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                      {course.course_scheme}
                    </span>
                  </div>
                </div>
              )}

              {course.course_desc && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Description</p>
                  <div className="flex items-start gap-2">
                    <FaInfoCircle className="text-gray-400 mt-1 flex-shrink-0" />
                    <p className="text-sm text-gray-600 line-clamp-2" title={course.course_desc}>
                      {course.course_desc}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => onView(course)}
                  className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                >
                  <FaEye className="text-sm" />
                  View
                </button>
                <button
                  onClick={() => onEdit(course)}
                  className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-200"
                >
                  <FaEdit className="text-sm" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(course)}
                  className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-rose-200"
                >
                  <FaTrash className="text-sm" />
                  Delete
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Centre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <FaBook className="text-blue-600 text-sm" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {course.course_name || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.course_category_name || getCategoryName(course.course_category)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.course_centre_name || getCentreName(course.course_centre)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getModeBadgeClass(course.course_mode)}`}>
                    {course.course_mode || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.duration_hours ? `${course.duration_hours} Hrs` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusBadgeClass(course.course_status)}`}>
                    {course.course_status || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(course)}
                      className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => onEdit(course)}
                      className="text-amber-600 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => onDelete(course)}
                      className="text-rose-600 hover:text-red-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
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