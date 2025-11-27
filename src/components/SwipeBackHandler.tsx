"use client";

import { useDrag } from "@use-gesture/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function SwipeBackHandler() {
    const router = useRouter();
    const pathname = usePathname();

    const bind = useDrag(({ movement: [mx], velocity: [vx], cancel, last, active }) => {
        // Only trigger if starting from the left edge (approx 50px)
        // We can't easily detect start position in this hook without `initial` or `xy` logic,
        // but checking `mx` (movement x) is positive means dragging right.
        // To strictly emulate iOS swipe back, we usually want it to start from the edge.
        // However, for a simple JS implementation, allowing right swipe anywhere might be acceptable 
        // OR we can check `event.touches[0].clientX` in `onDragStart` equivalent.
        // Let's keep it simple: if you swipe right significantly with velocity, go back.

        // Filter out small movements
        if (mx < 50) return;

        // If swipe is fast enough or far enough
        if (last && (mx > 100 || (mx > 50 && vx > 0.5))) {
            // Prevent going back on root page
            if (pathname === "/") return;

            router.back();
        }
    }, {
        axis: 'x',
        filterTaps: true,
        // Only allow drag if starting near the left edge (e.g. < 50px)
        // @use-gesture doesn't have a direct "start from edge" config, 
        // but we can attach the bind to a specific edge element if we wanted.
        // For global window binding, we rely on the logic above.
        // Actually, let's try to attach it to `window` via `useEffect` manually if we want edge detection,
        // but `useDrag` returns props to spread.
        // Since we want this global, we will attach it to a div covering the screen or just the body.
        // But attaching to body might interfere with other interactions.

        // Better approach: An invisible div on the left edge.
    });

    // Alternative: Invisible edge overlay
    return (
        <div
            {...bind()}
            className="fixed top-0 left-0 bottom-0 w-6 z-[100] touch-pan-y"
            style={{ touchAction: 'pan-y' }} // Allow vertical scrolling, capture horizontal
        />
    );
}
