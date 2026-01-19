import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Calendar as CalendarIcon, Check, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type FlowStep =
  | "college_status"
  | "select_date"
  | "teacher_present"
  | "attendance_taken"
  | "mark_attendance";

interface AttendanceFlowProps {
  subjectId: string;
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function AttendanceFlow({
  subjectId,
  userId,
  onComplete,
  onCancel,
}: AttendanceFlowProps) {
  const [step, setStep] = useState<FlowStep>("college_status");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [teacherPresent, setTeacherPresent] = useState<boolean | null>(null);
  const [attendanceTaken, setAttendanceTaken] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const saveAttendance = async (
    status: "present" | "absent" | "holiday" | "no_class",
    teacherPresentValue?: boolean | null,
    attendanceTakenValue?: boolean | null
  ) => {
    if (!selectedDate) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("attendance_records").upsert(
      {
        subject_id: subjectId,
        user_id: userId,
        date: format(selectedDate, "yyyy-MM-dd"),
        status,
        teacher_present: teacherPresentValue,
        attendance_taken: attendanceTakenValue,
      },
      {
        onConflict: "subject_id,date",
      }
    );

    if (error) {
      toast({
        title: "Error saving attendance",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Attendance saved",
        description: `Marked as ${status} for ${format(selectedDate, "MMM d, yyyy")}`,
      });
      onComplete();
    }

    setIsSubmitting(false);
  };

  const handleCollegeStatus = (isOn: boolean) => {
    if (!isOn) {
      // College is off - mark as holiday
      saveAttendance("holiday");
    } else {
      setStep("select_date");
    }
  };

  const handleDateSelected = () => {
    if (selectedDate) {
      setStep("teacher_present");
    }
  };

  const handleTeacherPresent = (present: boolean) => {
    setTeacherPresent(present);
    if (present) {
      setStep("mark_attendance");
    } else {
      setStep("attendance_taken");
    }
  };

  const handleAttendanceTaken = (taken: boolean) => {
    setAttendanceTaken(taken);
    if (taken) {
      setStep("mark_attendance");
    } else {
      // No attendance taken - no class
      saveAttendance("no_class", false, false);
    }
  };

  const handleMarkAttendance = (status: "present" | "absent") => {
    saveAttendance(status, teacherPresent, attendanceTaken);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Mark Attendance</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "college_status" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">Is college on today?</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleCollegeStatus(false)}
                >
                  <span className="text-2xl">🏖️</span>
                  <span>Holiday</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleCollegeStatus(true)}
                >
                  <span className="text-2xl">📚</span>
                  <span>College On</span>
                </Button>
              </div>
            </div>
          )}

          {step === "select_date" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">Select date</p>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date > new Date()}
                  className="rounded-md border"
                />
              </div>
              <Button className="w-full" onClick={handleDateSelected} disabled={!selectedDate}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          )}

          {step === "teacher_present" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Was the teacher present?
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleTeacherPresent(false)}
                >
                  <span className="text-2xl">❌</span>
                  <span>No</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleTeacherPresent(true)}
                >
                  <span className="text-2xl">✅</span>
                  <span>Yes</span>
                </Button>
              </div>
            </div>
          )}

          {step === "attendance_taken" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Was attendance taken?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleAttendanceTaken(false)}
                >
                  <span className="text-2xl">📭</span>
                  <span>No</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleAttendanceTaken(true)}
                >
                  <span className="text-2xl">📋</span>
                  <span>Yes</span>
                </Button>
              </div>
            </div>
          )}

          {step === "mark_attendance" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Were you present or absent?
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 border-danger hover:bg-danger/10"
                  onClick={() => handleMarkAttendance("absent")}
                  disabled={isSubmitting}
                >
                  <AlertCircle className="w-6 h-6 text-danger" />
                  <span className="text-danger">Absent</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 border-safe hover:bg-safe/10"
                  onClick={() => handleMarkAttendance("present")}
                  disabled={isSubmitting}
                >
                  <Check className="w-6 h-6 text-safe" />
                  <span className="text-safe">Present</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}