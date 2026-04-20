'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaSave, FaCalendarAlt, FaChalkboardTeacher, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function BatchForm({ batch, courses, centres, batchStatusOptions, onSave, onClose }) {
  const [formData, setFormData] = useState({
    course: '',
    centre: '',
    batch_name: '',
    custom_batch_name: '',
    batch_start_date: '',
    batch_end_date: '',
    batch_status: 'ACTIVE',
    faculty_name: '',
    max_capacity: 30,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (batch) {
      setFormData({
        course: batch.course || '',
        centre: batch.centre || '',
        batch_name: batch.batch_name || '',
        custom_batch_name: batch.custom_batch_name || '',
        batch_start_date: batch.batch_start_date || '',
        batch_end_date: batch.batch_end_date || '',
        batch_status: batch.batch_status || 'ACTIVE',
        faculty_name: batch.faculty_name || '',
        max_capacity: batch.max_capacity || 30,
      });
    }
  }, [batch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateAutoBatchName = () => {
    const course = courses.find(c => c.id === formData.course);
    const centre = centres.find(c => c.id === formData.centre);
    const startDate = formData.batch_start_date ? new Date(formData.batch_start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
    const endDate = formData.batch_end_date ? new Date(formData.batch_end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
    
    if (course && centre && startDate && endDate) {
      return `${course.course_name} - ${centre.centre_name} (${startDate} - ${endDate})`;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.course || !formData.centre) {
      toast.error('Please select course and centre');
      return;
    }
    
    if (!formData.batch_start_date || !formData.batch_end_date) {
      toast.error('Please select batch start and end dates');
      return;
    }
    
    if (new Date(formData.batch_start_date) > new Date(formData.batch_end_date)) {
      toast.error('Start date cannot be after end date');
      return;
    }
    
    // Auto-generate batch name if not provided
    const submitData = { ...formData };
    if (!submitData.batch_name && !submitData.custom_batch_name) {
      submitData.batch_name = generateAutoBatchName();
    }
    
    setLoading(true);
    try {
      await onSave(submitData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {batch ? 'Edit Batch' : 'Create New Batch'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.course_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centre *</label>
              <select
                name="centre"
                value={formData.centre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Centre</option>
                {centres.map(centre => (
                  <option key={centre.id} value={centre.id}>{centre.centre_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Status</label>
              <select
                name="batch_status"
                value={formData.batch_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {batchStatusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
              <div className="relative">
                <FaUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="max_capacity"
                  value={formData.max_capacity}
                  onChange={handleChange}
                  min="1"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
              <input
                type="text"
                name="batch_name"
                value={formData.batch_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Auto-generated if left empty"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Batch Name</label>
              <input
                type="text"
                name="custom_batch_name"
                value={formData.custom_batch_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Optional display name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                name="batch_start_date"
                value={formData.batch_start_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                name="batch_end_date"
                value={formData.batch_end_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
              <div className="relative">
                <FaChalkboardTeacher className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="faculty_name"
                  value={formData.faculty_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter faculty name"
                />
              </div>
            </div>
          </div>

          {formData.course && formData.centre && formData.batch_start_date && formData.batch_end_date && !formData.batch_name && !formData.custom_batch_name && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">Auto-generated batch name will be:</p>
              <p className="text-sm font-medium text-blue-800">{generateAutoBatchName()}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {batch ? 'Update Batch' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}