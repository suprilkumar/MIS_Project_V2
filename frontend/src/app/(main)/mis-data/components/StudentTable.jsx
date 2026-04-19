"use client";

import { useState } from "react";
import { FaSearch, FaCheckSquare, FaSquare, FaEye, FaDownload, FaBuilding, FaBookOpen } from "react-icons/fa";
import React from "react";

export default function StudentTable({
    students,
    selectedStudents,
    onSelectStudent,
    onSelectAll,
    searchTerm,
    setSearchTerm,
    filterGender,
    setFilterGender,
    filterCategory,
    setFilterCategory,
    filterPaymentStatus,
    setFilterPaymentStatus,
    studentGroups,
    groupByCentre,
    setGroupByCentre,
    showCheckboxes = true  // Add this prop with default true
}) {
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                return `${parts[0]}/${parts[1]}/${parts[2]}`;
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    };

    const getMonthYear = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const month = parts[1];
                const year = parts[2];
                const date = new Date(year, parseInt(month) - 1);
                return date.toLocaleString('default', { month: 'short', year: 'numeric' });
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    };

    const getPaymentStatusBadge = (status) => {
        if (!status) return null;
        const statusUpper = status.toUpperCase();
        if (statusUpper === 'SUCCESS') {
            return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 whitespace-nowrap">✅ Success</span>;
        } else if (statusUpper === 'PENDING') {
            return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 whitespace-nowrap">⏳ Pending</span>;
        } else if (statusUpper === 'FAILED') {
            return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 whitespace-nowrap">❌ Failed</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 whitespace-nowrap">{status}</span>;
    };

    const exportToCSV = () => {
        const headers = ['Application No', 'Registration ID', 'Candidate Name', 'Gender', 'Category', 'Mobile No', 'Email', 'Application Fee', 'Payment Status', 'Application Date', 'Course Applied', 'Course Location'];
        const csvData = students.map(s => [
            s.application_number || '',
            s.registration_id || '',
            s.candidate_name || '',
            s.gender || '',
            s.category || '',
            s.mobile_number || '',
            s.email_id || '',
            s.application_fee || '',
            s.payment_status || '',
            s.application_date || '',
            s.course_applied || '',
            s.course_location || ''
        ]);
        
        const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_data.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const isAllSelected = students.length > 0 && selectedStudents.size === students.length;

    // Table Header Component - to be used inside <thead>
    const TableHeader = () => (
        <>
            {showCheckboxes && (
                <th className="px-4 py-3 text-left w-12">
                    <button onClick={onSelectAll} className="focus:outline-none">
                        {isAllSelected ? <FaCheckSquare className="text-blue-600 text-xl" /> : <FaSquare className="text-gray-400 text-xl" />}
                    </button>
                </th>
            )}
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Month-Year</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">App No.</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Registration ID</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Candidate Name</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Gender</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Category</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Mobile No</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Email</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Fees (₹)</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Payment Status</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">App Date</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Course</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Centre</th>
        </>
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden text-black">
            {/* Table Header with Filters */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FaEye className="text-blue-600" /> Student Details
                    </h3>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={exportToCSV}
                            className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                        >
                            <FaDownload /> Export CSV
                        </button>
                        <button
                            onClick={() => setGroupByCentre(!groupByCentre)}
                            className="px-3 py-1 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            {groupByCentre ? "Group by Course" : "Group by Centre"}
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, application number, or mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Genders</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                    
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Categories</option>
                        <option value="GEN">GEN</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="OBC">OBC</option>
                    </select>

                    <select
                        value={filterPaymentStatus}
                        onChange={(e) => setFilterPaymentStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Payment Status</option>
                        <option value="SUCCESS">✅ Success</option>
                        <option value="PENDING">⏳ Pending</option>
                        <option value="FAILED">❌ Failed</option>
                    </select>
                </div>
            </div>

            {/* Student Table */}
            <div className="overflow-x-auto">
                {groupByCentre ? (
                    // Group by Centre then Course - each group gets its own table
                    Object.entries(studentGroups).map(([centre, courses]) => (
                        <div key={centre} className="mb-8 last:mb-0">
                            <div className="bg-blue-50 p-3 rounded-t-lg border-b-2 border-blue-200">
                                <button 
                                    onClick={() => toggleGroup(centre)} 
                                    className="font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-2"
                                >
                                    {expandedGroups[centre] ? '▼' : '▶'} 
                                    <FaBuilding className="text-blue-600" />
                                    {centre}
                                    <span className="text-sm text-blue-600 ml-2">
                                        ({Object.values(courses).reduce((total, students) => total + students.length, 0)} students)
                                    </span>
                                </button>
                            </div>
                            
                            {expandedGroups[centre] && (
                                <div className="space-y-6 mt-4">
                                    {Object.entries(courses).map(([course, courseStudents]) => (
                                        <div key={`${centre}-${course}`} className="border rounded-lg overflow-hidden">
                                            <div className="bg-gray-100 p-2 px-4 border-b">
                                                <div className="flex items-center gap-2">
                                                    <FaBookOpen className="text-purple-600" />
                                                    <span className="font-medium text-gray-800">{course}</span>
                                                    <span className="text-sm text-gray-500">({courseStudents.length} students)</span>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse min-w-[1200px]">
                                                    <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                                                        <tr>
                                                            <TableHeader />
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {courseStudents.map((student, studentIndex) => (
                                                            <tr key={student.id} className={`border-b border-gray-200 hover:bg-gray-50 ${studentIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                                {showCheckboxes && (
                                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                                        <button onClick={() => onSelectStudent(student.id)}>
                                                                            {selectedStudents.has(student.id) ? 
                                                                                <FaCheckSquare className="text-blue-600" /> : 
                                                                                <FaSquare className="text-gray-400" />
                                                                            }
                                                                        </button>
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{getMonthYear(student.application_date)}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{student.application_number || '-'}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{student.registration_id || '-'}</td>
                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{student.candidate_name}</td>
                                                                <td className="px-4 py-3 text-center text-sm whitespace-nowrap">
                                                                    <span className={`px-2 py-1 rounded-full text-xs ${student.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'} whitespace-nowrap`}>
                                                                        {student.gender === 'M' ? 'Male' : 'Female'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center text-sm whitespace-nowrap">
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 whitespace-nowrap">{student.category}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{student.mobile_number || '-'}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap truncate max-w-[200px]">{student.email_id || '-'}</td>
                                                                <td className="px-4 py-3 text-center text-sm font-medium whitespace-nowrap">₹{student.application_fee || 0}</td>
                                                                <td className="px-4 py-3 text-center text-sm whitespace-nowrap">
                                                                    {getPaymentStatusBadge(student.payment_status)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(student.application_date)}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap truncate max-w-[200px]">{student.course_applied}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{student.course_location}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    // Flat list - single table
                    <table className="w-full border-collapse min-w-[1200px]">
                        <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                            <tr>
                                <TableHeader />
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={student.id} className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    {showCheckboxes && (
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button onClick={() => onSelectStudent(student.id)}>
                                                {selectedStudents.has(student.id) ? 
                                                    <FaCheckSquare className="text-blue-600" /> : 
                                                    <FaSquare className="text-gray-400" />
                                                }
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{getMonthYear(student.application_date)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{student.application_number || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{student.registration_id || '-'}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{student.candidate_name}</td>
                                    <td className="px-4 py-3 text-center text-sm whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs ${student.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'} whitespace-nowrap`}>
                                            {student.gender === 'M' ? 'Male' : 'Female'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm whitespace-nowrap">
                                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 whitespace-nowrap">{student.category}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{student.mobile_number || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap truncate max-w-[200px]">{student.email_id || '-'}</td>
                                    <td className="px-4 py-3 text-center text-sm font-medium whitespace-nowrap">₹{student.application_fee || 0}</td>
                                    <td className="px-4 py-3 text-center text-sm whitespace-nowrap">
                                        {getPaymentStatusBadge(student.payment_status)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(student.application_date)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap truncate max-w-[200px]">{student.course_applied}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{student.course_location}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer with selection info - Only show if checkboxes are enabled */}
            {showCheckboxes && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 whitespace-nowrap">
                            Showing {students.length} of {students.length} students
                        </span>
                        <span className="text-blue-600 font-medium whitespace-nowrap">
                            Selected: {selectedStudents.size} students
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}