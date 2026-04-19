"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "react-toastify";

export function useMISData() {
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState(new Set());

    const uploadFile = useCallback(async (file) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const res = await api.post("/mis-data/upload/", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setStudents(res.data.students);
            setSummary(res.data.summary);
            return res.data;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const verifyData = useCallback(async () => {
        try {
            await api.post("/mis-data/confirm-upload/");
            return true;
        } catch (error) {
            throw error;
        }
    }, []);

    const createBatches = useCallback(async (batchData) => {
        setLoading(true);
        try {
            const res = await api.post("/mis-data/batches/create/", batchData);
            return res.data;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const getBatchPreview = useCallback(async (centreId, courseId, studentIds) => {
        setLoading(true);
        try {
            const res = await api.get(`/mis-data/batches/preview/?centre_id=${centreId}&course_id=${courseId}&student_ids=${studentIds}`);
            return res.data;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const getCentres = useCallback(async () => {
        try {
            const res = await api.get("/mis-data/batches/create/");
            return res.data.centres;
        } catch (error) {
            throw error;
        }
    }, []);

    const getCoursesByCentre = useCallback(async (centreId) => {
        try {
            const res = await api.get(`/mis-data/centres/${centreId}/courses/`);
            return res.data.courses;
        } catch (error) {
            throw error;
        }
    }, []);

    const reset = useCallback(() => {
        setStudents([]);
        setSummary(null);
        setSelectedStudents(new Set());
    }, []);

    return {
        loading,
        students,
        summary,
        selectedStudents,
        setSelectedStudents,
        uploadFile,
        verifyData,
        createBatches,
        getBatchPreview,
        getCentres,
        getCoursesByCentre,
        reset
    };
}