"use client";

import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaChevronLeft, FaChevronRight, FaBuilding, FaBookOpen,
    FaSpinner, FaUsers, FaArrowLeft
} from 'react-icons/fa';
import "react-toastify/dist/ReactToastify.css";
import BatchCreationCards from "../components/BatchCreationCards";

export default function BatchCreationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [studentsData, setStudentsData] = useState([]);
    const [centresList, setCentresList] = useState([]);
    const [coursesByCentre, setCoursesByCentre] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch saved students
            const studentsRes = await api.get("/mis-data/students/saved/");
            setStudentsData(studentsRes.data.students);
            
            // Fetch centres
            const centresRes = await api.get("/mis-data/centres/");
            setCentresList(centresRes.data.centres);
            
            // Fetch courses for each centre
            for (const centre of centresRes.data.centres) {
                const coursesRes = await api.get(`/mis-data/centres/${centre.id}/courses/`);
                setCoursesByCentre(prev => ({ ...prev, [centre.id]: coursesRes.data.courses }));
            }
            
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatches = async (batchData) => {
        setSubmitting(true);
        const toastId = toast.loading("Creating batches...");

        try {
            const res = await api.post("/mis-data/batches/create/", batchData);

            toast.update(toastId, {
                render: res.data.message,
                type: "success", isLoading: false, autoClose: 4000
            });

            if (res.data.errors && res.data.errors.length > 0) {
                console.warn("Errors:", res.data.errors);
            }

        } catch (error) {
            toast.update(toastId, {
                render: error.response?.data?.error || "Failed to create batches",
                type: "error", isLoading: false, autoClose: 5000
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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

                {/* Batch Creation Cards */}
                <BatchCreationCards
                    selectedStudentsData={studentsData}
                    centresList={centresList}
                    coursesByCentre={coursesByCentre}
                    onSubmit={handleCreateBatches}
                    submitting={submitting}
                />
            </div>
            <ToastContainer position="top-right" autoClose={5000} />
        </div>
    );
}