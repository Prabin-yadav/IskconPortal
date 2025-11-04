import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Event, InsertEvent } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar, MapPin } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
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
import { AdminLayout } from "@/components/AdminLayout";

export default function AdminEvents() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "events"));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      if (!user?.uid) throw new Error("Not authenticated");

      // Build payload without undefined fields
      const payload: any = {
        title: data.title,
        date: data.date,
        time: data.time,
        venue: data.venue,
        address: data.address,
        description: data.description,
        category: data.category,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      };
      if (typeof data.lat === "number" && !Number.isNaN(data.lat)) payload.lat = data.lat;
      if (typeof data.lng === "number" && !Number.isNaN(data.lng)) payload.lng = data.lng;

      await addDoc(collection(db, "events"), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event Created!", description: "The event has been added successfully." });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create event", variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "events", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event Deleted",
        description: "The event has been removed.",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setVenue("");
    setAddress("");
    setLat("");
    setLng("");
    setDescription("");
    setCategory("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      toast({ title: "Not signed in", description: "Please login as admin", variant: "destructive" });
      return;
    }
    addEventMutation.mutate({
      title,
      date,
      time,
      venue,
      address,
      lat: lat !== "" ? parseFloat(lat) : (undefined as any),
      lng: lng !== "" ? parseFloat(lng) : (undefined as any),
      description,
      category,
    });
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-4xl mb-3">Manage Events</h1>
              <p className="text-lg opacity-90">Create and manage spiritual events</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-add-event">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading">Create New Event</DialogTitle>
                  <DialogDescription>Add a new spiritual event or gathering</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      data-testid="input-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        data-testid="input-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        data-testid="input-time"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Festival, Lecture, Workshop"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      data-testid="input-category"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue *</Label>
                    <Input
                      id="venue"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      required
                      data-testid="input-venue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      rows={2}
                      data-testid="input-address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude (Optional)</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        placeholder="e.g., 27.7172"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        data-testid="input-lat"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude (Optional)</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        placeholder="e.g., 85.3240"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        data-testid="input-lng"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      data-testid="input-description"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addEventMutation.isPending}
                    data-testid="button-submit"
                  >
                    {addEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="p-16 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading font-semibold text-xl mb-2">No Events Created</h3>
            <p className="text-muted-foreground mb-6">Create your first event to get started</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} data-testid={`event-card-${event.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="secondary">{event.category}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      data-testid={`button-delete-${event.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <CardTitle className="font-heading">{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(parseISO(event.date), "MMM dd, yyyy")} at {event.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                  </div>
                </CardContent>
               <div className="px-6 pb-4">
                 <Button asChild variant="outline" size="sm">
                   <RouterLink to={`/admin/events/${event.id}`}>View Volunteers</RouterLink>
                 </Button>
               </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
