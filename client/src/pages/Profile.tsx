import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query as firestoreQuery, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { SevaLog, Donation } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Clock, Heart, Award, TrendingUp } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  const { data: sevaLogs = [] } = useQuery({
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

  const { data: donations = [] } = useQuery({
    queryKey: ["donations", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const r = await fetch(`/api/donations?email=${encodeURIComponent(user!.email!)}`);
      if (!r.ok) throw new Error(await r.text());
      const all = await r.json();
      return all.filter((d: any) => d.status === "verified");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="font-heading font-bold text-2xl mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your profile.
          </p>
          <Link href="/login">
            <Button data-testid="button-signin-required">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const totalSevaHours = sevaLogs
    .filter((log: any) => (log.status ?? "done") === "done")
    .reduce((sum, log: any) => sum + (Number(log.hours) || 0), 0);
  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-secondary-foreground/20">
              <AvatarFallback className="text-2xl font-heading">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading font-bold text-4xl mb-1" data-testid="text-user-name">{user.name}</h1>
              <p className="text-lg opacity-90" data-testid="text-user-email">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={user.role === "admin" ? "default" : "secondary"} data-testid="badge-user-role">
                {user.role}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Total Seva Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary" data-testid="stat-seva-hours">{totalSevaHours.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                Total Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary" data-testid="stat-total-donations">${totalDonations.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {totalSevaHours >= 10 && (
                  <Badge variant="outline" className="text-xs">
                    10+ Hours
                  </Badge>
                )}
                {totalDonations >= 100 && (
                  <Badge variant="outline" className="text-xs">
                    Generous
                  </Badge>
                )}
                {sevaLogs.length >= 5 && (
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Seva Contributions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total entries:</span>
                    <span className="font-medium">{sevaLogs.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total hours:</span>
                    <span className="font-medium">{totalSevaHours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg hours/seva:</span>
                    <span className="font-medium">
                      {sevaLogs.length > 0
                        ? (totalSevaHours / sevaLogs.length).toFixed(1)
                        : "0.0"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Donation Contributions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total donations:</span>
                    <span className="font-medium">{donations.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total amount:</span>
                    <span className="font-medium">${totalDonations.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg donation:</span>
                    <span className="font-medium">
                      ${donations.length > 0
                        ? (totalDonations / donations.length).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Since */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Member since {new Date(user.joinedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
