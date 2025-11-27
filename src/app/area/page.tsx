"use client";

import { Suspense } from "react";
import AreaPageContent from "@/components/AreaPageContent";

export default function AreaPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <AreaPageContent />
        </Suspense>
    );
}
