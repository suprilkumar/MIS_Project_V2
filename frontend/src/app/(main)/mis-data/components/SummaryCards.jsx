"use client";

import { FaBuilding, FaBookOpen, FaUsers, FaChartBar, FaCalendarAlt, FaMoneyBillWave, FaVenusMars, FaChartPie, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useState } from "react";

export default function SummaryCards({ summary }) {
    const [expandedCentres, setExpandedCentres] = useState({});
    
    // Safely access summary properties with defaults
    const totalStudents = summary?.total_students || 0;
    const totalCentres = summary?.total_centres || 0;
    const totalCourses = summary?.total_courses || 0;
    const monthsRange = summary?.months_range || [];
    const centresList = summary?.centres_list || [];
    const centreCourseCounts = summary?.centre_course_counts || [];
    const genderBreakdown = summary?.gender_breakdown || {};
    const categoryBreakdown = summary?.category_breakdown || {};
    const paymentBreakdown = summary?.payment_breakdown || {};

    const toggleCentre = (centreName) => {
        setExpandedCentres(prev => ({
            ...prev,
            [centreName]: !prev[centreName]
        }));
    };

    const formatMonthDisplay = (monthStr) => {
        if (!monthStr) return '';
        try {
            const [year, month] = monthStr.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        } catch {
            return monthStr;
        }
    };

    // Calculate percentages for progress bars
    const getPercentage = (value, total) => {
        if (total === 0) return 0;
        return (value / total) * 100;
    };

    // Get color for course count badge
    const getBadgeColor = (count, maxCount) => {
        const percentage = (count / maxCount) * 100;
        if (percentage >= 70) return 'bg-red-100 text-red-700';
        if (percentage >= 40) return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    };

    // Find max course count for color scaling
    const maxCourseCount = Math.max(
        ...centreCourseCounts.flatMap(item => 
            Object.values(item.courses || {})
        ),
        0
    );

    return (
        <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="bg-white/20 rounded-lg p-2">
                            <FaUsers className="text-xl" />
                        </div>
                        <span className="text-3xl font-bold">{totalStudents.toLocaleString()}</span>
                    </div>
                    <p className="mt-3 text-sm opacity-90">Total Students (Success)</p>
                    <div className="mt-2 h-1 bg-white/20 rounded-full">
                        <div className="h-full w-full bg-white/40 rounded-full"></div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="bg-white/20 rounded-lg p-2">
                            <FaBuilding className="text-xl" />
                        </div>
                        <span className="text-3xl font-bold">{totalCentres}</span>
                    </div>
                    <p className="mt-3 text-sm opacity-90">Total Centres</p>
                    <div className="mt-2 h-1 bg-white/20 rounded-full">
                        <div className="h-full w-full bg-white/40 rounded-full"></div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="bg-white/20 rounded-lg p-2">
                            <FaBookOpen className="text-xl" />
                        </div>
                        <span className="text-3xl font-bold">{totalCourses}</span>
                    </div>
                    <p className="mt-3 text-sm opacity-90">Total Courses</p>
                    <div className="mt-2 h-1 bg-white/20 rounded-full">
                        <div className="h-full w-full bg-white/40 rounded-full"></div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="bg-white/20 rounded-lg p-2">
                            <FaCalendarAlt className="text-xl" />
                        </div>
                        <span className="text-3xl font-bold">{monthsRange.length}</span>
                    </div>
                    <p className="mt-3 text-sm opacity-90">Months Range</p>
                    <div className="mt-2 h-1 bg-white/20 rounded-full">
                        <div className="h-full w-full bg-white/40 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Centres Quick Reference */}
            {centresList.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FaBuilding className="text-blue-600" />
                            Centres Overview
                            <span className="text-sm text-gray-500 ml-2">({centresList.length} centres)</span>
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="flex flex-wrap gap-2">
                            {centresList.map((centre, idx) => {
                                const centreData = centreCourseCounts.find(c => c.centre_name === centre);
                                const totalEnrollments = centreData?.total || 0;
                                return (
                                    <div key={idx} className="relative group">
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-help">
                                            <FaBuilding className="text-xs" />
                                            {centre}
                                            {totalEnrollments > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-blue-200 rounded-full text-xs">
                                                    {totalEnrollments}
                                                </span>
                                            )}
                                        </span>
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                            <div className="bg-gray-800 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                                                Total Students: {totalEnrollments}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Centre-wise Course Enrollment Cards */}
            {centreCourseCounts.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FaChartBar className="text-teal-600" />
                            Centre-wise Course Enrollment Details
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Click on any centre to expand/collapse course details</p>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                        {centreCourseCounts.map((item, idx) => {
                            const isExpanded = expandedCentres[item.centre_name];
                            const courses = Object.entries(item.courses || {});
                            const totalStudents = item.total || 0;
                            
                            return (
                                <div key={idx} className="hover:bg-gray-50 transition-colors">
                                    {/* Centre Header - Clickable */}
                                    <div 
                                        className="p-5 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => toggleCentre(item.centre_name)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 text-white">
                                                    <FaBuilding className="text-lg" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-lg">{item.centre_name}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-sm text-gray-500">
                                                            {courses.length} Course{courses.length !== 1 ? 's' : ''}
                                                        </span>
                                                        <span className="text-sm font-semibold text-blue-600">
                                                            Total: {totalStudents} Students
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-gray-800">{totalStudents}</div>
                                                    <div className="text-xs text-gray-500">Enrollments</div>
                                                </div>
                                                {isExpanded ? (
                                                    <FaChevronUp className="text-gray-400" />
                                                ) : (
                                                    <FaChevronDown className="text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Progress bar for centre total */}
                                        <div className="mt-3">
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${(totalStudents / totalStudents) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Expanded Course List */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 pt-2 bg-gray-50 border-t border-gray-100">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {courses.map(([course, count], courseIdx) => (
                                                    <div key={courseIdx} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <FaBookOpen className="text-purple-500 text-sm" />
                                                                    <p className="font-medium text-gray-800 text-sm line-clamp-2">{course}</p>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <span className="text-xs text-gray-500">Enrolled Students</span>
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBadgeColor(count, maxCourseCount)}`}>
                                                                        {count}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2">
                                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                                                            style={{ width: `${(count / maxCourseCount) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Summary footer for centre */}
                                            <div className="mt-4 pt-3 border-t border-gray-200 text-right">
                                                <span className="text-xs text-gray-500">
                                                    Total {courses.length} courses • {totalStudents} students
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Breakdown Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gender Breakdown */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FaVenusMars className="text-blue-600" />
                            Gender Breakdown
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">Male</span>
                                <span className="font-semibold text-blue-600">{genderBreakdown.M || 0}</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                    style={{ width: `${getPercentage(genderBreakdown.M || 0, totalStudents)}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">Female</span>
                                <span className="font-semibold text-pink-600">{genderBreakdown.F || 0}</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-500"
                                    style={{ width: `${getPercentage(genderBreakdown.F || 0, totalStudents)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FaChartPie className="text-green-600" />
                            Category Breakdown
                        </h3>
                    </div>
                    <div className="p-5 space-y-3">
                        {Object.entries(categoryBreakdown).map(([cat, count]) => (
                            <div key={cat}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium">{cat}</span>
                                    <span className="font-semibold text-green-600">{count}</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                                        style={{ width: `${getPercentage(count, totalStudents)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {Object.keys(categoryBreakdown).length === 0 && (
                            <p className="text-gray-500 text-sm text-center">No category data available</p>
                        )}
                    </div>
                </div>

                {/* Payment Status Breakdown */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FaMoneyBillWave className="text-yellow-600" />
                            Payment Status
                        </h3>
                    </div>
                    <div className="p-5 space-y-3">
                        {Object.entries(paymentBreakdown).map(([status, count]) => {
                            let colorClass = '';
                            let bgGradient = '';
                            if (status === 'SUCCESS') {
                                colorClass = 'text-green-600';
                                bgGradient = 'from-green-500 to-green-600';
                            } else if (status === 'PENDING') {
                                colorClass = 'text-yellow-600';
                                bgGradient = 'from-yellow-500 to-yellow-600';
                            } else {
                                colorClass = 'text-red-600';
                                bgGradient = 'from-red-500 to-red-600';
                            }
                            return (
                                <div key={status}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{status}</span>
                                        <span className={`font-semibold ${colorClass}`}>{count}</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${bgGradient} rounded-full transition-all duration-500`}
                                            style={{ width: `${getPercentage(count, totalStudents)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(paymentBreakdown).length === 0 && (
                            <p className="text-gray-500 text-sm text-center">No payment data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Months Range */}
            {monthsRange.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FaCalendarAlt className="text-indigo-600" />
                            Application Date Range
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="flex flex-wrap gap-2">
                            {monthsRange.map((month, idx) => (
                                <span key={idx} className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-2">
                                    <FaCalendarAlt className="text-xs" />
                                    {formatMonthDisplay(month)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}