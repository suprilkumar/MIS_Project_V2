"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";

export default function CourseForm({ course, centres, categories, statusOptions, onSave, onClose }) {
    const [formData, setFormData] = useState({
        course_name: "",
        centre: "",
        course_category: "",
        course_desc: "",
        duration_hours: "",
        course_mode: "",
        course_scheme: "",
        course_fees: "",
        course_status: "ACTIVE"
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (course) {
            setFormData({
                course_name: course.course_name || "",
                centre: course.centre || "",
                course_category: course.course_category || "",
                course_desc: course.course_desc || "",
                duration_hours: course.duration_hours || "",
                course_mode: course.course_mode || "",
                course_scheme: course.course_scheme || "",
                course_fees: course.course_fees || "",
                course_status: course.course_status || "ACTIVE"
            });
        }
    }, [course]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.course_name || !formData.centre || !formData.course_category) {
            toast.error("Please fill in all required fields");
            return;
        }
        
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    const modeOptions = [
        { value: "OnCampus", label: "On Campus" },
        { value: "OffCampus", label: "Off Campus" },
        { value: "Online", label: "Online" },
        { value: "Offline", label: "Offline" },
        { value: "Hybrid", label: "Hybrid" },
        { value: "Suspended", label: "Suspended" }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {course ? "Edit Course" : "Add New Course"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="course_name"
                                value={formData.course_name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Enter course name"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Centre <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="centre"
                                value={formData.centre}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="">Select Centre</option>
                                {centres.map(centre => (
                                    <option key={centre.id} value={centre.id}>
                                        {centre.centre_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="course_category"
                                value={formData.course_category}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.category_name} ({cat.category_type})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (Hours)
                            </label>
                            <input
                                type="number"
                                name="duration_hours"
                                value={formData.duration_hours}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Enter duration in hours"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course Mode
                            </label>
                            <select
                                name="course_mode"
                                value={formData.course_mode}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="">Select Mode</option>
                                {modeOptions.map(mode => (
                                    <option key={mode.value} value={mode.value}>
                                        {mode.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course Fees (₹)
                            </label>
                            <input
                                type="number"
                                name="course_fees"
                                value={formData.course_fees}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Enter course fees"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course Scheme
                            </label>
                            <input
                                type="text"
                                name="course_scheme"
                                value={formData.course_scheme}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Enter scheme name"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                name="course_status"
                                value={formData.course_status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="course_desc"
                                value={formData.course_desc}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Enter course description"
                            />
                        </div>
                    </div>
                    
                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {course ? "Update Course" : "Create Course"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}