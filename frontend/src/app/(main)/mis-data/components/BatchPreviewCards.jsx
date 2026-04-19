"use client";

import { FaBuilding, FaBookOpen, FaUsers, FaVenusMars, FaChartPie } from "react-icons/fa";

export default function BatchPreviewCards({ batchPreview }) {
    if (!batchPreview) return null;

    const { centre, course, statistics } = batchPreview;

    const getGenderLabel = (gender) => {
        if (gender === 'M') return 'Male';
        if (gender === 'F') return 'Female';
        return gender;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Centre Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <FaBuilding className="text-2xl opacity-75" />
                        <h3 className="text-lg font-semibold">Training Centre</h3>
                    </div>
                    <p className="text-2xl font-bold">{centre.name}</p>
                    <p className="text-sm opacity-75 mt-1">ID: {centre.id}</p>
                </div>

                {/* Course Card */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <FaBookOpen className="text-2xl opacity-75" />
                        <h3 className="text-lg font-semibold">Course Details</h3>
                    </div>
                    <p className="text-xl font-bold">{course.name}</p>
                    <p className="text-sm opacity-75 mt-1">ID: {course.id}</p>
                </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaUsers className="text-green-600" />
                    Batch Statistics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Total Students */}
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 mb-1">Total Students</p>
                        <p className="text-3xl font-bold text-green-700">{statistics.total_students}</p>
                    </div>

                    {/* Gender Breakdown */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 mb-2 flex items-center gap-2">
                            <FaVenusMars /> Gender Distribution
                        </p>
                        <div className="space-y-2">
                            {statistics.gender_breakdown?.map(item => (
                                <div key={item.gender} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">{getGenderLabel(item.gender)}</span>
                                    <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${item.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'} rounded-full`}
                                            style={{ width: `${(item.count / statistics.total_students) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="p-4 bg-purple-50 rounded-lg md:col-span-2">
                        <p className="text-sm text-purple-600 mb-2 flex items-center gap-2">
                            <FaChartPie /> Category Distribution
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {statistics.category_breakdown?.map(item => (
                                <div key={item.category} className="text-center">
                                    <div className="bg-white rounded-lg p-2">
                                        <p className="text-lg font-bold text-gray-800">{item.count}</p>
                                        <p className="text-xs text-gray-500">{item.category}</p>
                                        <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-purple-500 rounded-full"
                                                style={{ width: `${(item.count / statistics.total_students) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}