"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function ProblemEditForm() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [grade, setGrade] = useState("");
    const [description, setDescription] = useState("");
    const [boulderId, setBoulderId] = useState<string | null>(null);
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const queryClient = useQueryClient();

    useEffect(() => {
        const init = async () => {
            // 1. Check Auth
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }

            // 2. Fetch Problem Data
            const { data: problem, error } = await supabase
                .from('problems')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !problem) {
                alert("Problem not found");
                router.back();
                return;
            }

            setName(problem.name);
            setGrade(problem.grade);
            setDescription(problem.description || "");
            setBoulderId(problem.boulder_id);
            setLoading(false);
        };
        init();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { error } = await supabase
                .from('problems')
                .update({
                    name,
                    grade,
                    description
                })
                .eq('id', id);

            if (error) throw error;

            // Invalidate queries
            if (boulderId) {
                await queryClient.invalidateQueries({ queryKey: ['boulder', boulderId] });
            }
            await queryClient.invalidateQueries({ queryKey: ['areas'] });

            router.back();
            router.refresh();
        } catch (error: any) {
            console.error("Error updating problem:", error);
            alert("Failed to update problem: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
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
                    <h1 className="text-2xl font-bold">Edit Problem</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Problem Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Grade</label>
                        <Input
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
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
                            {submitting ? "Updating..." : "Update"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}



export default function ProblemEditFormParent() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProblemEditForm />
        </Suspense>
    );
}
