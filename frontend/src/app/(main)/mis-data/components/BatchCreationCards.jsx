"use client";

import { useState, useEffect } from "react";
import { FaBuilding, FaBookOpen, FaUsers, FaVenusMars, FaChartPie, FaCalendarAlt, FaSpinner, FaCheckCircle, FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";

export default function BatchCreationCards({ 
    selectedStudentsData, 
    centresList, 
    coursesByCentre,
    onSubmit,
    submitting 
}) {
    const [selectedCentre, setSelectedCentre] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [batchForms, setBatchForms] = useState({});
    const [expandedCards, setExpandedCards] = useState({});

    // Group selected students by centre and course
    const groupedStudents = () => {
        const groups = {};
        
        selectedStudentsData.forEach(student => {
            const centreName = student.course_location;
            const courseName = student.course_applied;
            const key = `${centreName}|${courseName}`;
            
            if (!groups[key]) {
                groups[key] = {
                    centre_name: centreName,
                    course_name: courseName,
                    students: [],
                    centre_id: null,
                    course_id: null,
                    stats: {
                        total: 0,
                        male: 0,
                        female: 0,
                        GEN: 0,
                        SC: 0,
                        ST: 0,
                        OBC: 0
                    }
                };
            }
            
            groups[key].students.push(student);
            groups[key].stats.total++;
            
            // Update gender stats
            if (student.gender === 'M') groups[key].stats.male++;
            if (student.gender === 'F') groups[key].stats.female++;
            
            // Update category stats
            if (student.category === 'GEN') groups[key].stats.GEN++;
            if (student.category === 'SC') groups[key].stats.SC++;
            if (student.category === 'ST') groups[key].stats.ST++;
            if (student.category === 'OBC') groups[key].stats.OBC++;
        });
        
        // Find centre_id and course_id from lists
        Object.values(groups).forEach(group => {
            const centre = centresList.find(c => c.centre_name === group.centre_name);
            if (centre) {
                group.centre_id = centre.id;
                
                // Find course for this centre
                const courses = coursesByCentre[centre.id] || [];
                const course = courses.find(c => c.course_name === group.course_name);
                if (course) {
                    group.course_id = course.id;
                }
            }
        });
        
        return groups;
    };

    const groups = groupedStudents();
    const groupsArray = Object.values(groups);

    // Generate auto batch name based on centre, course, and dates
    const generateAutoBatchName = (group, startDate, endDate) => {
        if (!group) return "Batch Name";
        
        const centreName = group.centre_name;
        const courseName = group.course_name;
        
        if (!startDate || !endDate) {
            // Return name without dates if dates not set
            return `${courseName} - ${centreName}`;
        }
        
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const startMonth = start.toLocaleString('default', { month: 'short', year: 'numeric' });
            const endMonth = end.toLocaleString('default', { month: 'short', year: 'numeric' });
            
            return `${courseName} - ${centreName} (${startMonth} - ${endMonth})`;
        } catch (error) {
            return `${courseName} - ${centreName}`;
        }
    };

    const handleBatchFormChange = (key, field, value) => {
        setBatchForms(prev => {
            const currentForm = prev[key] || {};
            const updatedForm = { ...currentForm, [field]: value };
            
            // Auto-generate batch name when dates change
            if (field === 'batch_start_date' || field === 'batch_end_date') {
                const group = groupsArray.find(g => `${g.centre_name}|${g.course_name}` === key);
                if (group) {
                    const startDate = field === 'batch_start_date' ? value : currentForm.batch_start_date;
                    const endDate = field === 'batch_end_date' ? value : currentForm.batch_end_date;
                    updatedForm.batch_name = generateAutoBatchName(group, startDate, endDate);
                }
            }
            
            return {
                ...prev,
                [key]: updatedForm
            };
        });
    };

    // Initialize form for a group when expanded
    const initializeFormIfNeeded = (key, group) => {
        if (!batchForms[key]) {
            const defaultStartDate = new Date().toISOString().split('T')[0];
            const defaultEndDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            setBatchForms(prev => ({
                ...prev,
                [key]: {
                    batch_name: generateAutoBatchName(group, defaultStartDate, defaultEndDate),
                    custom_batch_name: "",
                    batch_start_date: defaultStartDate,
                    batch_end_date: defaultEndDate
                }
            }));
        }
    };

    const toggleCard = (key) => {
        const isExpanding = !expandedCards[key];
        setExpandedCards(prev => ({
            ...prev,
            [key]: isExpanding
        }));
        
        // Initialize form when expanding
        if (isExpanding) {
            const group = groupsArray.find(g => `${g.centre_name}|${g.course_name}` === key);
            if (group) {
                initializeFormIfNeeded(key, group);
            }
        }
    };

    const handleSubmitBatch = async (key, group) => {
        const formData = batchForms[key];
        
        if (!formData?.batch_start_date || !formData?.batch_end_date) {
            toast.error("Please select batch start and end dates");
            return;
        }
        
        if (new Date(formData.batch_start_date) > new Date(formData.batch_end_date)) {
            toast.error("Start date cannot be after end date");
            return;
        }
        
        if (!group.centre_id || !group.course_id) {
            toast.error("Centre or Course ID not found. Please refresh and try again.");
            return;
        }
        
        const batchRequest = [{
            centre_id: group.centre_id,
            course_id: group.course_id,
            student_ids: group.students.map(s => s.id),
            batch_info: {
                batch_name: formData.batch_name,
                custom_batch_name: formData.custom_batch_name || "",
                batch_start_date: formData.batch_start_date,
                batch_end_date: formData.batch_end_date
            }
        }];
        
        await onSubmit(batchRequest);
    };

    if (groupsArray.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No students selected. Please go back and select students to create batches.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-black">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FaUsers className="text-purple-600" />
                    Batch Creation
                </h2>
                <p className="text-gray-600 mb-6">
                    Create batches for {groupsArray.length} course group(s) with {selectedStudentsData.length} total students
                </p>
                
                <div className="space-y-6">
                    {groupsArray.map((group, index) => {
                        const key = `${group.centre_name}|${group.course_name}`;
                        const formData = batchForms[key] || {};
                        const isExpanded = expandedCards[key] !== false; // Default expanded
                        
                        return (
                            <div key={key} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 transition-all">
                                {/* Card Header */}
                                <div 
                                    className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 cursor-pointer"
                                    onClick={() => toggleCard(key)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <FaBuilding className="text-blue-600 text-xl" />
                                                <h3 className="text-xl font-bold text-gray-900">{group.centre_name}</h3>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <FaBookOpen className="text-purple-600 text-xl" />
                                                <p className="text-lg font-semibold text-gray-800">{group.course_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-green-100 rounded-lg px-4 py-2">
                                                <p className="text-sm text-green-600">Total Students</p>
                                                <p className="text-2xl font-bold text-green-700">{group.stats.total}</p>
                                            </div>
                                            <button className="mt-2 text-gray-500 hover:text-gray-700">
                                                {isExpanded ? '▼' : '▶'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Card Body - Expanded */}
                                {isExpanded && (
                                    <div className="p-6 space-y-6">
                                        {/* Statistics Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Gender Breakdown */}
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                                    <FaVenusMars /> Gender Distribution
                                                </h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span>Male</span>
                                                            <span className="font-semibold">{group.stats.male}</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-blue-500 rounded-full"
                                                                style={{ width: `${(group.stats.male / group.stats.total) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span>Female</span>
                                                            <span className="font-semibold">{group.stats.female}</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-pink-500 rounded-full"
                                                                style={{ width: `${(group.stats.female / group.stats.total) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Category Breakdown */}
                                            <div className="bg-purple-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                                    <FaChartPie /> Category Distribution
                                                </h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['GEN', 'SC', 'ST', 'OBC'].map(cat => (
                                                        <div key={cat}>
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span>{cat}</span>
                                                                <span className="font-semibold">{group.stats[cat]}</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-purple-500 rounded-full"
                                                                    style={{ width: `${(group.stats[cat] / group.stats.total) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Batch Form */}
                                        <div className="border-t border-gray-200 pt-6">
                                            <h4 className="font-semibold text-gray-900 mb-4">Batch Information</h4>
                                            
                                            {/* Auto-generated Batch Name (Read-only) */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Batch Name (Auto-generated)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formData.batch_name || generateAutoBatchName(group, formData.batch_start_date, formData.batch_end_date)}
                                                        readOnly
                                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                                                    />
                                                    <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Format: Course Name - Centre Name (Start Month - End Month)
                                                </p>
                                            </div>
                                            
                                            {/* Custom Batch Name (Editable) */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Custom Batch Name (Optional)
                                                    <span className="text-xs text-gray-500 ml-2">- Override the auto-generated name</span>
                                                </label>
                                                <div className="relative">
                                                    <FaEdit className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.custom_batch_name || ''}
                                                        onChange={(e) => handleBatchFormChange(key, 'custom_batch_name', e.target.value)}
                                                        placeholder={`e.g., Summer Batch 2026 - Section A`}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Leave empty to use the auto-generated name above
                                                </p>
                                            </div>
                                            
                                            {/* Batch Dates */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Batch Start Date <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="date"
                                                            required
                                                            value={formData.batch_start_date || ''}
                                                            onChange={(e) => handleBatchFormChange(key, 'batch_start_date', e.target.value)}
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Batch End Date <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="date"
                                                            required
                                                            value={formData.batch_end_date || ''}
                                                            onChange={(e) => handleBatchFormChange(key, 'batch_end_date', e.target.value)}
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Preview of final batch name */}
                                            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-800 mb-1">Final Batch Name Preview:</p>
                                                <p className="font-semibold text-blue-900">
                                                    {formData.custom_batch_name || formData.batch_name || generateAutoBatchName(group, formData.batch_start_date, formData.batch_end_date)}
                                                </p>
                                            </div>
                                            
                                            {/* Student List Preview */}
                                            <details className="mb-6">
                                                <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                                                    View Student List ({group.students.length} students)
                                                </summary>
                                                <div className="mt-3 max-h-48 overflow-y-auto border rounded-lg">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 sticky top-0">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left">Name</th>
                                                                <th className="px-3 py-2 text-left">App No.</th>
                                                                <th className="px-3 py-2 text-center">Gender</th>
                                                                <th className="px-3 py-2 text-center">Category</th>
                                                                <th className="px-3 py-2 text-center">Payment Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {group.students.map(student => (
                                                                <tr key={student.id} className="border-t border-gray-100">
                                                                    <td className="px-3 py-2">{student.candidate_name}</td>
                                                                    <td className="px-3 py-2 text-gray-600">{student.application_number || '-'}</td>
                                                                    <td className="px-3 py-2 text-center">{student.gender === 'M' ? 'Male' : 'Female'}</td>
                                                                    <td className="px-3 py-2 text-center">{student.category}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                                            student.payment_status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                        }`}>
                                                                            {student.payment_status}
                                                                        </span>
                                                                    </td>
                                                                  </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </details>
                                            
                                            {/* Submit Button */}
                                            <button
                                                onClick={() => handleSubmitBatch(key, group)}
                                                disabled={submitting}
                                                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {submitting ? (
                                                    <><FaSpinner className="animate-spin" /> Creating Batch...</>
                                                ) : (
                                                    <><FaCheckCircle /> Create Batch for {group.course_name}</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}