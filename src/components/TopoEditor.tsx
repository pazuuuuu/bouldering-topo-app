"use client";

import { useState, useRef, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Undo, Save, Trash } from "lucide-react";

interface Point {
    x: number;
    y: number;
}

interface TopoEditorProps {
    imageUrl: string;
    onSave: (points: Point[]) => void;
}

export function TopoEditor({ imageUrl, onSave }: TopoEditorProps) {
    const [points, setPoints] = useState<Point[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setPoints([...points, { x, y }]);
    };

    const handleUndo = () => {
        setPoints(points.slice(0, -1));
    };

    const handleClear = () => {
        setPoints([]);
    };

    const handleSave = () => {
        onSave(points);
    };

    const pointsString = points.map(p => `${p.x},${p.y}`).join(" ");

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleUndo} disabled={points.length === 0}>
                    <Undo className="w-4 h-4 mr-2" />
                    Undo
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear} disabled={points.length === 0}>
                    <Trash className="w-4 h-4 mr-2" />
                    Clear
                </Button>
                <Button size="sm" onClick={handleSave} disabled={points.length < 2}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Route
                </Button>
            </div>

            <div
                ref={containerRef}
                className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden cursor-crosshair select-none touch-none"
                onClick={handleClick}
            >
                {/* Background Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt="Topo Editor"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* SVG Overlay */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    {/* Drawing Line */}
                    <polyline
                        points={pointsString}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Points */}
                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="1.5"
                            fill="white"
                            stroke="#ef4444"
                            strokeWidth="0.5"
                        />
                    ))}
                </svg>
            </div>
            <p className="text-xs text-muted-foreground text-center">
                Click on the image to plot the route points.
            </p>
        </div>
    );
}
