import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event, Donation, SevaLog, Book, User as UserType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Heart, Users, BookOpen, Clock, TrendingUp } from "lucide-react";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { AdminLayout } from "@/components/AdminLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "events"));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
    },
  });

  const { data: donations = [] } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const r = await fetch("/api/donations");
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as Array<{ amount: number; purpose: string; status?: "pending"|"verified"|"rejected" }>;
    },
  });

  // MOVE sevaLogs ABOVE computed usage
  const { data: sevaLogs = [] } = useQuery({
    queryKey: ["admin-seva"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "sevaLogs"));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SevaLog));
    },
  });

  // Compute verified donations and approved seva only
  const verified = donations.filter((d: any) => d.status === "verified");
  const totalDonations = verified.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
  const approvedSeva = sevaLogs.filter((log: any) => log.status === "done");
  const totalSevaHours = approvedSeva.reduce((sum: number, log: any) => sum + (Number(log.hours) || 0), 0);

  const { data: books = [] } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "books"));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Book));
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "users"));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserType));
    },
  });

  // Chart Data
  const donationsByPurpose = verified.reduce((acc, d) => {
    acc[d.purpose] = (acc[d.purpose] || 0) + Number(d.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const doughnutData = {
    labels: Object.keys(donationsByPurpose),
    datasets: [
      {
        label: "Donations by Purpose",
        data: Object.values(donationsByPurpose),
        backgroundColor: [
          "rgba(243, 156, 18, 0.8)",
          "rgba(122, 31, 47, 0.8)",
          "rgba(52, 152, 219, 0.8)",
          "rgba(46, 204, 113, 0.8)",
          "rgba(155, 89, 182, 0.8)",
          "rgba(241, 196, 15, 0.8)",
          "rgba(230, 126, 34, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const eventsByCategory = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = {
    labels: Object.keys(eventsByCategory),
    datasets: [
      {
        label: "Events by Category",
        data: Object.values(eventsByCategory),
        backgroundColor: "rgba(243, 156, 18, 0.8)",
        borderColor: "rgba(243, 156, 18, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-heading font-bold text-4xl mb-3">Admin Dashboard</h1>
          <p className="text-lg opacity-90">Portal analytics and management overview</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Donations (Verified)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${totalDonations.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approved Seva Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalSevaHours.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avg Verified Donation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="stat-avg-donation">
                ${verified.length > 0 ? (totalDonations / verified.length).toFixed(0) : "0"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Donations by Purpose</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(donationsByPurpose).length > 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <Doughnut
                    data={doughnutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No donation data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Events by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(eventsByCategory).length > 0 ? (
                <div className="h-80">
                  <Bar
                    data={barData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No event data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
