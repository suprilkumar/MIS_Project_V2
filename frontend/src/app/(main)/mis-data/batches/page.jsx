"use client";

import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaChevronRight, FaBuilding, FaBookOpen,
    FaSpinner, FaUsers, FaArrowLeft, FaCalendarAlt,
    FaVenusMars, FaChartPie, FaCheckCircle, FaClock,
    FaCheck, FaUserGraduate, FaPhone, FaEnvelope,
    FaMoneyBillWave, FaIdCard
} from 'react-icons/fa';
import "react-toastify/dist/ReactToastify.css";

export default function BatchCreationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [batchGroups, setBatchGroups] = useState([]);
    const [batchForms, setBatchForms] = useState({});
    const [createdBatches, setCreatedBatches] = useState(new Set());
    const [expandedGroups, setExpandedGroups] = useState({});
    const [selectedGroup, setSelectedGroup] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get("/mis-data/students/saved/");
            
            if (response.data && response.data.groups) {
                setBatchGroups(response.data.groups);
            } else {
                setBatchGroups([]);
                toast.info("No students found. Please upload and save student data first.");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(error.response?.data?.error || "Failed to load data");
            setBatchGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBatchFormChange = (groupId, field, value) => {
        setBatchForms(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                [field]: value
            }
        }));
    };

    const generateAutoBatchName = (group, startDate, endDate) => {
        if (!startDate || !endDate) {
            return `${group.course_name} - ${group.centre_name}`;
        }
        
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const startMonth = start.toLocaleString('default', { month: 'short', year: 'numeric' });
            const endMonth = end.toLocaleString('default', { month: 'short', year: 'numeric' });
            
            return `${group.course_name} - ${group.centre_name} (${startMonth} - ${endMonth})`;
        } catch {
            return `${group.course_name} - ${group.centre_name}`;
        }
    };

    const handleCreateBatch = async (group) => {
        const groupId = `${group.centre_id}|${group.course_id}`;
        const formData = batchForms[groupId];
        
        if (!formData?.batch_start_date || !formData?.batch_end_date) {
            toast.error("Please select batch start and end dates");
            return;
        }
        
        if (new Date(formData.batch_start_date) > new Date(formData.batch_end_date)) {
            toast.error("Start date cannot be after end date");
            return;
        }
        
        // Disable the specific card by marking it as submitting
        setSubmitting(true);
        const toastId = toast.loading("Creating batch...");
        
        try {
            const batchData = [{
                centre_id: group.centre_id,
                centre_name: group.centre_name,
                course_id: group.course_id,
                course_name: group.course_name,
                student_ids: group.students.map(s => s.id),
                batch_info: {
                    batch_name: generateAutoBatchName(group, formData.batch_start_date, formData.batch_end_date),
                    custom_batch_name: formData.custom_batch_name || "",
                    batch_start_date: formData.batch_start_date,
                    batch_end_date: formData.batch_end_date,
                    faculty_name: formData.faculty_name || "",
                    max_capacity: formData.max_capacity || 30
                }
            }];
            
            const res = await api.post("/mis-data/batches/create/", batchData);
            
            toast.update(toastId, {
                render: res.data.message,
                type: "success", isLoading: false, autoClose: 3000
            });
            
            // Mark this batch as created
            setCreatedBatches(prev => new Set([...prev, groupId]));
            
            // Clear form for this group
            setBatchForms(prev => ({
                ...prev,
                [groupId]: undefined
            }));
            
        } catch (error) {
            console.error("Batch creation error:", error.response?.data);
            toast.update(toastId, {
                render: error.response?.data?.error || "Failed to create batch",
                type: "error", isLoading: false, autoClose: 5000
            });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const selectGroup = (groupId) => {
        setSelectedGroup(selectedGroup === groupId ? null : groupId);
    };

    // Calculate progress
    const totalGroups = batchGroups.length;
    const completedGroups = createdBatches.size;
    const progressPercentage = totalGroups > 0 ? (completedGroups / totalGroups) * 100 : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-black">
            <div className="max-w-7xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
                        <FaChevronRight className="text-xs" />
                        <Link href="/mis-data/upload" className="hover:text-blue-600">MIS Upload</Link>
                        <FaChevronRight className="text-xs" />
                        <span className="text-gray-900 font-medium">Create Batches</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Create Training Batches
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Create batches from verified student data
                            </p>
                        </div>
                        
                        <Link
                            href="/mis-data/upload"
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <FaArrowLeft /> Back to Upload
                        </Link>
                    </div>
                </div>

                {/* Progress Bar */}
                {totalGroups > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Batch Creation Progress</span>
                            <span className="text-sm font-semibold text-purple-600">{completedGroups}/{totalGroups} Completed</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                )}

                {batchGroups.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No students found. Please upload and save student data first.</p>
                        <Link href="/mis-data/upload" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
                            Go to Upload
                        </Link>
                    </div>
                ) : (
                    <div className="flex gap-6">
                        {/* Left Side - Batch Cards */}
                        <div className="flex-1 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                            {batchGroups.map((group, idx) => {
                                const groupId = `${group.centre_id}|${group.course_id}`;
                                const formData = batchForms[groupId] || {};
                                const isCreated = createdBatches.has(groupId);
                                const isSubmitting = submitting && batchForms[groupId] !== undefined;
                                const defaultStartDate = new Date().toISOString().split('T')[0];
                                const defaultEndDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                
                                // Calculate stats
                                const totalStudents = group.students.length;
                                const maleCount = group.students.filter(s => s.gender === 'M').length;
                                const femaleCount = group.students.filter(s => s.gender === 'F').length;
                                const genCount = group.students.filter(s => s.category === 'GEN').length;
                                const scCount = group.students.filter(s => s.category === 'SC').length;
                                const stCount = group.students.filter(s => s.category === 'ST').length;
                                const obcCount = group.students.filter(s => s.category === 'OBC').length;
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all ${
                                            isCreated ? 'border-green-400 opacity-75' : 'border-gray-200 hover:border-purple-300'
                                        }`}
                                    >
                                        {/* Card Header */}
                                        <div 
                                            className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 cursor-pointer flex justify-between items-center"
                                            onClick={() => toggleGroup(groupId)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FaBuilding className="text-blue-600 text-sm" />
                                                    <h3 className="font-bold text-gray-900">{group.centre_name}</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaBookOpen className="text-purple-600 text-sm" />
                                                    <p className="font-semibold text-gray-800">{group.course_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="bg-green-100 rounded-lg px-3 py-1">
                                                    <p className="text-xs text-green-600">Students</p>
                                                    <p className="text-xl font-bold text-green-700">{totalStudents}</p>
                                                </div>
                                                {isCreated && (
                                                    <div className="mt-1 text-green-600 text-xs flex items-center gap-1">
                                                        <FaCheck /> Created
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Card Body */}
                                        {expandedGroups[groupId] && !isCreated && (
                                            <div className="p-4 space-y-4">
                                                {/* Compact Statistics */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-blue-50 rounded-lg p-2">
                                                        <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                                                            <FaVenusMars /> Gender
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span>♂ {maleCount}</span>
                                                            <span>♀ {femaleCount}</span>
                                                        </div>
                                                        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                                                            <div className="h-full bg-blue-500" style={{ width: `${(maleCount / totalStudents) * 100}%` }} />
                                                            <div className="h-full bg-pink-500" style={{ width: `${(femaleCount / totalStudents) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="bg-purple-50 rounded-lg p-2">
                                                        <div className="flex items-center gap-2 text-xs text-purple-600 mb-1">
                                                            <FaChartPie /> Category
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                                            <span>GEN: {genCount}</span>
                                                            <span>SC: {scCount}</span>
                                                            <span>ST: {stCount}</span>
                                                            <span>OBC: {obcCount}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Batch Form */}
                                                <div className="border-t pt-3">
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Auto-generated Batch Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={generateAutoBatchName(group, formData.batch_start_date || defaultStartDate, formData.batch_end_date || defaultEndDate)}
                                                                readOnly
                                                                className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Custom Batch Name (Optional)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.custom_batch_name || ''}
                                                                onChange={(e) => handleBatchFormChange(groupId, 'custom_batch_name', e.target.value)}
                                                                placeholder="Enter custom name"
                                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Start Date *
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={formData.batch_start_date || defaultStartDate}
                                                                onChange={(e) => handleBatchFormChange(groupId, 'batch_start_date', e.target.value)}
                                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                End Date *
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={formData.batch_end_date || defaultEndDate}
                                                                onChange={(e) => handleBatchFormChange(groupId, 'batch_end_date', e.target.value)}
                                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Student List Button */}
                                                    <button
                                                        onClick={() => selectGroup(selectedGroup === groupId ? null : groupId)}
                                                        className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                                                    >
                                                        <FaUsers className="text-xs" />
                                                        {selectedGroup === groupId ? "Hide" : "Show"} Student List ({totalStudents})
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleCreateBatch(group)}
                                                        disabled={isSubmitting}
                                                        className="mt-3 w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                                        Create Batch
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Student List Table */}
                                        {selectedGroup === groupId && (
                                            <div className="border-t border-gray-200 bg-gray-50">
                                                <div className="p-4">
                                                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Student List</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-gray-100">
                                                                <tr>
                                                                    <th className="px-2 py-2 text-left">Month-Year</th>
                                                                    <th className="px-2 py-2 text-left">App No.</th>
                                                                    <th className="px-2 py-2 text-left">Reg ID</th>
                                                                    <th className="px-2 py-2 text-left">Name</th>
                                                                    <th className="px-2 py-2 text-center">Gender</th>
                                                                    <th className="px-2 py-2 text-center">Category</th>
                                                                    <th className="px-2 py-2 text-left">Mobile</th>
                                                                    <th className="px-2 py-2 text-left">Email</th>
                                                                    <th className="px-2 py-2 text-center">Fees</th>
                                                                    <th className="px-2 py-2 text-center">Payment</th>
                                                                    <th className="px-2 py-2 text-left">App Date</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.students.map((student, sIdx) => (
                                                                    <tr key={sIdx} className="border-t border-gray-200 hover:bg-gray-100">
                                                                        <td className="px-2 py-2 whitespace-nowrap">{student.application_date ? new Date(student.application_date).toLocaleString('default', { month: 'short', year: 'numeric' }) : '-'}</td>
                                                                        <td className="px-2 py-2 whitespace-nowrap">{student.application_number || '-'}</td>
                                                                        <td className="px-2 py-2 whitespace-nowrap">{student.registration_id || '-'}</td>
                                                                        <td className="px-2 py-2 whitespace-nowrap font-medium">{student.candidate_name}</td>
                                                                        <td className="px-2 py-2 text-center">{student.gender === 'M' ? '♂' : '♀'}</td>
                                                                        <td className="px-2 py-2 text-center">{student.category}</td>
                                                                        <td className="px-2 py-2 whitespace-nowrap">{student.mobile_number || '-'}</td>
                                                                        <td className="px-2 py-2 max-w-[150px] truncate">{student.email_id || '-'}</td>
                                                                        <td className="px-2 py-2 text-center">₹{student.application_fee || 0}</td>
                                                                        <td className="px-2 py-2 text-center">
                                                                            <span className="px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                                                                {student.payment_status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-2 py-2 whitespace-nowrap">{student.application_date || '-'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Right Side - Progress Tracker */}
                        <div className="w-80 bg-white rounded-xl shadow-lg p-4 h-fit sticky top-8">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FaClock className="text-purple-600" />
                                Batch Progress Tracker
                            </h3>
                            
                            <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                                {batchGroups.map((group, idx) => {
                                    const groupId = `${group.centre_id}|${group.course_id}`;
                                    const isCreated = createdBatches.has(groupId);
                                    const totalStudents = group.students.length;
                                    
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                                isCreated 
                                                    ? 'bg-green-50 border-green-300' 
                                                    : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                                            }`}
                                            onClick={() => {
                                                if (!isCreated) {
                                                    toggleGroup(groupId);
                                                    // Scroll to the card
                                                    const element = document.getElementById(`batch-card-${idx}`);
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }
                                                }
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <FaBookOpen className="text-purple-600 text-xs" />
                                                        <p className="text-sm font-medium text-gray-800 truncate">{group.course_name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <FaBuilding className="text-blue-600 text-xs" />
                                                        <p className="text-xs text-gray-600 truncate">{group.centre_name}</p>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <FaUsers className="text-gray-400 text-xs" />
                                                        <span className="text-xs text-gray-500">{totalStudents} students</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {isCreated ? (
                                                        <div className="bg-green-500 rounded-full p-1">
                                                            <FaCheck className="text-white text-xs" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                                            <span className="text-xs text-gray-400">{idx + 1}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {isCreated && (
                                                <div className="mt-2 pt-2 border-t border-green-200">
                                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                                        <FaCheckCircle className="text-xs" /> Batch Created
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Progress Summary */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Completed</span>
                                    <span className="font-semibold text-purple-600">{completedGroups}/{totalGroups}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                {progressPercentage === 100 && (
                                    <div className="mt-3 p-2 bg-green-50 rounded-lg text-center">
                                        <p className="text-sm text-green-600 font-medium">🎉 All batches created!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={5000} />
        </div>
    );
}