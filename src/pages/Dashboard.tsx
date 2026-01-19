import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, LogOut, Loader2, ChevronRight } from "lucide-react";
import ZoneBadge from "@/components/ZoneBadge";

interface Subject {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export default function Dashboard() {
  const { profile, signOut, loading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectStats, setSubjectStats] = useState<Record<string, AttendanceStats>>({});
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      fetchSubjects();
    }
  }, [loading, profile]);

  const fetchSubjects = async () => {
    setIsLoadingSubjects(true);
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading subjects",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubjects(data || []);
      // Fetch stats for each subject
      if (data) {
        const stats: Record<string, AttendanceStats> = {};
        for (const subject of data) {
          const { data: records } = await supabase
            .from("attendance_records")
            .select("status")
            .eq("subject_id", subject.id)
            .in("status", ["present", "absent"]);

          const total = records?.length || 0;
          const present = records?.filter((r) => r.status === "present").length || 0;
          const absent = total - present;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

          stats[subject.id] = { total, present, absent, percentage };
        }
        setSubjectStats(stats);
      }
    }
    setIsLoadingSubjects(false);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSubjectName.trim()) {
      toast({
        title: "Enter subject name",
        description: "Please enter a name for your subject.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    const { error } = await supabase.from("subjects").insert({
      name: newSubjectName.trim(),
      user_id: profile?.user_id,
    });

    if (error) {
      toast({
        title: "Error adding subject",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subject added",
        description: `${newSubjectName} has been added.`,
      });
      setNewSubjectName("");
      setIsDialogOpen(false);
      fetchSubjects();
    }

    setIsAdding(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getYearLabel = (year: number | null) => {
    if (!year) return "";
    const labels = ["1st", "2nd", "3rd", "4th"];
    return labels[year - 1] + " Year";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {getYearLabel(profile?.college_year)} • Semester {profile?.semester}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Add Subject Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-6 gap-2">
            <Plus className="w-4 h-4" />
            Add Subject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubject} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                placeholder="e.g., Mathematics, Physics..."
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Subject"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subjects List */}
      {isLoadingSubjects ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : subjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-1">No subjects yet</h3>
            <p className="text-muted-foreground text-sm">
              Add your first subject to start tracking attendance
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject) => {
            const stats = subjectStats[subject.id] || { total: 0, present: 0, absent: 0, percentage: 0 };
            return (
              <Card
                key={subject.id}
                className="cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => navigate(`/subject/${subject.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium truncate">{subject.name}</h3>
                      <ZoneBadge percentage={stats.percentage} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stats.total > 0 ? (
                        <>
                          {stats.percentage}% • {stats.present}/{stats.total} classes
                        </>
                      ) : (
                        "No attendance recorded"
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}