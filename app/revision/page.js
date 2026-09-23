"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";
import RevisionFormModal from "@/components/RevisionFormModal";
import RecordHistoryTable from "@/components/RecordHistoryTable";
import { Skeleton, SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

function RevisionContent() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [halaqat, setHalaqat] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedHalaqa, setSelectedHalaqa] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
    if (searchParams.get("new") === "1") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchRecords();
  }, [selectedHalaqa]);

  const fetchInitialData = async () => {
    try {
      const [{ data: halaqatData, error: hErr }, { data: studentsData, error: sErr }] =
        await Promise.all([
          supabase.from("halaqat").select("id, name, teacher_name, is_active").order("name"),
          supabase.from("students").select("id, name, halaqa_id, is_active").order("name"),
        ]);

      if (hErr) throw hErr;
      if (sErr) throw sErr;

      setHalaqat(halaqatData || []);
      setStudents(studentsData || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      addToast("حدث خطأ أثناء تحميل البيانات", "error");
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("revision_records")
        .select(`
          *,
          students (name),
          halaqat (name)
        `)
        .order("date", { ascending: false })
        .limit(100);

      if (selectedHalaqa) {
        query = query.eq("halaqa_id", selectedHalaqa);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching revision records:", error);
      addToast("حدث خطأ أثناء تحميل سجلات المراجعة", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    fetchRecords();
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-100 glow-text-gold">
          المراجعة
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          تسجيل مراجعة جديدة
        </button>
      </div>

      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h2 className="text-parchment-100 font-bold font-display text-sm">تصفية السجلات</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedHalaqa}
            onChange={(e) => setSelectedHalaqa(e.target.value)}
            className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-parchment-100 focus:border-gold-500 outline-none w-full sm:w-64"
          >
            <option value="">جميع الحلقات</option>
            {halaqat.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-600 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-4">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            title="لا توجد سجلات مراجعة"
            description="لم يتم تسجيل أي مراجعة حتى الآن"
            actionLabel="تسجيل مراجعة"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <RecordHistoryTable
            records={records}
            type="revision"
            showStudentName={true}
          />
        )}
      </div>

      <RevisionFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSave}
        students={students}
        halaqat={halaqat}
      />
    </div>
  );
}

export default function RevisionPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8"><Skeleton className="h-64 w-full rounded-2xl" /></div>}>
        <RevisionContent />
      </Suspense>
    </AuthGuard>
  );
}
