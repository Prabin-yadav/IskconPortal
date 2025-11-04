import { useParams, Link as RouterLink } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, query as firestoreQuery, where, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@shared/schema";

type Registration = {
  id: string;
  eventId: string;
  name: string;
  contact: string;
  role: string;
  userId: string;
  status?: "pending" | "participated" | "not_participated";
  timestamp?: string;
};

export default function AdminEventVolunteers() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: event } = useQuery({
    enabled: !!id,
    queryKey: ["admin-event", id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, "events", id!));
      if (!snap.exists()) throw new Error("Event not found");
      return { id: snap.id, ...snap.data() } as Event;
    },
  });

  const { data: regs = [], refetch, isLoading } = useQuery({
    enabled: !!id,
    queryKey: ["admin-event-registrations", id],
    queryFn: async () => {
      const q = firestoreQuery(collection(db, "registrations"), where("eventId", "==", id));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Registration))
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ regId, status }: { regId: string; status: "participated" | "not_participated" | "pending" }) => {
      await updateDoc(doc(db, "registrations", regId), { status });
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Volunteer status updated." });
      refetch();
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Could not update", variant: "destructive" }),
  });

  const total = regs.length;
  const participated = regs.filter(r => r.status === "participated").length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <section className="bg-secondary text-secondary-foreground py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <h1 className="font-heading font-bold text-3xl">
                {event ? `Volunteers • ${event.title}` : "Volunteers"}
              </h1>
              <div className="text-right">
                <p className="text-sm opacity-75">Participated</p>
                <p className="text-2xl font-bold">{participated}/{total}</p>
              </div>
            </div>
            <RouterLink to="/admin/events">
              <Button variant="outline" className="mt-3">Back to Events</Button>
            </RouterLink>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-16 bg-muted rounded"/></CardContent></Card>)}</div>
          ) : regs.length === 0 ? (
            <Card className="p-12 text-center"><CardContent>No volunteers yet</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {regs.map(reg => (
                <Card key={reg.id}>
                  <CardHeader className="pb-0">
                    <CardTitle className="sr-only">Volunteer</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{reg.name}</div>
                            <div className="text-sm text-muted-foreground">{reg.contact}</div>
                          </div>
                          <Badge variant={reg.status === "participated" ? "default" : reg.status === "not_participated" ? "destructive" : "secondary"}>
                            {reg.status || "pending"}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline">{reg.role}</Badge>
                        </div>
                        {reg.status !== "participated" && (
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={() => setStatus.mutate({ regId: reg.id, status: "participated" })} disabled={setStatus.isPending}>
                              Mark Participated
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ regId: reg.id, status: "not_participated" })} disabled={setStatus.isPending}>
                              Not Participated
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