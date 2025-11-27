import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export function usePrefetchAll() {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);

    const prefetchAll = async () => {
        setIsLoading(true);
        setProgress(0);
        setTotal(0);

        try {
            // 1. Fetch all areas
            const { data: areas, error: areasError } = await supabase
                .from('areas')
                .select(`
          *,
          boulders:boulders(count)
        `)
                .order('name');

            if (areasError) throw areasError;

            // Cache areas list
            queryClient.setQueryData(['areas'], areas);

            if (!areas) return;

            // Estimate total operations (1 for areas list + 1 for each area's boulders + 1 for each boulder's details)
            // This is a rough estimate, we'll update total as we discover boulders
            let estimatedTotal = areas.length;
            setTotal(estimatedTotal);

            // 2. Iterate through each area
            for (const area of areas) {
                // Fetch boulders for this area
                const { data: boulders, error: bouldersError } = await supabase
                    .from('boulders')
                    .select('*, problems(*)')
                    .eq('area_id', area.id)
                    .order('name');

                if (bouldersError) throw bouldersError;

                // Cache area details (which includes boulders list)
                queryClient.setQueryData(['area', area.id], { area, boulders });

                setProgress(prev => prev + 1);

                if (boulders) {
                    estimatedTotal += boulders.length;
                    setTotal(estimatedTotal);

                    // 3. Iterate through each boulder
                    for (const boulder of boulders) {
                        // Fetch boulder details (including problems)
                        // Note: We already fetched problems in the area query above, 
                        // but useBoulder hook might fetch individually if we want to be safe or if schema differs.
                        // However, for efficiency, let's just ensure the 'boulder' query key is populated.

                        // We can reuse the data we just got!
                        // But useBoulder fetches: .select('*, area_id, problems(*)')
                        // The area query fetched: .select('*, problems(*)')
                        // We might need to ensure 'area_id' is present (it usually is in 'select *').

                        // Let's do a dedicated fetch for consistency with useBoulder hook if needed, 
                        // OR just set the cache if the data structure matches.
                        // To be 100% sure and robust, let's fetch individual boulder data 
                        // to match exactly what useBoulder expects.

                        const { data: boulderData, error: boulderError } = await supabase
                            .from('boulders')
                            .select('*, area_id, problems(*)')
                            .eq('id', boulder.id)
                            .single();

                        if (boulderError) throw boulderError;

                        queryClient.setQueryData(['boulder', boulder.id], boulderData);
                        setProgress(prev => prev + 1);
                    }
                }
            }

        } catch (error) {
            console.error("Error prefetching data:", error);
            alert("Failed to download data. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    return { prefetchAll, isLoading, progress, total };
}
