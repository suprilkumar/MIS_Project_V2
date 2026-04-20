'use client';

import { useState } from 'react';
import { FaTimes, FaSpinner, FaUserPlus, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function AddStudentsModal({ batch, students, onAdd, onClose }) {
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredStudents = students.filter(student =>
    student.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.mobile_number?.includes(searchTerm)
  );

  const toggleStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }
    
    setLoading(true);
    try {
      await onAdd(Array.from(selectedStudents));
      setSelectedStudents(new Set());
    } finally {
      setLoading(false);
    }
  };

  const batchDisplayName = batch.custom_batch_name || batch.batch_name || 'Unnamed Batch';
  const availableSeats = batch.max_capacity ? batch.max_capacity - batch.current_enrollment : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Students to Batch</h2>
            <p className="text-sm text-gray-500 mt-1">{batchDisplayName}</p>
            {availableSeats !== null && (
              <p className="text-xs text-blue-600 mt-1">{availableSeats} seats available</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, application number, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Student List */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No students available to add
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedStudents.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-500">
                  Selected: {selectedStudents.size} / {filteredStudents.length}
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                          onChange={selectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">App No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Centre</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Gender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.candidate_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.application_number || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.course_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.centre_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-center text-sm">{student.gender === 'M' ? 'Male' : 'Female'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedStudents.size === 0}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
              Add {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}