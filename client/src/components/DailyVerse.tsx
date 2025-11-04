import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Verse } from "@shared/schema";
import { useState } from "react";

export function DailyVerse() {
  const [language, setLanguage] = useState<"en" | "ne" | "hi">("en");

  const { data: verse, isLoading } = useQuery({
    queryKey: ["daily-verse"],
    queryFn: async () => {
      const q = query(collection(db, "verses"), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Verse;
      }
      // Fallback verse
      return {
        id: "fallback",
        verseTextEn: "One who sees inaction in action, and action in inaction, is intelligent among men.",
        verseTextNe: "कर्ममा अकर्म र अकर्ममा कर्म देख्ने व्यक्ति मानिसहरूमध्ये बुद्धिमान् हुन्छ।",
        verseTextHi: "जो कर्म में अकर्म और अकर्म में कर्म देखता है, वह मनुष्यों में बुद्धिमान है।",
        source: "Bhagavad Gita",
        chapter: 4,
        verse: 18,
      } as Verse;
    },
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!verse) return null;

  const verseText = {
    en: verse.verseTextEn,
    ne: verse.verseTextNe,
    hi: verse.verseTextHi,
  }[language];

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-semibold text-lg text-primary">
            Verse of the Day
          </h3>
          <div className="flex gap-2">
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
              data-testid="button-lang-en"
            >
              EN
            </Button>
            <Button
              variant={language === "ne" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("ne")}
              data-testid="button-lang-ne"
            >
              ने
            </Button>
            <Button
              variant={language === "hi" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("hi")}
              data-testid="button-lang-hi"
            >
              हि
            </Button>
          </div>
        </div>
        <blockquote className="text-lg italic text-foreground mb-4 border-l-4 border-primary pl-4">
          "{verseText}"
        </blockquote>
        <p className="text-sm text-muted-foreground">
          — {verse.source}
          {verse.chapter && verse.verse && ` ${verse.chapter}.${verse.verse}`}
        </p>
      </CardContent>
    </Card>
  );
}
