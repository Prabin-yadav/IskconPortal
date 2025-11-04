import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { AdminLayout } from "@/components/AdminLayout";

type Donation = {
  id: string;
  donorName: string;
  email: string;
  phone?: string;
  amount: number;
  purpose: string;
  note?: string;
  date: string;
  status?: "pending" | "verified" | "rejected";
  proofImageUrl?: string;
  detailsImageUrl?: string; // NEW
};

export default function AdminDonations() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const r = await fetch("/api/donations");
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as Donation[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "rejected" | "pending" }) => {
      const r = await fetch(`/api/donations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-donations"] });
      toast({ title: "Updated", description: "Donation status updated." });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Could not update", variant: "destructive" }),
  });

  const verifiedTotal = donations.filter(d => d.status === "verified").reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-3xl">Manage Donations</h1>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Verified Total</p>
            <p className="text-2xl font-bold">${verifiedTotal.toFixed(2)}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Card key={i}><CardContent className="p-6"><div className="h-20 bg-muted rounded"/></CardContent></Card>)}</div>
        ) : donations.length === 0 ? (
          <Card className="p-12 text-center"><CardContent>No donations yet</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {donations.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-0">
                  <CardTitle className="sr-only">Donation</CardTitle>
                  <CardDescription className="sr-only">Donation row</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex gap-2">
                      {d.proofImageUrl ? (
                        <a href={d.proofImageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={d.proofImageUrl} alt="Payment proof" className="w-20 h-20 object-cover rounded border" />
                        </a>
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">No proof</div>
                      )}
                      {d.detailsImageUrl ? (
                        <a href={d.detailsImageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={d.detailsImageUrl} alt="Payment details" className="w-20 h-20 object-cover rounded border" />
                        </a>
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{d.donorName}</div>
                          <div className="text-sm text-muted-foreground">{d.email}{d.phone && ` • ${d.phone}`}</div>
                        </div>
                        <div className="w-24 h-16 bg-primary/10 rounded flex items-center justify-center font-bold text-primary">
                          ${Number(d.amount).toFixed(2)}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">{d.purpose}</Badge>
                        <span className="text-sm text-muted-foreground">{format(parseISO(d.date), "MMM dd, yyyy")}</span>
                        <Badge variant={d.status === "verified" ? "default" : d.status === "rejected" ? "destructive" : "outline"}>
                          {d.status || "pending"}
                        </Badge>
                      </div>
                      {d.note && <p className="mt-2 text-sm text-muted-foreground italic">"{d.note}"</p>}
                      {d.status !== "verified" && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => updateStatus.mutate({ id: d.id, status: "verified" })} disabled={updateStatus.isPending}>Verify</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: d.id, status: "rejected" })} disabled={updateStatus.isPending}>Reject</Button>
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
    </AdminLayout>
  );
}
