import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-12 text-center max-w-md">
        <div className="text-6xl mb-6">🙏</div>
        <h1 className="font-heading font-bold text-4xl mb-3">404</h1>
        <h2 className="font-heading font-semibold text-2xl mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg" data-testid="button-home">
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
