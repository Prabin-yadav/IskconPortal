import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

type SevaLog = {
  id: string;
  userId: string;
  eventTitle: string;
  hours: number;
  role: string;
  date: string;
  time?: string | null;
  note?: string;
  status?: "pending" | "done" | "not_done";
  createdAt?: string;
};

export default function AdminSeva() {
  const { toast } = useToast();

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-seva"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "sevaLogs"));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SevaLog))
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "done" | "not_done" | "pending" }) => {
      await updateDoc(doc(db, "sevaLogs", id), { status });
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Seva status updated." });
      refetch();
    },
    onError: (e: any) => {
      toast({ title: "Failed", description: e?.message || "Could not update", variant: "destructive" });
    },
  });

  const approved = logs.filter((l) => (l.status ?? "done") === "done");
  const totalHours = approved.reduce((s, l) => s + Number(l.hours || 0), 0);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <section className="bg-secondary text-secondary-foreground py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading font-bold text-4xl mb-2">Manage Seva Logs</h1>
                <p className="opacity-90">Review and mark seva entries as done or not done</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-75">Approved Hours</p>
                <p className="text-4xl font-bold">{totalHours.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <Card className="p-12 text-center">
              <CardContent>No seva logs yet</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardHeader className="pb-0">
                    <CardTitle className="sr-only">Seva</CardTitle>
                    <CardDescription className="sr-only">Seva row</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-20 h-16 bg-primary/10 rounded flex flex-col items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-lg font-bold text-primary">{Number(log.hours).toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground">hrs</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{log.eventTitle}</div>
                            <div className="text-sm text-muted-foreground">
                              {log.role} • {log.userId}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={log.status === "done" ? "default" : log.status === "not_done" ? "destructive" : "secondary"}>
                              {log.status || "pending"}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(log.date), "MMM dd, yyyy")}
                          </span>
                          {log.time && <span>{log.time}</span>}
                          {log.note && <span className="italic">“{log.note}”</span>}
                        </div>
                        {log.status !== "done" && (
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={() => updateStatus.mutate({ id: log.id, status: "done" })} disabled={updateStatus.isPending}>
                              Mark Done
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: log.id, status: "not_done" })} disabled={updateStatus.isPending}>
                              Not Done
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}