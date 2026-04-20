'use client';

import { FaExclamationTriangle, FaTrash, FaTimes } from 'react-icons/fa';

export default function DeleteConfirmModal({ student, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="text-red-600 text-xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Student</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete <span className="font-semibold">{student.candidate_name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <FaTimes /> Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}