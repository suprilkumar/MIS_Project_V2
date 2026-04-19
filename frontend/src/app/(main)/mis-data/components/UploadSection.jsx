"use client";

import { FaFileCsv, FaUpload, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";  // Add this import

export default function UploadSection({ file, setFile, uploading, handleUpload, dragActive, setDragActive }) {
    
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
        }
    };

    const validateAndSetFile = (file) => {
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
            setFile(file);
            toast.success(`File selected: ${file.name}`);
        } else {
            toast.error("Please upload a CSV or Excel file");
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaUpload className="text-blue-600" /> Upload Student Data
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                    Upload a CSV or Excel file containing student enrollment data with Application Date (DD/MM/YYYY format)
                </p>
                <p className="text-gray-500 text-xs mt-1">
                    Required columns: Course Location, Course Applied, Category, Payment Status, Gender, Application Date
                </p>
            </div>

            <div className="p-6">
                <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <FaFileCsv className="text-4xl text-gray-400 mx-auto mb-3" />

                    {file ? (
                        <div className="space-y-2">
                            <FaCheckCircle className="text-green-500 text-2xl mx-auto" />
                            <p className="text-gray-700 font-medium">{file.name}</p>
                            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            <button 
                                onClick={() => setFile(null)} 
                                className="text-red-500 text-sm hover:text-red-600"
                            >
                                Remove file
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 mb-2">Drag and drop your file here, or</p>
                            <label className="inline-block">
                                <input 
                                    type="file" 
                                    accept=".csv,.xlsx,.xls" 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                />
                                <span className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                                    <FaUpload className="text-sm" /> Browse Files
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-3">
                                Supported formats: CSV, Excel (.xlsx, .xls) | Max file size: 10MB
                            </p>
                        </>
                    )}
                </div>

                {file && (
                    <div className="mt-6 flex justify-center">
                        <button 
                            onClick={() => handleUpload(file)} 
                            disabled={uploading}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            {uploading ? (
                                <><FaSpinner className="animate-spin" /> Processing...</>
                            ) : (
                                <><FaUpload /> Upload & Process File</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}