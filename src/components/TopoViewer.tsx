"use client";

import { useState, useRef, useEffect } from "react";
import { Problem } from "@/types";

interface TopoViewerProps {
    imageUrl: string;
    problems: Problem[];
}

export function TopoViewer({ imageUrl, problems }: TopoViewerProps) {
    const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // For this MVP, we assume coordinates are 0-100 percentages
    // We'll use a 100x100 viewBox for simplicity

    return (
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden select-none" ref={containerRef}>
            {/* Background Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imageUrl}
                alt="Boulder Topo"
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* SVG Overlay */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none" // Or "xMidYMid slice" to match object-cover? 
            // Actually, object-cover makes it tricky to map coordinates perfectly if aspect ratios differ.
            // For MVP, let's assume the image is displayed fully or we handle aspect ratio carefully.
            // Better approach for Topo: Display image naturally (w-full h-auto) and overlay SVG on top with same aspect ratio.
            >
                {problems.map((problem) => {
                    if (!problem.lineCoordinates || problem.lineCoordinates.length === 0) return null;

                    const points = problem.lineCoordinates
                        .map((p) => `${p.x},${p.y}`)
                        .join(" ");

                    const isSelected = selectedProblemId === problem.id;

                    return (
                        <g key={problem.id}>
                            {/* Outer glow/stroke for visibility */}
                            <polyline
                                points={points}
                                fill="none"
                                stroke={isSelected ? "white" : "rgba(255,255,255,0.5)"}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* Inner color stroke */}
                            <polyline
                                points={points}
                                fill="none"
                                stroke={isSelected ? "#ef4444" : "#3b82f6"} // Red if selected, Blue otherwise
                                strokeWidth="0.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Interactive Layer (Optional: Clickable areas close to lines) */}
        </div>
    );
}
