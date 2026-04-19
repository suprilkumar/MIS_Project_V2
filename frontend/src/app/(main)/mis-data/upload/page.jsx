"use client";

import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaUpload, FaChevronRight, FaFileCsv, FaBuilding,
    FaSpinner, FaCheckCircle, FaTrash, FaBookOpen, FaUsers,
    FaChartBar, FaDatabase, FaCalendarAlt, FaArrowRight,
    FaEye, FaEyeSlash, FaSave, FaExclamationTriangle
} from 'react-icons/fa';
import "react-toastify/dist/ReactToastify.css";

// Import components
import UploadSection from "../components/UploadSection";
import SummaryCards from "../components/SummaryCards";
import StudentTable from "../components/StudentTable";

export default function MISUploadPage() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [file, setFile] = useState(null);
    const [studentsData, setStudentsData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showDataPreview, setShowDataPreview] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGender, setFilterGender] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
    const [showStudentDetails, setShowStudentDetails] = useState(true);
    const [groupByCentre, setGroupByCentre] = useState(true);
    const [uploadError, setUploadError] = useState(null);

    const handleUpload = async (file) => {
        setUploading(true);
        setUploadError(null);
        const toastId = toast.loading("Processing file...");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await api.post("/mis-data/upload/", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000 // 60 second timeout
            });

            setSummary(res.data.summary);
            setStudentsData(res.data.students);
            setShowSummary(true);
            setShowDataPreview(true);
            setSelectedStudents(new Set());

            toast.update(toastId, {
                render: `✅ File processed successfully! Found ${res.data.total_students} students with successful payments.`,
                type: "success", isLoading: false, autoClose: 4000
            });

        } catch (err) {
            console.error("Upload error:", err.response?.data);
            const errorMsg = err.response?.data?.error || err.message || "File upload failed. Please check the file format.";
            setUploadError(errorMsg);
            toast.update(toastId, {
                render: errorMsg,
                type: "error", isLoading: false, autoClose: 6000
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSaveStudents = async () => {
        if (studentsData.length === 0) {
            toast.warning("No data to save");
            return;
        }

        setSaving(true);
        const toastId = toast.loading("Saving student data...");

        try {
            const res = await api.post("/mis-data/save-students/", {
                students: studentsData
            });

            toast.update(toastId, {
                render: res.data.message,
                type: "success", isLoading: false, autoClose: 3000
            });

            // Redirect to batch creation page after successful save
            setTimeout(() => {
                router.push('/mis-data/batches');
            }, 2000);

        } catch (err) {
            console.error("Save error:", err.response?.data);
            toast.update(toastId, {
                render: err.response?.data?.error || "Failed to save students. Please try again.",
                type: "error", isLoading: false, autoClose: 5000
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm("Are you sure you want to reset all data?")) {
            setStudentsData([]);
            setFile(null);
            setSummary(null);
            setSelectedStudents(new Set());
            setShowSummary(false);
            setShowDataPreview(false);
            setUploadError(null);
            toast.info("All data has been reset");
        }
    };

    const filteredStudents = studentsData.filter(student => {
        const matchesSearch = 
            student.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.mobile_number?.includes(searchTerm);
        
        const matchesGender = filterGender === "all" || student.gender === filterGender;
        const matchesCategory = filterCategory === "all" || student.category === filterCategory;
        const matchesPaymentStatus = filterPaymentStatus === "all" || student.payment_status === filterPaymentStatus;
        
        return matchesSearch && matchesGender && matchesCategory && matchesPaymentStatus;
    });

    const groupedStudents = () => {
        const groups = {};
        filteredStudents.forEach(student => {
            const centre = student.course_location;
            const course = student.course_applied;
            if (!groups[centre]) groups[centre] = {};
            if (!groups[centre][course]) groups[centre][course] = [];
            groups[centre][course].push(student);
        });
        return groups;
    };

    // Sample file template download
    const downloadTemplate = () => {
        const headers = [
            'Course Location', 'Application Number', 'Registration ID', 'Course Applied', 
            'Candidate Name', 'Father Name', 'Mother Name', 'Gender', 'Date of Birth', 
            'Category', 'Identity Card Type', 'Identity Card Number', 'Correspondence Address', 
            'Permanent Address', 'Mobile Number', 'Email ID', 'Qualification', 'Application Fee', 
            'Payment Status', 'Fee Reference Number', 'Transaction ID', 'Payment Date', 
            'Discount Criteria', 'Discount Percentage', 'Total Discount', 'Application Date'
        ];
        
        const sampleRow = [
            'Sample Centre', 'APP001', 'REG001', 'Sample Course', 'John Doe', 
            'Father Name', 'Mother Name', 'M', '01/01/2000', 'GEN', 'Aadhaar Card', 
            '123456789012', 'Sample Address', 'Sample Permanent Address', '9876543210', 
            'john@example.com', 'Graduate', '1000', 'SUCCESS', 'REF001', 'TXN001', 
            '01/01/2024', 'No Discount', '0', '0', '01/01/2024'
        ];
        
        const csvContent = [headers, sampleRow].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mis_data_template.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Template downloaded successfully");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-black">
            <div className="max-w-7xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
                        <FaChevronRight className="text-xs" />
                        <span className="text-gray-900 font-medium">MIS Data Upload</span>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Upload MIS Data
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Upload student data, review, and save to database
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={downloadTemplate}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 border border-blue-200"
                            >
                                <FaFileCsv /> Download Template
                            </button>
                            {(studentsData.length > 0 || summary) && (
                                <button onClick={handleReset}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                                    <FaTrash /> Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {uploadError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <FaExclamationTriangle className="text-red-500 text-xl mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800">Upload Failed</h3>
                            <p className="text-red-600 text-sm">{uploadError}</p>
                            <p className="text-red-500 text-xs mt-2">
                                Please check:
                                <ul className="list-disc list-inside mt-1">
                                    <li>File format (CSV or Excel)</li>
                                    <li>Column names match the template</li>
                                    <li>Required columns are present: Course Location, Course Applied, Payment Status, Application Date</li>
                                    <li>At least one record has "SUCCESS" payment status</li>
                                </ul>
                            </p>
                        </div>
                    </div>
                )}

                {/* Upload Section */}
                <UploadSection
                    file={file}
                    setFile={setFile}
                    uploading={uploading}
                    handleUpload={handleUpload}
                    dragActive={dragActive}
                    setDragActive={setDragActive}
                />

                {/* Data Review Section */}
                {showSummary && summary && (
                    <div className="space-y-6 mt-8">
                        <SummaryCards summary={summary} />

                        {/* Save Button */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Ready to Save?</h3>
                                    <p className="text-sm text-gray-500">
                                        Review the data below and click Save to store students in database
                                    </p>
                                </div>
                                <button
                                    onClick={handleSaveStudents}
                                    disabled={saving || studentsData.length === 0}
                                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaSave /> Save Students to Database</>}
                                </button>
                            </div>
                        </div>

                        {/* Toggle Student Details */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setShowStudentDetails(!showStudentDetails)}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm"
                            >
                                {showStudentDetails ? <FaEyeSlash /> : <FaEye />}
                                {showStudentDetails ? "Hide" : "Show"} Student Details
                            </button>
                            <div className="text-sm text-gray-600">
                                Total Students: {studentsData.length}
                            </div>
                        </div>

                        {/* Student Table */}
                        {showStudentDetails && (
                            <StudentTable
                                students={filteredStudents}
                                selectedStudents={selectedStudents}
                                onSelectStudent={() => {}}
                                onSelectAll={() => {}}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                filterGender={filterGender}
                                setFilterGender={setFilterGender}
                                filterCategory={filterCategory}
                                setFilterCategory={setFilterCategory}
                                filterPaymentStatus={filterPaymentStatus}
                                setFilterPaymentStatus={setFilterPaymentStatus}
                                studentGroups={groupedStudents()}
                                groupByCentre={groupByCentre}
                                setGroupByCentre={setGroupByCentre}
                                showCheckboxes={false}
                            />
                        )}
                    </div>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={5000} />
        </div>
    );
}