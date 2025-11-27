import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImageLightboxProps {
    src: string | null;
    alt: string;
    onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!src) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-10 w-10 z-[60]"
                onClick={onClose}
            >
                <X className="h-6 w-6" />
            </Button>

            <div
                className="w-full h-full flex items-center justify-center"
            >
                <TransformWrapper
                    initialScale={1}
                    minScale={1}
                    maxScale={4}
                    centerOnInit
                >
                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt={alt}
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </TransformComponent>
                </TransformWrapper>
            </div>
        </div>
    );
}
