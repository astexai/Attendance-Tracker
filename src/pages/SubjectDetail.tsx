import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AttendanceChart from "@/components/AttendanceChart";
import AttendanceFlow from "@/components/AttendanceFlow";
import ZoneBadge from "@/components/ZoneBadge";
import AttendanceHistory from "@/components/AttendanceHistory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Subject {
  id: string;
  name: string;
  user_id: string;
}

interface AttendanceRecord {
  id: string;
  subject_id: string;
  date: string;
  status: string;
  teacher_present: boolean | null;
  attendance_taken: boolean | null;
  created_at: string;
}

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAttendanceFlow, setShowAttendanceFlow] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubjectData();
    }
  }, [id]);

  const fetchSubjectData = async () => {
    setIsLoading(true);

    // Fetch subject
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", id)
      .single();

    if (subjectError) {
      toast({
        title: "Error loading subject",
        description: subjectError.message,
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setSubject(subjectData);

    // Fetch attendance records
    const { data: recordsData, error: recordsError } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("subject_id", id)
      .order("date", { ascending: false });

    if (recordsError) {
      toast({
        title: "Error loading attendance",
        description: recordsError.message,
        variant: "destructive",
      });
    } else {
      setRecords(recordsData || []);
    }

    setIsLoading(false);
  };

  const handleDeleteSubject = async () => {
    setIsDeleting(true);

    const { error } = await supabase.from("subjects").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting subject",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subject deleted",
        description: "The subject and all its records have been deleted.",
      });
      navigate("/dashboard");
    }

    setIsDeleting(false);
  };

  const handleAttendanceComplete = () => {
    setShowAttendanceFlow(false);
    fetchSubjectData();
  };

  // Calculate stats
  const countableRecords = records.filter((r) => r.status === "present" || r.status === "absent");
  const totalClasses = countableRecords.length;
  const totalPresent = countableRecords.filter((r) => r.status === "present").length;
  const totalAbsent = totalClasses - totalPresent;
  const percentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
  const holidayCount = records.filter((r) => r.status === "holiday").length;
  const noClassCount = records.filter((r) => r.status === "no_class").length;

  // Calculate classes needed for 75%
  const calculateClassesNeeded = () => {
    if (percentage >= 75) return 0;
    // Formula: (present + x) / (total + x) >= 0.75
    // present + x >= 0.75 * total + 0.75 * x
    // 0.25 * x >= 0.75 * total - present
    // x >= (0.75 * total - present) / 0.25
    // x >= 3 * total - 4 * present
    const needed = Math.ceil(3 * totalClasses - 4 * totalPresent);
    return Math.max(0, needed);
  };

  const classesNeeded = calculateClassesNeeded();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subject) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{subject.name}</h1>
            <div className="flex items-center gap-2">
              <ZoneBadge percentage={percentage} showLabel />
              <span className="text-sm text-muted-foreground">• {percentage}%</span>
            </div>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
              <Trash2 className="w-5 h-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{subject.name}" and all its attendance records.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSubject}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      {/* Attendance Flow Modal */}
      {showAttendanceFlow && (
        <AttendanceFlow
          subjectId={subject.id}
          userId={user?.id || ""}
          onComplete={handleAttendanceComplete}
          onCancel={() => setShowAttendanceFlow(false)}
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalClasses}</p>
            <p className="text-xs text-muted-foreground">Total Classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-safe">{totalPresent}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-danger">{totalAbsent}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{classesNeeded}</p>
            <p className="text-xs text-muted-foreground">Need for 75%</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {totalClasses > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceChart present={totalPresent} absent={totalAbsent} />
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      {(holidayCount > 0 || noClassCount > 0) && (
        <div className="flex gap-4 mb-6 text-sm text-muted-foreground">
          {holidayCount > 0 && <span>🏖️ {holidayCount} holidays</span>}
          {noClassCount > 0 && <span>📭 {noClassCount} cancelled</span>}
        </div>
      )}

      {/* Mark Attendance Button */}
      <Button className="w-full mb-6 gap-2" onClick={() => setShowAttendanceFlow(true)}>
        <Plus className="w-4 h-4" />
        Mark Attendance
      </Button>

      {/* Attendance History */}
      <AttendanceHistory records={records} onRefresh={fetchSubjectData} />
    </div>
  );
}