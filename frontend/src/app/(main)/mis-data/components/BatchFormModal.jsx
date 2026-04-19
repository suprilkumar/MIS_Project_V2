"use client";

import { useState } from "react";
import { FaTimes, FaCalendarAlt, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";  // Add this import

export default function BatchFormModal({ batchPreview, selectedCount, onSubmit, onClose, submitting }) {
    const [batchInfo, setBatchInfo] = useState({
        custom_batch_name: "",
        batch_start_date: "",
        batch_end_date: ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!batchInfo.batch_start_date || !batchInfo.batch_end_date) {
            toast.error("Please select batch start and end dates");
            return;
        }
        
        if (new Date(batchInfo.batch_start_date) > new Date(batchInfo.batch_end_date)) {
            toast.error("Start date cannot be after end date");
            return;
        }
        
        onSubmit(batchInfo);
    };

    // Auto-generate batch name preview
    const getAutoBatchName = () => {
        if (!batchPreview) return "Batch Name";
        const monthYear = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
        return `${batchPreview.centre.name} - ${batchPreview.course.name} - ${monthYear}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Create Training Batch</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Batch Preview Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-800 mb-2">Batch Summary</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Centre:</span>
                                <p className="font-semibold">{batchPreview?.centre.name}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Course:</span>
                                <p className="font-semibold">{batchPreview?.course.name}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Students:</span>
                                <p className="font-semibold">{selectedCount}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Auto-generated Name:</span>
                                <p className="font-semibold text-sm">{getAutoBatchName()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Custom Batch Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Batch Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={batchInfo.custom_batch_name}
                            onChange={(e) => setBatchInfo(prev => ({ ...prev, custom_batch_name: e.target.value }))}
                            placeholder="e.g., Summer Batch 2026 - Section A"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty to use auto-generated name
                        </p>
                    </div>

                    {/* Batch Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Batch Start Date <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    value={batchInfo.batch_start_date}
                                    onChange={(e) => setBatchInfo(prev => ({ ...prev, batch_start_date: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
                                    value={batchInfo.batch_end_date}
                                    onChange={(e) => setBatchInfo(prev => ({ ...prev, batch_end_date: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> Once created, students will be enrolled in this batch. 
                            You can manage batch details later from the course management section.
                        </p>
                    </div>

                    {/* Action Buttons */}
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
                            disabled={submitting}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <><FaSpinner className="animate-spin" /> Creating...</>
                            ) : (
                                <>Create Batch</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}