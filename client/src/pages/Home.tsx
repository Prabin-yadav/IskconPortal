import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DailyVerse } from "@/components/DailyVerse";
import { Calendar, BookOpen, Heart, Users, TrendingUp, Award } from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Events & Gatherings",
      description: "Join spiritual events, festivals, and community gatherings",
      icon: Calendar,
      href: "/events",
      color: "text-primary",
    },
    {
      title: "Spiritual Library",
      description: "Access multi-language sacred texts and spiritual literature",
      icon: BookOpen,
      href: "/library",
      color: "text-secondary",
    },
    {
      title: "Donate & Contribute",
      description: "Support temple activities and receive instant receipts",
      icon: Heart,
      href: "/donate",
      color: "text-primary",
    },
    {
      title: "Volunteer Seva",
      description: "Log your service hours and track contributions",
      icon: Users,
      href: "/seva",
      color: "text-secondary",
    },
    {
      title: "Progress Analytics",
      description: "View your spiritual journey and service statistics",
      icon: TrendingUp,
      href: "/profile",
      color: "text-primary",
    },
    {
      title: "Recognition",
      description: "Earn badges and recognition for dedicated service",
      icon: Award,
      href: "/profile",
      color: "text-secondary",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Invocation */}
      <section className="bg-gradient-to-br from-secondary via-secondary/95 to-primary/30 text-secondary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">ॐ</div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">
              ISKCON Digital Service Portal
            </h1>
            <p className="text-xl md:text-2xl mb-2 opacity-90 font-heading">
              seva • śraddhā • śikṣā
            </p>
            <p className="text-lg mb-8 opacity-80">
              service • devotion • learning
            </p>
            <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto opacity-90">
              Connecting devotees through events, spiritual knowledge, and selfless service.
              Join our community in the practice of bhakti yoga.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" variant="default" data-testid="button-explore-events">
                <Link to="/events">Explore Events</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                data-testid="button-browse-library"
              >
                <Link to="/library">Browse Library</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Verse Section */}
      <section className="container mx-auto px-4 -mt-10 mb-16">
        <div className="max-w-3xl mx-auto">
          <DailyVerse />
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="font-heading font-bold text-3xl text-center mb-12">
          Portal Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
             const Icon = feature.icon;
             return (
              <Link key={feature.title} to={feature.href} className="block focus:outline-none">
                <Card
                  className="h-full hover-elevate active-elevate-2 cursor-pointer transition-all"
                  data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardHeader>
                    <div className={`mb-3 ${feature.color}`}>
                      <Icon className="h-10 w-10" />
                    </div>
                    <CardTitle className="font-heading">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
             );
           })}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-accent py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-3xl mb-4">
            Join Our Community
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-muted-foreground">
            Whether you're looking to attend events, expand your spiritual knowledge, or
            contribute through seva, we welcome you with open hearts.
          </p>
          <Button asChild size="lg" data-testid="button-get-started">
            <Link to="/login">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
