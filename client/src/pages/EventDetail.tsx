import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Event } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, ArrowLeft, UserPlus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [contact, setContact] = useState(user?.phone || user?.email || "");
  const [role, setRole] = useState("");

  const { data: event, isLoading } = useQuery({
    enabled: !!id,
    queryKey: ["event", id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, "events", id!));
      if (!snap.exists()) throw new Error("Event not found");
      return { id: snap.id, ...snap.data() } as Event;
    },
  });

  type NewRegistration = { eventId: string; name: string; contact: string; role: string };
  const registerMutation = useMutation({
    mutationFn: async (data: NewRegistration) => {
      await addDoc(collection(db, "registrations"), {
        ...data,
        userId: user?.uid || "guest",
        status: "pending",
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful!",
        description: "You have been registered for this event.",
      });
      setRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    registerMutation.mutate({ eventId: id, name, contact, role });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-muted rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="font-heading font-bold text-2xl mb-4">Event Not Found</h2>
          <Button onClick={() => navigate("/events")} data-testid="button-back-events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/events")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="font-heading font-bold text-3xl" data-testid="text-event-title">
                    {event.title}
                  </h1>
                  <Badge variant="secondary">{event.category}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{format(parseISO(event.date), "MMMM dd, yyyy")} at {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{event.venue}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">Description</h3>
                  <p className="text-foreground leading-relaxed">{event.description}</p>
                </div>

                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">Location</h3>
                  <p className="text-muted-foreground mb-4">{event.address}</p>
                  {event.lat && event.lng && (
                    <div className="aspect-video bg-muted rounded-md overflow-hidden">
                      <iframe
                        title="Event Location"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://www.google.com/maps?q=${event.lat},${event.lng}&z=15&output=embed`}
                        data-testid="map-event-location"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volunteer Registration */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Volunteer Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      data-testid="input-volunteer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact (phone/WhatsApp/email)</Label>
                    <Input
                      id="contact"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      data-testid="input-volunteer-contact"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Volunteer Role</Label>
                    <Input
                      id="role"
                      placeholder="e.g., Setup, Coordination, etc."
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      data-testid="input-volunteer-role"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? "Registering..." : "Register as Volunteer"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
