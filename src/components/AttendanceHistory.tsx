import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface AttendanceRecord {
  id: string;
  subject_id: string;
  date: string;
  status: string;
  teacher_present: boolean | null;
  attendance_taken: boolean | null;
  created_at: string;
}

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  onRefresh: () => void;
}

export default function AttendanceHistory({ records, onRefresh }: AttendanceHistoryProps) {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("attendance_records").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting record",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Record deleted",
        description: "Attendance record has been removed.",
      });
      onRefresh();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return "✅";
      case "absent":
        return "❌";
      case "holiday":
        return "🏖️";
      case "no_class":
        return "📭";
      default:
        return "•";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Present";
      case "absent":
        return "Absent";
      case "holiday":
        return "Holiday";
      case "no_class":
        return "No Class";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "text-safe";
      case "absent":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No attendance records yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Attendance History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{getStatusIcon(record.status)}</span>
              <div>
                <p className={`font-medium text-sm ${getStatusColor(record.status)}`}>
                  {getStatusLabel(record.status)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(record.date), "EEE, MMM d, yyyy")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(record.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}