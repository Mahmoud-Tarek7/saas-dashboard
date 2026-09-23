"use client";

import { useEffect, useState, Suspense } from "react";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";
import MemorizationFormModal from "@/components/MemorizationFormModal";
import RecordHistoryTable from "@/components/RecordHistoryTable";
import { SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { formatLocalDate } from "@/lib/date";
import { useSearchParams, useRouter } from "next/navigation";

function MemorizationPageContent() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [halaqat, setHalaqat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterHalaqa, setFilterHalaqa] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch halaqat
      const { data: halaqatData, error: halaqatError } = await supabase
        .from("halaqat")
        .select("*")
        .order("name");
      if (halaqatError) throw halaqatError;
      setHalaqat(halaqatData || []);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .order("name");
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
    } catch (error) {
      console.error(error);
      addToast("حدث خطأ أثناء جلب البيانات الأساسية", "error");
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("memorization_records")
        .select("*, students(name), halaqat(name)")
        .order("date", { ascending: false })
        .limit(100);

      if (filterHalaqa) {
        query = query.eq("halaqa_id", filterHalaqa);
      }

      if (filterDate !== "all") {
        const today = new Date();
        if (filterDate === "today") {
          query = query.gte("date", formatLocalDate(today));
        } else if (filterDate === "week") {
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          query = query.gte("date", formatLocalDate(lastWeek));
        } else if (filterDate === "month") {
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          query = query.gte("date", formatLocalDate(lastMonth));
        }
      }

      const { data: recordsData, error: recordsError } = await query;
      if (recordsError) throw recordsError;
      setRecords(recordsData || []);
    } catch (error) {
      console.error(error);
      addToast("حدث خطأ أثناء جلب السجلات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterHalaqa, filterDate]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (searchParams.get("new")) {
      router.replace("/memorization");
    }
  };

  const handleSaveModal = () => {
    fetchRecords();
    setIsModalOpen(false);
    if (searchParams.get("new")) {
      router.replace("/memorization");
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-100 glow-text-gold">
          التسميع والحفظ
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          تسجيل تسميع جديد
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterHalaqa}
          onChange={(e) => setFilterHalaqa(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-parchment-100 focus:border-gold-500 outline-none"
        >
          <option value="">جميع الحلقات</option>
          {halaqat.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-parchment-100 focus:border-gold-500 outline-none"
        >
          <option value="all">كل الأوقات</option>
          <option value="today">اليوم</option>
          <option value="week">هذا الأسبوع</option>
          <option value="month">هذا الشهر</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : records.length === 0 ? (
        <EmptyState title="لم يتم تسجيل أي تسميع حتى الآن" />
      ) : (
        <RecordHistoryTable
          records={records}
          type="memorization"
          showStudentName={true}
        />
      )}

      {isModalOpen && (
        <MemorizationFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
          students={students}
          halaqat={halaqat}
        />
      )}
    </div>
  );
}

export default function MemorizationPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-6"><SkeletonRow /></div>}>
        <MemorizationPageContent />
      </Suspense>
    </AuthGuard>
  );
}
