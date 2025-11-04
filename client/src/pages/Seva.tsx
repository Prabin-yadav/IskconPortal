import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, addDoc, query as firestoreQuery, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import type { SevaLog } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Clock, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";

export default function Seva() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [hours, setHours] = useState("");
  const [role, setRole] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [timeStr, setTimeStr] = useState(new Date().toISOString().slice(11, 16)); // "HH:MM"

  const { data: sevaLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["seva-logs", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = firestoreQuery(
        collection(db, "sevaLogs"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SevaLog));
    },
    enabled: !!user,
  });

  const addSevaMutation = useMutation({
    mutationFn: async (data: { eventTitle: string; hours: number; role: string; date: string; time?: string; note?: string }) => {
      if (!user) throw new Error("Must be logged in");

      const hrs = Number(data.hours);
      const trimmedRole = (data.role || "").trim();
      const trimmedTitle = (data.eventTitle || "").trim();
      if (!trimmedTitle) throw new Error("Event is required");
      if (!Number.isFinite(hrs) || hrs <= 0) throw new Error("Hours must be a positive number");
      if (!trimmedRole) throw new Error("Role is required");
      if (!data.date) throw new Error("Date is required");

     // Validate: date+time should not be before now
     const now = new Date();
     const dt = new Date(`${data.date}T${(data.time || "00:00")}:00`);
     if (dt.getTime() < now.getTime()) {
       throw new Error("Date and time cannot be in the past.");
     }

      const payload: any = {
        eventTitle: trimmedTitle,
        hours: hrs,
        role: trimmedRole,
        date: data.date,
        time: data.time || null,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        status: "pending", // admin must mark done/not_done
      };
      if (data.note && data.note.trim()) payload.note = data.note.trim();

      await addDoc(collection(db, "sevaLogs"), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seva-logs", user?.uid] });
      toast({ title: "Seva Submitted!", description: "Awaiting admin review." });
      setIsDialogOpen(false);
      setEventTitle("");
      setHours("");
      setRole("");
      setNote("");
      // keep date as is; reset time to now
      setTimeStr(new Date().toISOString().slice(11, 16));
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to log seva",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSevaMutation.mutate({
      eventTitle,
      hours: Number(hours) as any,
      role,
      date,
      time: timeStr,
      note: note || undefined,
    });
  };

  // Count only approved ("done"). Treat missing status as done (for old records).
  const approvedLogs = sevaLogs.filter((log: any) => (log.status ?? "done") === "done");
  const totalHours = approvedLogs.reduce((sum, log: any) => sum + (Number(log.hours) || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="font-heading font-bold text-2xl mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to log and track your seva hours.
          </p>
          <Button asChild data-testid="button-signin-required">
            <Link to="/login">Sign In</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Users className="h-10 w-10" />
            <h1 className="font-heading font-bold text-4xl">Seva Logging</h1>
          </div>
          <p className="text-lg opacity-90 text-center">
            Track your volunteer service hours and contributions
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Total Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{totalHours.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground mt-2">hours of service</p>
            </CardContent>
          </Card>

          {/* Total Sevas */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Total Sevas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{sevaLogs.length}</p>
              <p className="text-sm text-muted-foreground mt-2">seva entries logged</p>
            </CardContent>
          </Card>

          {/* Add Seva Button */}
          <Card className="bg-accent flex items-center justify-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-add-seva">
                  <Plus className="mr-2 h-5 w-5" />
                  Log New Seva
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Log Seva Hours</DialogTitle>
                  <DialogDescription>
                    Record your volunteer service for an event
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventTitle">Event *</Label>
                    <Input
                      id="eventTitle"
                      placeholder="e.g., Sunday Feast, Kirtan Night"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      required
                      data-testid="input-event-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hours">Hours *</Label>
                      <Input
                        id="hours"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        required
                        data-testid="input-hours"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                        data-testid="input-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={timeStr}
                        onChange={(e) => setTimeStr(e.target.value)}
                        required
                        data-testid="input-time"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role *</Label>
                    <Input
                      id="role"
                      placeholder="e.g., Setup, Coordination, Cooking"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      data-testid="input-role"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Any additional details..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      data-testid="input-note"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addSevaMutation.isPending}
                    data-testid="button-submit-seva"
                  >
                    {addSevaMutation.isPending ? "Logging..." : "Log Seva"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        {/* Seva History */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Seva History</CardTitle>
            <CardDescription>Your recorded volunteer service entries</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-md">
                    <div className="h-12 w-12 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sevaLogs.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-heading font-semibold text-lg mb-2">No Seva Logged Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start logging your volunteer service hours
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sevaLogs.map((log) => {
                   return (
                     <div
                       key={log.id}
                       className="flex items-start gap-4 p-4 border rounded-md hover-elevate"
                       data-testid={`seva-log-${log.id}`}
                     >
                       <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-md flex flex-col items-center justify-center">
                         <span className="text-2xl font-bold text-primary">
                           {log.hours}
                         </span>
                         <span className="text-xs text-muted-foreground">hrs</span>
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className="font-semibold text-lg mb-1">
                          {(log as any).eventTitle || "Event"}
                         </h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline">{log.role}</Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(log.date), "MMM dd, yyyy")}
                          </span>
                         {"time" in log && log.time && (
                           <span className="text-sm text-muted-foreground">{String((log as any).time)}</span>
                         )}
                         <Badge
                           variant={(log as any).status === "done" ? "default" : (log as any).status === "not_done" ? "destructive" : "secondary"}
                         >
                           {(log as any).status ? String((log as any).status) : "done"}
                         </Badge>
                        </div>
                        {log.note && (
                          <p className="text-sm text-muted-foreground">{log.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
