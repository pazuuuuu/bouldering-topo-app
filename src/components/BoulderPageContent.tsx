"use client";

import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trash2, Pencil } from "lucide-react";
import { TopoViewer } from "@/components/TopoViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { useBoulder } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImageLightbox } from "@/components/ImageLightbox";


function BoulderPageContentInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { data: boulder, isLoading, error } = useBoulder(id);
    const queryClient = useQueryClient();
    const [user, setUser] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadingBoulderImage, setUploadingBoulderImage] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    const handleDeleteBoulder = async () => {
        if (!confirm("Are you sure you want to delete this boulder?")) return;
        if (!confirm("WARNING: This will delete ALL problems in this boulder. This action cannot be undone. Are you absolutely sure?")) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('boulders')
                .delete()
                .eq('id', boulder.id);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['area', boulder.area_id] });
            await queryClient.invalidateQueries({ queryKey: ['boulder', id] });

            router.push(`/area?id=${boulder.area_id}`);
        } catch (error: any) {
            console.error("Error deleting boulder:", error);
            alert("Failed to delete boulder: " + error.message);
            setIsDeleting(false);
        }
    };

    const handleDeleteProblem = async (problemId: string) => {
        if (!confirm("Are you sure you want to delete this problem?")) return;

        try {
            const { error } = await supabase
                .from('problems')
                .delete()
                .eq('id', problemId);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['boulder', id] });
        } catch (error: any) {
            console.error("Error deleting problem:", error);
            alert("Failed to delete problem: " + error.message);
        }
    };

    const handleUploadBoulderImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        setUploadingBoulderImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `boulder-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('boulders')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('boulders')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('boulders')
                .update({ image_url: publicUrlData.publicUrl })
                .eq('id', boulder.id);

            if (updateError) throw updateError;

            await queryClient.invalidateQueries({ queryKey: ['boulder', id] });
            // Also invalidate area query to update the list thumbnail
            await queryClient.invalidateQueries({ queryKey: ['area', boulder.area_id] });
        } catch (error: any) {
            console.error("Error uploading boulder image:", error);
            alert("Failed to upload image: " + error.message);
        } finally {
            setUploadingBoulderImage(false);
        }
    };

    const handleDeleteBoulderImage = async () => {
        if (!confirm("Are you sure you want to delete this image?")) return;

        try {
            const { error } = await supabase
                .from('boulders')
                .update({ image_url: null })
                .eq('id', boulder.id);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['boulder', id] });
            await queryClient.invalidateQueries({ queryKey: ['area', boulder.area_id] });
        } catch (error: any) {
            console.error("Error deleting boulder image:", error);
            alert("Failed to delete image: " + error.message);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading boulder...</div>;
    }

    if (error || !boulder) {
        return <div className="p-8 text-center">Boulder not found.</div>;
    }

    return (
        <div className="pt-safe pb-safe min-h-screen bg-background">
            <div className="container mx-auto p-4 max-w-2xl pb-24">
                <div className="mb-6 relative z-10">
                    <Button
                        variant="ghost"
                        className="pl-0 hover:bg-transparent hover:text-primary mb-2"
                        asChild
                    >
                        <Link href={`/area?id=${boulder.area_id}`}>
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Area
                        </Link>
                    </Button>
                    <div className="flex justify-between items-start mt-2">
                        <div>
                            <h1 className="text-3xl font-bold">{boulder.name}</h1>
                            {/* <p className="text-muted-foreground mt-1">Area Name</p> */}
                        </div>
                        {user && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleDeleteBoulder}
                                disabled={isDeleting}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <p className="text-muted-foreground mb-4">{boulder.description}</p>

                <div className="rounded-lg overflow-hidden border bg-muted mb-8 aspect-video relative group">
                    {boulder.image_url ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={boulder.image_url}
                                alt={boulder.name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setSelectedImage(boulder.image_url)}
                            />
                            {user && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 shadow-md"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBoulderImage();
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                            {user ? (
                                <label className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors">
                                    <span className="text-lg font-medium mb-1">
                                        {uploadingBoulderImage ? "Uploading..." : "+ Add Image"}
                                    </span>
                                    <span className="text-xs">Click to upload</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleUploadBoulderImage}
                                        disabled={uploadingBoulderImage}
                                    />
                                </label>
                            ) : (
                                <span>No Image Available</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Problems</h2>
                        {user && (
                            <Link href={`/problem/new?boulderId=${boulder.id}`}>
                                <Button size="sm" variant="outline">
                                    + Add Problem
                                </Button>
                            </Link>
                        )}
                    </div>
                    <div className="grid gap-3">
                        {boulder.problems?.map((problem: any) => (
                            <Card key={problem.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{problem.name}</span>
                                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-md">
                                                {problem.grade}
                                            </span>
                                        </div>
                                        {problem.description && (
                                            <p className="text-sm text-muted-foreground">{problem.description}</p>
                                        )}
                                    </div>
                                    {user && (
                                        <div className="flex items-center">
                                            <Link href={`/problem/${problem.id}/edit`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteProblem(problem.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {boulder.problems?.length === 0 && (
                            <p className="text-muted-foreground text-sm">No problems added yet.</p>
                        )}
                    </div>
                </div>
            </div>

            <ImageLightbox
                src={selectedImage}
                alt={boulder.name}
                onClose={() => setSelectedImage(null)}
            />
        </div>
    );
}

export default function BoulderPageContent() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <BoulderPageContentInner />
        </Suspense>
    );
}
