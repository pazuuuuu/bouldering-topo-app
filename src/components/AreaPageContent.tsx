"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Mountain, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useArea } from "@/hooks/use-queries";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { ImageLightbox } from "@/components/ImageLightbox";

// Define types locally
interface Area {
    id: string;
    name: string;
    description: string;
    image_url_1?: string;
    image_url_2?: string;
    image_url_3?: string;
}

interface Boulder {
    id: string;
    name: string;
    image_url: string;
    problems: { id: string; grade: string }[];
}

export default function AreaPageContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { data, isLoading, error } = useArea(id);
    const [user, setUser] = useState<any>(null);
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    if (isLoading) {
        return <div className="p-8 text-center">Loading area...</div>;
    }

    if (error || !data) {
        return <div className="p-8 text-center text-red-500">Error loading area.</div>;
    }

    const { area, boulders } = data;

    if (!area) {
        console.error("Area data is missing", data);
        return <div className="p-8 text-center text-red-500">Area data not found.</div>;
    }

    const handleUploadImage = async (slot: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        setUploadingSlot(slot);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `area-maps/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('boulders')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('boulders')
                .getPublicUrl(filePath);

            const updateData: any = {};
            updateData[`image_url_${slot}`] = publicUrlData.publicUrl;

            const { error: updateError } = await supabase
                .from('areas')
                .update(updateData)
                .eq('id', area.id);

            if (updateError) throw updateError;

            await queryClient.invalidateQueries({ queryKey: ['area', id] });
        } catch (error: any) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image: " + error.message);
        } finally {
            setUploadingSlot(null);
        }
    };

    const handleDeleteImage = async (slot: number) => {
        if (!confirm("Are you sure you want to delete this map?")) return;

        try {
            const updateData: any = {};
            updateData[`image_url_${slot}`] = null;

            const { error } = await supabase
                .from('areas')
                .update(updateData)
                .eq('id', area.id);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['area', id] });
        } catch (error: any) {
            console.error("Error deleting image:", error);
            alert("Failed to delete image: " + error.message);
        }
    };

    const handleDeleteArea = async () => {
        if (!confirm("Are you sure you want to delete this area?")) return;
        if (!confirm("WARNING: This will delete ALL boulders and problems in this area. This action cannot be undone. Are you absolutely sure?")) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('areas')
                .delete()
                .eq('id', area.id);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['areas'] });

            router.push('/');
        } catch (error: any) {
            console.error("Error deleting area:", error);
            alert("Failed to delete area: " + error.message);
            setIsDeleting(false);
        }
    };

    return (
        <div className="pt-safe pb-safe min-h-screen bg-background">
            <div className="container mx-auto p-4 max-w-2xl pb-24">
                <div className="mb-6 relative z-10">
                    <Button
                        variant="ghost"
                        className="pl-0 hover:bg-transparent hover:text-primary mb-2"
                        asChild
                    >
                        <a href="/">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Areas
                        </a>
                    </Button>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mt-2 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">{area.name}</h1>
                            <p className="text-muted-foreground mt-1">{area.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex gap-2">
                                {user && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={handleDeleteArea}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Link href={`/topo/new?areaId=${area.id}`}>
                                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                                Add Boulder
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Area Maps Section */}
                    <div className="mt-6 mb-8">
                        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Area Maps</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map((slot) => {
                                // @ts-ignore
                                const imageUrl = area[`image_url_${slot}`];
                                return (
                                    <div key={slot} className="relative group">
                                        {imageUrl ? (
                                            <div className="rounded-lg overflow-hidden border bg-muted aspect-video relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={imageUrl}
                                                    alt={`Map ${slot} of ${area.name}`}
                                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setSelectedImage(imageUrl)}
                                                />
                                                {user && (
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-8 w-8 shadow-md"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent opening image
                                                            handleDeleteImage(slot);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            user && (
                                                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center aspect-video bg-muted/10 hover:bg-muted/20 transition-colors relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => handleUploadImage(slot, e)}
                                                        disabled={uploadingSlot === slot}
                                                    />
                                                    {uploadingSlot === slot ? (
                                                        <span className="text-xs text-muted-foreground">Uploading...</span>
                                                    ) : (
                                                        <>
                                                            <span className="text-2xl mb-1 text-muted-foreground">+</span>
                                                            <span className="text-xs text-muted-foreground">Add Map {slot}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4">
                    <h2 className="text-xl font-semibold">Boulders</h2>
                    {boulders?.map((boulder: any) => (
                        <Link key={boulder.id} href={`/boulder?id=${boulder.id}`}>
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden">
                                <div className="aspect-video w-full relative bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={boulder.image_url || "https://placehold.co/600x400/png?text=No+Image"}
                                        alt={boulder.name}
                                        className="object-cover w-full h-full"
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent navigation
                                            e.stopPropagation();
                                            setSelectedImage(boulder.image_url || "https://placehold.co/600x400/png?text=No+Image");
                                        }}
                                    />
                                </div>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Mountain className="h-5 w-5 text-primary" />
                                            {boulder.name}
                                        </span>
                                        <span className="text-sm font-normal text-muted-foreground">
                                            {boulder.problems?.length ?? 0} Problems
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {/* @ts-ignore: Supabase types inference issue */}
                                        {boulder.problems?.map((prob: any) => (
                                            <span key={prob.id} className="text-xs bg-secondary px-2 py-1 rounded-md">
                                                {prob.grade}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                    {boulders?.length === 0 && (
                        <p className="text-muted-foreground">No boulders found in this area.</p>
                    )}
                </div>
            </div>

            {/* Image Lightbox */}
            <ImageLightbox
                src={selectedImage}
                alt="Enlarged view"
                onClose={() => setSelectedImage(null)}
            />
        </div>
    );
}
