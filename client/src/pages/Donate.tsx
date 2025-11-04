import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Donate() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [donorName, setDonorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [note, setNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [detailsFile, setDetailsFile] = useState<File | null>(null);

  const [lookupEmail, setLookupEmail] = useState("");

  async function generateReceipt(d: any) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.text("Donation Receipt", 20, 20);
    pdf.text(`Receipt ID: ${d.id}`, 20, 30);
    pdf.text(`Name: ${d.donorName}`, 20, 40);
    pdf.text(`Email: ${d.email}`, 20, 50);
    pdf.text(`Amount (INR): ₹${Number(d.amount).toFixed(2)}`, 20, 60);
    pdf.text(`Purpose: ${d.purpose}`, 20, 70);
    pdf.text(`Date: ${new Date(d.date).toLocaleString()}`, 20, 80);
    pdf.save(`receipt-${d.id}.pdf`);
  }

  const donateMutation = useMutation({
    mutationFn: async (form: FormData) => {
      const r = await fetch("/api/donations", { method: "POST", body: form });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Donation submitted!", description: "Awaiting admin verification." });
      setDonorName(""); setEmail(""); setPhone(""); setAmount(""); setPurpose(""); setNote("");
      setProofFile(null); setDetailsFile(null);
      // if signed in, refresh "My Donations" automatically
      if (user?.email) refetch();
    },
    onError: (e: any) => {
      toast({ title: "Donation Failed", description: e?.message || "Unable to process donation", variant: "destructive" });
    },
  });

  // Auto-load for signed-in users; guests can still look up by email
  const effectiveEmail = (user?.email || lookupEmail).trim();
  const autoEmail = !!user?.email;
  const { data: myDonations = [], refetch, isFetching } = useQuery({
    enabled: autoEmail, // auto-fetch when user is logged in
    queryKey: ["my-donations", effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return [];
      const r = await fetch(`/api/donations?email=${encodeURIComponent(effectiveEmail)}`);
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    const finalPurpose = purpose.trim() || "General Donation";
    if (!donorName.trim() || !email.trim() || !Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Invalid details", description: "Name, email and a valid amount are required.", variant: "destructive" });
      return;
    }
    const form = new FormData();
    form.append("donorName", donorName.trim());
    form.append("email", email.trim());
    if (phone.trim()) form.append("phone", phone.trim());
    form.append("amount", String(amt));
    form.append("purpose", finalPurpose);
    if (note.trim()) form.append("note", note.trim());
    if (proofFile) form.append("proof", proofFile);
    if (detailsFile) form.append("details", detailsFile);
    donateMutation.mutate(form);
  };

  // Payment config (set in .env as VITE_*). Falls back to UPI demo ID.
  const payUrl = (import.meta.env.VITE_PAY_URL as string | undefined) || "";
  const upiId = (import.meta.env.VITE_UPI_ID as string | undefined) || "iskcon@upi";
  const upiName = (import.meta.env.VITE_UPI_NAME as string | undefined) || "ISKCON";
  const amtNum = Number(amount);
  const upiLink =
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&cu=INR` +
    (Number.isFinite(amtNum) && amtNum > 0 ? `&am=${amtNum.toFixed(2)}` : "") +
    (purpose.trim() ? `&tn=${encodeURIComponent(purpose.trim())}` : "");
  const qrValue = payUrl || upiLink;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Scan & Pay (QR)</CardTitle>
            <CardDescription>Scan with any payment app to pay in INR</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="p-2 bg-white rounded border inline-block">
              <img
                src="/QR.jpg"
                alt="Donation QR"
                className="w-32 h-32 object-contain"
                loading="lazy"
              />
            </div>
            <div className="text-sm">
              <div className="font-medium mb-1">Suggested steps</div>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                <li>Scan the QR with your UPI/payment app</li>
                <li>Enter amount in INR</li>
                <li>Complete payment and upload the proof below</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Make a Donation</CardTitle>
            <CardDescription>Upload payment proof; admin will verify it.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={donorName} onChange={(e) => setDonorName(e.target.value)} required /></div>
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div><Label>Amount (INR)</Label><Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
              </div>
              <div><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="General Donation" /></div>
              <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
              <div>
                <Label>Payment Proof (image)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <Label>Payment Details (optional image)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setDetailsFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" disabled={donateMutation.isPending}>
                {donateMutation.isPending ? "Submitting..." : "Submit Donation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-heading text-xl">My Donations</CardTitle>
            <CardDescription>Check status and download receipt after verification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user?.email ? (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing donations for {user.email}</span>
                <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
                  {isFetching ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Enter your email" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} />
                <Button onClick={() => lookupEmail.trim() && refetch()} disabled={!lookupEmail.trim() || isFetching}>
                  {isFetching ? "Searching..." : "Find"}
                </Button>
              </div>
            )}
            {Array.isArray(myDonations) && myDonations.length > 0 && (
              <div className="space-y-2">
                {myDonations.map((d: any) => (
                  <div key={d.id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{d.purpose} • ₹{Number(d.amount).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(d.date).toLocaleDateString()} • Status: {d.status || "pending"}
                      </div>
                    </div>
                    {d.status === "verified" ? (
                      <Button variant="outline" onClick={() => generateReceipt(d)}>Download Receipt</Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Awaiting verification</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
