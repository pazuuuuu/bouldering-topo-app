"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function BoulderForm() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [problemName, setProblemName] = useState("");
    const [problemGrade, setProblemGrade] = useState("");
    const [problemDescription, setProblemDescription] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const areaId = searchParams.get("areaId");
    const queryClient = useQueryClient();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } = {} } = await supabase.auth.getSession(); // Added default empty object for data
            if (!session) {
                router.push("/login");
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('boulders')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('boulders')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!areaId) {
            alert("Area ID is missing");
            return;
        }

        setSubmitting(true);
        try {
            let imageUrl = "";
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            // 1. Create Boulder
            const { data: boulderData, error: boulderError } = await supabase
                .from('boulders')
                .insert({
                    area_id: areaId,
                    name,
                    description,
                    image_url: imageUrl
                })
                .select()
                .single();

            if (boulderError) throw boulderError;

            // 2. Create Problem (if provided)
            if (problemName && boulderData) {
                const { error: problemError } = await supabase
                    .from('problems')
                    .insert({
                        boulder_id: boulderData.id,
                        name: problemName,
                        grade: problemGrade,
                        description: problemDescription
                    });

                if (problemError) {
                    console.error("Error creating problem:", problemError);
                    alert("Boulder created, but failed to create problem: " + problemError.message);
                }
            }

            // Invalidate queries to ensure fresh data
            await queryClient.invalidateQueries({ queryKey: ['area', areaId] });
            await queryClient.invalidateQueries({ queryKey: ['areas'] });

            router.push(`/area/${areaId}`);
            router.refresh();
        } catch (error: any) {
            console.error("Error creating boulder:", error);
            alert("Failed to create boulder: " + error.message);
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
                    <h1 className="text-2xl font-bold">Add New Boulder</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. Image Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Boulder Image</label>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Select an image from your device.
                        </p>
                    </div>

                    {/* 2. Boulder Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Boulder Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. The Big Rock"
                        />
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <h2 className="text-lg font-semibold">First Problem (Optional)</h2>
                        <div>
                            <label className="block text-sm font-medium mb-1">Problem Name</label>
                            <Input
                                value={problemName}
                                onChange={(e) => setProblemName(e.target.value)}
                                placeholder="e.g. Problem A"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Grade</label>
                            <Input
                                value={problemGrade}
                                onChange={(e) => setProblemGrade(e.target.value)}
                                placeholder="e.g. V3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Problem Description</label>
                            <Textarea
                                value={problemDescription}
                                onChange={(e) => setProblemDescription(e.target.value)}
                                placeholder="Description of the problem..."
                            />
                        </div>
                    </div>

                    {/* 5. Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description of the boulder..."
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

export default function NewTopoPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BoulderForm />
        </Suspense>
    );
}
