'use client';

import { FaEye, FaEdit, FaTrash, FaCalendarAlt, FaUsers, FaChalkboardTeacher, FaUserPlus, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { MdLocationOn, MdSchool, MdSchedule } from 'react-icons/md';

export default function BatchList({ 
  batches, 
  viewMode, 
  selectedBatches,
  onSelectBatch,
  onSelectAll,
  onView, 
  onEdit, 
  onDelete, 
  onAddStudents,
  getStatusBadgeClass,
  onSort,
  sortConfig,
  getSortIcon
}) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isAllSelected = batches.length > 0 && selectedBatches.size === batches.length;

  if (batches.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <MdSchedule className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No batches found</h3>
        <p className="text-gray-600">Try adjusting your filters or add a new batch</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch) => {
          const displayName = batch.custom_batch_name || batch.batch_name || 'Unnamed Batch';
          const enrollmentPercentage = batch.max_capacity ? (batch.current_enrollment / batch.max_capacity) * 100 : 0;
          const isSelected = selectedBatches.has(batch.id);
          
          return (
            <div key={batch.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 relative">
              {/* Selection Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <button onClick={() => onSelectBatch(batch.id)} className="focus:outline-none">
                  {isSelected ? 
                    <FaCheckSquare className="text-blue-600 text-xl" /> : 
                    <FaSquare className="text-gray-400 text-xl hover:text-gray-500" />
                  }
                </button>
              </div>
              
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-4 border-b border-gray-200 pl-12">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <MdSchedule className="text-blue-600 text-lg" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 truncate" title={displayName}>
                        {displayName}
                      </h3>
                      <p className="text-xs text-gray-500">{batch.course_name} - {batch.centre_name}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeClass(batch.batch_status)}`}>
                    {batch.batch_status || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FaChalkboardTeacher className="text-gray-400" />
                  <span>Faculty: {batch.faculty_name || 'Not Assigned'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FaCalendarAlt className="text-gray-400" />
                  <span>{formatDate(batch.batch_start_date)} - {formatDate(batch.batch_end_date)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FaUsers className="text-gray-400" />
                  <span>Enrolled: {batch.current_enrollment} / {batch.max_capacity || 'Unlimited'}</span>
                </div>

                {/* Progress Bar */}
                {batch.max_capacity && (
                  <div className="mt-2">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${enrollmentPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{Math.round(enrollmentPercentage)}% full</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => onView(batch)}
                    className="flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    title="View Details"
                  >
                    <FaEye className="text-sm" /> View
                  </button>
                  <button
                    onClick={() => onEdit(batch)}
                    className="flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    title="Edit Batch"
                  >
                    <FaEdit className="text-sm" /> Edit
                  </button>
                  <button
                    onClick={() => onAddStudents(batch)}
                    className="flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    title="Add Students"
                  >
                    <FaUserPlus className="text-sm" /> Add
                  </button>
                  <button
                    onClick={() => onDelete(batch)}
                    className="flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    title="Delete Batch"
                  >
                    <FaTrash className="text-sm" /> Del
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // List/Table View with sorting and checkboxes
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden shadow-sm shadow-black">
      <div className="overflow-x-auto ">
        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-blue-800 text-white text-sm font-semibold">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <button onClick={onSelectAll} className="focus:outline-none">
                  {isAllSelected ? 
                    <FaCheckSquare className="text-blue-600 text-xl" /> : 
                    <FaSquare className="text-gray-400 text-xl" />
                  }
                </button>
              </th>
              <th className="px-4 py-3 text-left  uppercase tracking-wider cursor-pointer hover:text-yellow-300" onClick={() => onSort('batch_name')}>
                <div className="flex items-center gap-1">Batch Name {getSortIcon('batch_name')}</div>
              </th>
              <th className="px-4 py-3 text-left  uppercase tracking-wider cursor-pointer hover:text-yellow-300" onClick={() => onSort('course_name')}>
                <div className="flex items-center gap-1">Course {getSortIcon('course_name')}</div>
              </th>
              <th className="px-4 py-3 text-left  uppercase tracking-wider cursor-pointer hover:text-yellow-300" onClick={() => onSort('centre_name')}>
                <div className="flex items-center gap-1">Centre {getSortIcon('centre_name')}</div>
              </th>
              <th className="px-4 py-3 text-left  uppercase tracking-wider cursor-pointer hover:text-yellow-300" onClick={() => onSort('faculty_name')}>
                <div className="flex items-center gap-1">Faculty {getSortIcon('faculty_name')}</div>
              </th>
              <th className="px-4 py-3 text-left  uppercase tracking-wider cursor-pointer hover:text-yellow-300" onClick={() => onSort('batch_start_date')}>
                <div className="flex items-center gap-1">Start Date {getSortIcon('batch_start_date')}</div>
              </th>
              <th className="px-4 py-3 text-left  uppercase tracking-wider cursor-pointer hover:text-yellow-300" onClick={() => onSort('batch_end_date')}>
                <div className="flex items-center gap-1">End Date {getSortIcon('batch_end_date')}</div>
              </th>
              <th className="px-4 py-3 text-center uppercase tracking-wider cursor-pointer hover:text-yellow-300" onClick={() => onSort('current_enrollment')}>
                <div className="flex items-center gap-1 justify-center">Students {getSortIcon('current_enrollment')}</div>
              </th>
              <th className="px-4 py-3 text-center  uppercase tracking-wider cursor-pointer hover:text-yellow-300" onClick={() => onSort('batch_status')}>
                <div className="flex items-center gap-1 justify-center">Status {getSortIcon('batch_status')}</div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium  uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {batches.map((batch) => {
              const displayName = batch.custom_batch_name || batch.batch_name || 'Unnamed Batch';
              const isSelected = selectedBatches.has(batch.id);
              
              return (
                <tr key={batch.id} className="hover:bg-gray-50 transition-colors border-b border-black">
                  <td className="px-4 py-3">
                    <button onClick={() => onSelectBatch(batch.id)} className="focus:outline-none">
                      {isSelected ? 
                        <FaCheckSquare className="text-blue-600" /> : 
                        <FaSquare className="text-gray-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MdSchedule className="text-blue-500" />
                      <span className="text-sm font-bold text-gray-900" title={displayName}>
                        {displayName.length > 30 ? displayName.substring(0, 30) + '...' : displayName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{batch.course_name || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{batch.centre_name || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{batch.faculty_name || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(batch.batch_start_date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(batch.batch_end_date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">
                    {batch.current_enrollment}/{batch.max_capacity || '∞'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeClass(batch.batch_status)}`}>
                      {batch.batch_status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onView(batch)} title="View" className='px-1.5 py-0.5 bg-blue-500 flex gap-1 text-white font-semibold items-center rounded-sm'>View  <FaEye /> </button>
                        <button onClick={() => onEdit(batch)} title="Edit" className='px-1.5 py-0.5 bg-yellow-500 flex gap-1 text-black font-semibold items-center rounded-sm'>Edit  <FaEdit /> </button>
                        <button onClick={() => onAddStudents(batch)} title="Add Students" className='px-1.5 py-0.5 bg-green-500 flex gap-1 text-black font-semibold items-center rounded-sm'>Add Students  <FaUserPlus /> </button>
                        <button onClick={() => onDelete(batch)} title="Delete" className='px-1.5 py-0.5 bg-red-500 flex gap-1 text-white font-semibold items-center rounded-sm'>Delete  <FaTrash /> </button>
             
             
                    </div>
                   </td>
                 </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}