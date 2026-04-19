"use client";

import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import BatchCreationCards from "./components/BatchCreationCards";
import {
    FaUpload, FaChevronRight, FaFileCsv, FaBuilding,
    FaSpinner, FaCheckCircle, FaEdit,
    FaSave, FaTrash, FaBookOpen, FaUsers,
    FaChartBar, FaDatabase, FaCheckDouble,
    FaCalendarAlt, FaVenusMars, FaChartLine,
    FaMoneyBillWave, FaHourglassHalf, FaArrowRight,
    FaUserGraduate, FaLayerGroup, FaClipboardList,
    FaThumbsUp, FaEye, FaEyeSlash
} from 'react-icons/fa';
import "react-toastify/dist/ReactToastify.css";

// Import components
import UploadSection from "./components/UploadSection";
import SummaryCards from "./components/SummaryCards";
import StudentTable from "./components/StudentTable";
import BatchPreviewCards from "./components/BatchPreviewCards";
import BatchFormModal from "./components/BatchFormModal";
import ConfirmationModal from "./components/ConfirmationModal";

export default function MISDataPage() {
    const { user } = useAuth();
    
    // State management
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [studentsData, setStudentsData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showDataPreview, setShowDataPreview] = useState(false);
    
    // Selection and batch management
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [groupByCentre, setGroupByCentre] = useState(true);
    const [selectedCentre, setSelectedCentre] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [batchPreview, setBatchPreview] = useState(null);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [dataVerified, setDataVerified] = useState(false);
    const [activeStep, setActiveStep] = useState(1); // 1: Upload, 2: Review, 3: Batch Creation
    
    // UI state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGender, setFilterGender] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [showStudentDetails, setShowStudentDetails] = useState(true);
    const [centresList, setCentresList] = useState([]);
    const [coursesByCentre, setCoursesByCentre] = useState({});

    // Load centres and courses on mount
    useEffect(() => {
        fetchCentresAndCourses();
    }, []);

    const fetchCentresAndCourses = async () => {
        try {
            const centresRes = await api.get("/mis-data/centres/");
            setCentresList(centresRes.data.centres);
        } catch (error) {
            console.error("Error fetching centres:", error);
        }
    };

    const fetchCoursesByCentre = async (centreId) => {
        try {
            const coursesRes = await api.get(`/mis-data/centres/${centreId}/courses/`);
            setCoursesByCentre(prev => ({ ...prev, [centreId]: coursesRes.data.courses }));
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    // Handle file upload
    const handleUpload = async (file) => {
        setUploading(true);
        const toastId = toast.loading("Processing file...");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await api.post("/mis-data/upload/", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSummary(res.data.summary);
            setStudentsData(res.data.students);
            setShowSummary(true);
            setShowDataPreview(true);
            setActiveStep(2);
            
            // Initialize selected students (none selected by default)
            setSelectedStudents(new Set());

            toast.update(toastId, {
                render: `File processed successfully! Found ${res.data.total_students} students with successful payments.`,
                type: "success", isLoading: false, autoClose: 4000
            });

        } catch (err) {
            console.error("Upload error:", err.response?.data);
            toast.update(toastId, {
                render: err.response?.data?.error || "File upload failed. Please check the file format.",
                type: "error", isLoading: false, autoClose: 5000
            });
        } finally {
            setUploading(false);
        }
    };

    // Handle data verification
    const handleVerifyData = async () => {
        try {
            await api.post("/mis-data/confirm-upload/");
            setDataVerified(true);
            toast.success("Data verified successfully! You can now proceed to batch creation.");
        } catch (error) {
            toast.error("Failed to verify data. Please try again.");
        }
    };

    // Handle student selection
    const handleSelectStudent = (studentId) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
        setBatchPreview(null); // Clear preview when selection changes
    };

    const handleSelectAll = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set());
        } else {
            const allIds = filteredStudents.map(s => s.id);
            setSelectedStudents(new Set(allIds));
        }
        setBatchPreview(null);
    };

    // Get preview stats for selected students
    const handlePreviewBatch = async () => {
        if (!selectedCentre || !selectedCourse) {
            toast.warning("Please select a centre and course for batch creation");
            return;
        }

        if (selectedStudents.size === 0) {
            toast.warning("Please select at least one student");
            return;
        }

        const toastId = toast.loading("Fetching batch preview...");
        
        try {
            const studentIds = Array.from(selectedStudents).join(',');
            const res = await api.get(`/mis-data/batches/preview/?centre_id=${selectedCentre}&course_id=${selectedCourse}&student_ids=${studentIds}`);
            
            setBatchPreview(res.data);
            setShowBatchModal(true);
            
            toast.update(toastId, {
                render: "Batch preview ready",
                type: "success", isLoading: false, autoClose: 2000
            });
        } catch (error) {
            toast.update(toastId, {
                render: error.response?.data?.error || "Failed to get batch preview",
                type: "error", isLoading: false, autoClose: 3000
            });
        }
    };

    // Create batches
    const handleCreateBatches = async (batchInfo) => {
        setSubmitting(true);
        const toastId = toast.loading("Creating batches...");

        try {
            const batchData = [{
                centre_id: selectedCentre,
                course_id: selectedCourse,
                student_ids: Array.from(selectedStudents),
                batch_info: batchInfo
            }];

            const res = await api.post("/mis-data/batches/create/", batchData);

            toast.update(toastId, {
                render: res.data.message,
                type: "success", isLoading: false, autoClose: 4000
            });

            // Reset after successful creation
            setTimeout(() => {
                setShowBatchModal(false);
                setSelectedStudents(new Set());
                setSelectedCentre(null);
                setSelectedCourse(null);
                setBatchPreview(null);
                setActiveStep(3);
                setShowConfirmationModal(true);
            }, 2000);

        } catch (error) {
            toast.update(toastId, {
                render: error.response?.data?.error || "Failed to create batches",
                type: "error", isLoading: false, autoClose: 5000
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Reset all data
    const handleReset = () => {
        if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
            setStudentsData([]);
            setFile(null);
            setSummary(null);
            setSelectedStudents(new Set());
            setSelectedCentre(null);
            setSelectedCourse(null);
            setBatchPreview(null);
            setDataVerified(false);
            setShowSummary(false);
            setShowDataPreview(false);
            setActiveStep(1);
            toast.info("All data has been reset");
        }
    };

    // Filter students based on search and filters
    const filteredStudents = studentsData.filter(student => {
        const matchesSearch = 
            student.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.mobile_number?.includes(searchTerm);
        
        const matchesGender = filterGender === "all" || student.gender === filterGender;
        const matchesCategory = filterCategory === "all" || student.category === filterCategory;
        
        return matchesSearch && matchesGender && matchesCategory;
    });

    // Group students by centre and course
    const groupedStudents = () => {
        const groups = {};
        
        filteredStudents.forEach(student => {
            const centre = student.course_location;
            const course = student.course_applied;
            
            if (!groups[centre]) {
                groups[centre] = {};
            }
            if (!groups[centre][course]) {
                groups[centre][course] = [];
            }
            groups[centre][course].push(student);
        });
        
        return groups;
    };

    const studentGroups = groupedStudents();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-black">
            <div className="max-w-7xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                        <FaChevronRight className="text-xs" />
                        <span className="text-gray-900 font-medium">MIS Data Management</span>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                MIS Data Management
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Upload student data, verify, and create batches for training programs
                            </p>
                        </div>

                        {(studentsData.length > 0 || summary) && (
                            <button 
                                onClick={handleReset}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <FaTrash className="text-sm" /> Reset All
                            </button>
                        )}
                    </div>

                    {/* Step Indicator */}
                    <div className="mt-6 flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
                        {[
                            { step: 1, icon: FaUpload, label: "Upload Data", status: activeStep >= 1 ? "completed" : "pending" },
                            { step: 2, icon: FaClipboardList, label: "Review & Verify", status: activeStep >= 2 ? "completed" : "pending" },
                            { step: 3, icon: FaUserGraduate, label: "Create Batches", status: activeStep >= 3 ? "completed" : "pending" }
                        ].map((item, idx) => (
                            <div key={item.step} className="flex items-center flex-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        item.status === "completed" 
                                            ? "bg-green-500 text-white" 
                                            : activeStep === item.step 
                                            ? "bg-blue-600 text-white" 
                                            : "bg-gray-200 text-gray-500"
                                    }`}>
                                        <item.icon className="text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Step {item.step}</p>
                                        <p className="text-sm font-medium text-gray-700">{item.label}</p>
                                    </div>
                                </div>
                                {idx < 2 && (
                                    <div className="flex-1 h-0.5 mx-4 bg-gray-200">
                                        <div className={`h-full ${activeStep > item.step ? "bg-green-500" : "bg-gray-200"}`} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Upload Section */}
                {activeStep === 1 && (
                    <UploadSection
                        file={file}
                        setFile={setFile}
                        uploading={uploading}
                        handleUpload={handleUpload}
                        dragActive={dragActive}
                        setDragActive={setDragActive}
                    />
                )}

                {/* Step 2: Data Review Section */}
                {activeStep === 2 && showSummary && summary && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <SummaryCards summary={summary} />

                        {/* Data Verification Checkbox */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="dataVerified"
                                        checked={dataVerified}
                                        onChange={handleVerifyData}
                                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="dataVerified" className="text-gray-700">
                                        <span className="font-medium">I have reviewed all student data</span>
                                        <p className="text-sm text-gray-500">Confirm that all information is correct before proceeding</p>
                                    </label>
                                </div>
                                
                                {dataVerified && (
                                    <button
                                        onClick={() => setActiveStep(3)}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        Proceed to Batch Creation <FaArrowRight />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Toggle Student Details View */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setShowStudentDetails(!showStudentDetails)}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                                {showStudentDetails ? <FaEyeSlash /> : <FaEye />}
                                {showStudentDetails ? "Hide" : "Show"} Student Details
                            </button>
                            
                            <div className="text-sm text-gray-600">
                                Total Students: {studentsData.length} | Selected: {selectedStudents.size}
                            </div>
                        </div>

                        {/* Student Table */}
                        {showStudentDetails && (
                            <StudentTable
                                students={filteredStudents}
                                selectedStudents={selectedStudents}
                                onSelectStudent={handleSelectStudent}
                                onSelectAll={handleSelectAll}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                filterGender={filterGender}
                                setFilterGender={setFilterGender}
                                filterCategory={filterCategory}
                                setFilterCategory={setFilterCategory}
                                studentGroups={studentGroups}
                                groupByCentre={groupByCentre}
                                setGroupByCentre={setGroupByCentre}
                            />
                        )}
                    </div>
                )}

                {/* Step 3: Batch Creation Section */}
{activeStep === 3 && (
    <div className="space-y-6">
        {/* Batch Creation Cards */}
        <BatchCreationCards
            selectedStudentsData={studentsData.filter(s => selectedStudents.has(s.id))}
            centresList={centresList}
            coursesByCentre={coursesByCentre}
            onSubmit={async (batchData) => {
                setSubmitting(true);
                const toastId = toast.loading("Creating batches...");

                try {
                    const res = await api.post("/mis-data/batches/create/", batchData);

                    toast.update(toastId, {
                        render: res.data.message,
                        type: "success", isLoading: false, autoClose: 4000
                    });

                    // Show detailed results
                    if (res.data.errors && res.data.errors.length > 0) {
                        console.warn("Errors:", res.data.errors);
                        toast.warning(`Some batches had issues: ${res.data.errors.length} errors`);
                    }

                    setTimeout(() => {
                        setShowConfirmationModal(true);
                        // Reset after successful creation
                        setSelectedStudents(new Set());
                        setSelectedCentre(null);
                        setSelectedCourse(null);
                        setBatchPreview(null);
                    }, 2000);

                } catch (error) {
                    toast.update(toastId, {
                        render: error.response?.data?.error || "Failed to create batches",
                        type: "error", isLoading: false, autoClose: 5000
                    });
                } finally {
                    setSubmitting(false);
                }
            }}
            submitting={submitting}
        />
    </div>
)}
            </div>

            {/* Modals */}
            {showBatchModal && batchPreview && (
                <BatchFormModal
                    batchPreview={batchPreview}
                    selectedCount={selectedStudents.size}
                    onSubmit={handleCreateBatches}
                    onClose={() => setShowBatchModal(false)}
                    submitting={submitting}
                />
            )}

            {showConfirmationModal && (
                <ConfirmationModal onClose={() => setShowConfirmationModal(false)} />
            )}

            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} 
                newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss 
                draggable pauseOnHover theme="light" />
        </div>
    );
}