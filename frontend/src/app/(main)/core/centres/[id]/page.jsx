
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaEdit, FaTrash, FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, FaInfoCircle } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '@/lib/api';
import CentreSkeleton from '@/components/ui/CentreSkeleton';

export default function CentreDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [centre, setCentre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetchCentre();
  }, [id]);

  const fetchCentre = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/centres/${id}/`);
      setCentre(res.data);
    } catch (error) {
      toast.error('Failed to load centre details');
      router.push('/dashboard/admin/centres');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/centres/${id}/`);
      toast.success('Centre deleted successfully');
      router.push('/dashboard/admin/centres');
    } catch (error) {
      toast.error('Failed to delete centre');
    }
  };

  if (loading) return <CentreSkeleton />;
  if (!centre) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/admin/centres" className="p-2 rounded-lg bg-white shadow hover:bg-gray-50">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Centre Details</h1>
        </div>

        {/* Centre Card */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <FaBuilding className="text-blue-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{centre.centre_name}</h2>
                <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {centre.centre_state}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Address */}
            {centre.centre_address && (
              <div className="flex gap-3">
                <FaMapMarkerAlt className="mt-1 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-800">{centre.centre_address}</p>
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {centre.centre_contact && (
                <div className="flex gap-3">
                  <FaPhone className="mt-1 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="text-gray-800">{centre.centre_contact}</p>
                  </div>
                </div>
              )}
              {centre.centre_email && (
                <div className="flex gap-3">
                  <FaEnvelope className="mt-1 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="text-gray-800">{centre.centre_email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {centre.centre_desc && (
              <div className="flex gap-3">
                <FaInfoCircle className="mt-1 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{centre.centre_desc}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t p-6 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/dashboard/admin/centres/edit/${centre.id}`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition"
            >
              <FaEdit /> Edit Centre
            </Link>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              <FaTrash /> Delete Centre
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-2">Delete Centre</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{centre.centre_name}</strong>? All associated courses and enrollments will be affected.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}