"use client"

import { useState } from "react"
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { 
    FaArrowLeft, FaMapMarkerAlt, FaCode, FaCity, FaBuilding, 
    FaPhone, FaEnvelope, FaInfoCircle, FaSave, FaTimes,
    FaCheckCircle, FaExclamationTriangle, 
} from 'react-icons/fa';
import { MdLocationCity, MdOutlineDescription } from 'react-icons/md';
import "react-toastify/dist/ReactToastify.css";

export default function AddCentrePage() {
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        centre_name: "",
        centre_address: "",
        centre_state: "Delhi",
        centre_contact: "",
        centre_email: "",
        centre_desc: ""
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.centre_name.trim()) {
            newErrors.centre_name = "Centre name is required";
        }
        if (!formData.centre_address.trim()) {
            newErrors.centre_address = "Centre address is required";
        }
        if (!formData.centre_state.trim()) {
            newErrors.centre_state = "Centre state is required";
        }
        if (formData.centre_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.centre_email)) {
            newErrors.centre_email = "Invalid email format";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error("Please fix the errors before submitting");
            return;
        }
        
        setSubmitting(true);
        
        const toastId = toast.loading("Adding centre...");
        
        try {
            const response = await api.post("/core/centres/", formData);
            
            if (response.status === 201 || response.status === 200) {
                toast.update(toastId, {
                    render: response.data.message || "Centre added successfully!",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });
                
                // Reset form
                setFormData({
                    centre_name: "",
                    centre_address: "",
                    centre_state: "",
                    centre_contact: "",
                    centre_email: "",
                    centre_desc: ""
                });
                
                // Optional: Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = "/core/centres";
                }, 2000);
            }
        } catch (error) {
            console.error("Error adding centre:", error);
            
            let errorMessage = "Error connecting to server";
            
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "Unauthorized access. Please login again.";
                } else if (error.response.status === 403) {
                    errorMessage = "You don't have permission to perform this action.";
                } else if (error.response.data) {
                    if (typeof error.response.data === 'object') {
                        const fieldErrors = Object.entries(error.response.data)
                            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                            .join(', ');
                        errorMessage = fieldErrors || error.response.data.message || errorMessage;
                    } else {
                        errorMessage = error.response.data.message || errorMessage;
                    }
                }
            }
            
            toast.update(toastId, {
                render: errorMessage,
                type: "error",
                isLoading: false,
                autoClose: 4000
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <Link 
                        href="/core/centres" 
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4 group"
                    >
                        <FaArrowLeft className="mr-2 text-sm group-hover:-translate-x-1 transition-transform" />
                        Back to Centres
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Add New Centre</h1>
                            <p className="mt-2 text-gray-600">Fill in the details below to register a new examination centre.</p>
                        </div>
                        
                    </div>
                </div>

                <div >
                    {/* Main Form Card - Takes 2/3 of space on large screens */}
                    <div className="w-full">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Form Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <FaBuilding className="text-white text-xl" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Centre Information</h2>
                                        <p className="text-blue-100 text-sm mt-0.5">Please provide accurate details for the new centre</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Centre Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Centre Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className={`relative rounded-lg shadow-sm ${errors.centre_name ? 'ring-2 ring-red-500' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaBuilding className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input 
                                            type="text" 
                                            name="centre_name" 
                                            className={`block w-full pl-10 pr-3 py-3 border ${errors.centre_name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400`}  
                                            value={formData.centre_name} 
                                            onChange={handleChange} 
                                            required 
                                            disabled={submitting}
                                            placeholder="e.g., NIELIT Delhi Centre"
                                        />
                                    </div>
                                    {errors.centre_name && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <FaExclamationTriangle className="text-xs" /> {errors.centre_name}
                                        </p>
                                    )}
                                </div>

                                {/* Centre Address */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Centre Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className={`relative rounded-lg shadow-sm ${errors.centre_address ? 'ring-2 ring-red-500' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <textarea 
                                            name="centre_address" 
                                            rows="3"
                                            className={`block w-full pl-10 pr-3 py-3 border ${errors.centre_address ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400 resize-none`}  
                                            value={formData.centre_address} 
                                            onChange={handleChange} 
                                            required 
                                            disabled={submitting}
                                            placeholder="Enter complete address with street, area, city, and PIN code"
                                        />
                                    </div>
                                    {errors.centre_address && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <FaExclamationTriangle className="text-xs" /> {errors.centre_address}
                                        </p>
                                    )}
                                </div>

                                {/* Two Column Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   

                                    {/* Centre State */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Centre State <span className="text-red-500">*</span>
                                        </label>
                                        <div className={`relative rounded-lg shadow-sm ${errors.centre_state ? 'ring-2 ring-red-500' : ''}`}>
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MdLocationCity className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input 
                                                type="text" 
                                                name="centre_state" 
                                                className={`block w-full pl-10 pr-3 py-3 border ${errors.centre_state ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400`}  
                                                value={formData.centre_state} 
                                                onChange={handleChange} 
                                                required 
                                                disabled={submitting}
                                                placeholder="e.g., Delhi"
                                            />
                                        </div>
                                        {errors.centre_state && (
                                            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                <FaExclamationTriangle className="text-xs" /> {errors.centre_state}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Contact Number
                                        </label>
                                        <div className="relative rounded-lg shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaPhone className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input 
                                                type="tel" 
                                                name="centre_contact" 
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"  
                                                value={formData.centre_contact} 
                                                onChange={handleChange} 
                                                disabled={submitting}
                                                placeholder="e.g., 011-12345678"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Email Address
                                        </label>
                                        <div className={`relative rounded-lg shadow-sm ${errors.centre_email ? 'ring-2 ring-red-500' : ''}`}>
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaEnvelope className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input 
                                                type="email" 
                                                name="centre_email" 
                                                className={`block w-full pl-10 pr-3 py-3 border ${errors.centre_email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400`}  
                                                value={formData.centre_email} 
                                                onChange={handleChange} 
                                                disabled={submitting}
                                                placeholder="centre@example.com"
                                            />
                                        </div>
                                        {errors.centre_email && (
                                            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                                <FaExclamationTriangle className="text-xs" /> {errors.centre_email}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Description
                                    </label>
                                    <div className="relative rounded-lg shadow-sm">
                                        <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                                            <MdOutlineDescription className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <textarea 
                                            name="centre_desc" 
                                            rows="3"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400 resize-none"  
                                            value={formData.centre_desc} 
                                            onChange={handleChange} 
                                            disabled={submitting}
                                            placeholder="Brief description about the centre (facilities, capacity, etc.)"
                                        />
                                    </div>
                                </div>

                                {/* Form Footer with Submit Button */}
                                <div className="pt-6 border-t border-gray-200">
                                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                                        <Link
                                            href="/core/centres"
                                            className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 text-center"
                                        >
                                            <FaTimes className="inline mr-2" />
                                            Cancel
                                        </Link>
                                        <button 
                                            type="submit" 
                                            disabled={submitting}
                                            className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                                                submitting ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            {submitting ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Adding Centre...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center">
                                                    <FaSave className="mr-2" />
                                                    Add Centre
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                
                </div>

                {/* Help Card */}
                <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-start gap-3">
                        <FaInfoCircle className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-semibold text-blue-800 mb-2">Important Information</h3>
                            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                <li>All fields marked with <span className="text-red-500 font-semibold">*</span> are mandatory</li>
                                <li>Double-check the address and contact details for accuracy before submission</li>
                                <li>Centre will be active immediately after successful creation</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer 
                position="top-right" 
                autoClose={3000} 
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
}