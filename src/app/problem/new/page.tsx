"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function ProblemForm() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [grade, setGrade] = useState("");
    const [description, setDescription] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const boulderId = searchParams.get("boulderId");
    const queryClient = useQueryClient();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } = {} } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!boulderId) {
            alert("Boulder ID is missing");
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('problems')
                .insert({
                    boulder_id: boulderId,
                    name,
                    grade,
                    description
                });

            if (error) throw error;

            // Invalidate queries to ensure fresh data
            await queryClient.invalidateQueries({ queryKey: ['boulder', boulderId] });
            // Also invalidate areas as they might show problem counts
            await queryClient.invalidateQueries({ queryKey: ['areas'] });

            router.back();
            router.refresh();
        } catch (error: any) {
            console.error("Error creating problem:", error);
            alert("Failed to create problem: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Checking authentication...</div>;
    }

    return (
        <div className="pt-safe pb-safe min-h-screen bg-background">
            <div className="container mx-auto p-4 max-w-md">
                <div className="flex items-center mb-6 relative z-50">
                    <Button
                        variant="ghost"
                        className="mr-2 pl-0 hover:bg-transparent"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold">Add New Problem</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Problem Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. Problem A"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Grade</label>
                        <Input
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            placeholder="e.g. V3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description of the problem..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function NewProblemPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProblemForm />
        </Suspense>
    );
}
