"use client";

import { FaCheckCircle, FaTimes } from "react-icons/fa";
import Link from "next/link";

export default function ConfirmationModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full text-center p-6">
                <div className="mb-4">
                    <FaCheckCircle className="text-green-500 text-6xl mx-auto" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
                <p className="text-gray-600 mb-6">
                    Batches have been created successfully. Students have been enrolled in their respective courses.
                </p>
                
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                    <Link
                        href="/course-management"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                        View Batches
                    </Link>
                </div>
            </div>
        </div>
    );
}