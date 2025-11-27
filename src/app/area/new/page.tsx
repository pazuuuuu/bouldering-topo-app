"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function AreaForm() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageFiles, setImageFiles] = useState<{ [key: number]: File | null }>({
        1: null,
        2: null,
        3: null
    });
    const router = useRouter();
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

    const handleImageChange = (slot: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFiles(prev => ({ ...prev, [slot]: e.target.files![0] }));
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `area-maps/${fileName}`;

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

        setSubmitting(true);
        try {
            const imageUrls: { [key: string]: string } = {};

            for (let i = 1; i <= 3; i++) {
                const file = imageFiles[i];
                if (file) {
                    try {
                        imageUrls[`image_url_${i}`] = await uploadImage(file);
                    } catch (uploadErr: any) {
                        throw new Error(`Failed to upload image ${i}: ${uploadErr.message}`);
                    }
                }
            }

            const { data, error } = await supabase
                .from('areas')
                .insert({
                    name,
                    description,
                    image_url_1: imageUrls['image_url_1'] || null,
                    image_url_2: imageUrls['image_url_2'] || null,
                    image_url_3: imageUrls['image_url_3'] || null
                })
                .select()
                .single();

            if (error) throw error;

            // Invalidate queries to ensure fresh data
            await queryClient.invalidateQueries({ queryKey: ['areas'] });

            router.push(`/area?id=${data.id}`);
            router.refresh();
        } catch (error: any) {
            console.error("Error creating area:", error);
            alert("Failed to create area: " + error.message);
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
                    <h1 className="text-2xl font-bold">Add New Area</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium">Area Map Images (Optional)</label>
                        <p className="text-xs text-muted-foreground">
                            Upload up to 3 maps or topos showing boulder locations.
                        </p>

                        {[1, 2, 3].map((slot) => (
                            <div key={slot} className="border p-4 rounded-md bg-muted/20">
                                <label className="block text-sm font-medium mb-2">Map {slot}</label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange(slot)}
                                    className="cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Area Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. Magic Wood"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description of the area..."
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

export default function NewAreaPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AreaForm />
        </Suspense>
    );
}
