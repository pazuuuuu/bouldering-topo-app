"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Download, Loader2 } from "lucide-react";
import { useAreas } from "@/hooks/use-queries";
import { usePrefetchAll } from "@/hooks/use-prefetch";
import { AuthButton } from "@/components/AuthButton";
import { AuthWrapper } from "@/components/AuthWrapper";

export default function Home() {
  const { data: areas, isLoading, error } = useAreas();
  const { prefetchAll, isLoading: isDownloading, progress, total } = usePrefetchAll();

  if (isLoading) {
    return <div className="p-8 text-center">Loading areas...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error loading areas.</div>;
  }

  return (
    <div className="pt-safe pb-safe min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-2xl pb-24">
        <header className="mb-8 text-center relative z-10">
          <div className="absolute right-0 top-0">
            <AuthButton />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 pt-8">Bouldering Topo</h1>
          <p className="text-muted-foreground mb-4">Find your next project.</p>

          <Button
            variant="outline"
            size="sm"
            onClick={prefetchAll}
            disabled={isDownloading}
            className="gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading... ({progress}/{total})
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Offline Data
              </>
            )}
          </Button>

          <div className="mt-4">
            <AuthWrapper>
              <Link href="/area/new">
                <Button size="sm" variant="default">
                  + Add Area
                </Button>
              </Link>
            </AuthWrapper>
          </div>
        </header>

        <div className="grid gap-4">
          {areas?.map((area: any) => (
            <Link key={area.id} href={`/area?id=${area.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {area.name}
                  </CardTitle>
                  <CardDescription>
                    {area.boulders?.[0]?.count ?? 0} Boulders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}

          {areas?.length === 0 && (
            <div className="text-center p-8 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No areas found.</p>
              <p className="text-xs text-muted-foreground mt-2">
                (If you just set up Supabase, the database might be empty.)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
