"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLog";
import { getTodayDate } from "@/lib/date";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

function AttendanceContent() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useToast();

  const [halaqa, setHalaqa] = useState(null);
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const today = getTodayDate();

  useEffect(() => {
    async function load() {
      setError(false);
      try {
        const [
          { data: halaqaData, error: hErr },
          { data: studentsData },
          { data: attendanceData },
        ] = await Promise.all([
          supabase.from("halaqat").select("*").eq("id", id).single(),
          supabase
            .from("students")
            .select("*")
            .eq("halaqa_id", id)
            .eq("is_active", true)
            .order("name"),
          supabase
            .from("attendance")
            .select("student_id, status")
            .eq("halaqa_id", id)
            .eq("date", today),
        ]);

        if (hErr) throw hErr;

        const initialStatus = {};
        (studentsData || []).forEach((s) => {
          initialStatus[s.id] = "present";
        });
        (attendanceData || []).forEach((a) => {
          initialStatus[a.student_id] = a.status;
        });

        setHalaqa(halaqaData);
        setStudents(studentsData || []);
        setStatusMap(initialStatus);
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, today]);

  function toggleStatus(studentId) {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  }

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const rows = students.map((s) => ({
      student_id: s.id,
      halaqa_id: id,
      date: today,
      status: statusMap[s.id] || "present",
      recorded_by: user?.id,
    }));

    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,date" });

    setSaving(false);

    if (error) {
      addToast("حصل خطأ في حفظ الحضور، حاول تاني", "error");
      return;
    }

    const presentCount = Object.values(statusMap).filter((s) => s === "present").length;
    logActivity(
      "attendance_recorded",
      `تم تسجيل حضور ${halaqa?.name || "حلقة"}: ${presentCount} من ${students.length} حاضر`
    );

    addToast("تم حفظ الحضور بنجاح", "success");
  }

  const presentCount = Object.values(statusMap).filter((s) => s === "present").length;

  return (
    <div>
      <button
        onClick={() => router.push(`/halaqat/${id}`)}
        className="text-sm text-mist-400 hover:text-gold-400 mb-5 transition-colors"
      >
        → رجوع لتفاصيل الحلقة
      </button>

      {error && (
        <div className="mb-6 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل بيانات الحلقة. حاول تحديث الصفحة.
        </div>
      )}

      {loading ? (
        <div className="border border-navy-600 rounded-2xl bg-navy-800/50 divide-y divide-navy-700 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-7">
            <h1 className="font-display font-bold text-3xl text-parchment-100">
              {halaqa?.name}
            </h1>
            <p className="text-mist-400 text-sm mt-1.5">
              {new Date().toLocaleDateString("ar-EG", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {presentCount} من {students.length} حاضر
            </p>
          </div>

          {students.length === 0 ? (
            <EmptyState
              title="لا يوجد طلاب في هذه الحلقة بعد"
              description="أضفهم من صفحة تفاصيل الحلقة أولًا."
              actionLabel="← تفاصيل الحلقة"
              onAction={() => router.push(`/halaqat/${id}`)}
            />
          ) : (
            <div className="divide-y divide-navy-700 border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
              {students.map((s) => {
                const status = statusMap[s.id] || "present";
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <span className="text-parchment-100">{s.name}</span>
                    <button
                      onClick={() => toggleStatus(s.id)}
                      className={`text-sm px-4 py-1.5 rounded-full font-medium border transition-colors ${
                        status === "present"
                          ? "bg-emerald-100 text-emerald-500 border-emerald-500/20"
                          : "bg-rust-100 text-rust-500 border-rust-500/20"
                      }`}
                    >
                      {status === "present" ? "حاضر" : "غائب"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {students.length > 0 && (
            <div className="mt-7 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-7 py-3 rounded-lg font-bold transition-colors disabled:opacity-60"
              >
                {saving ? "جاري الحفظ..." : "حفظ الحضور"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <AuthGuard>
      <AttendanceContent />
    </AuthGuard>
  );
}
