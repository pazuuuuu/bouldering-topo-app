import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Fetch all areas
export function useAreas() {
    return useQuery({
        queryKey: ['areas'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('areas')
                .select(`
          *,
          boulders:boulders(count)
        `)
                .order('name');

            if (error) throw error;
            return data;
        },
    });
}

// Fetch specific area and its boulders
export function useArea(id: string | null | undefined) {
    return useQuery({
        queryKey: ['area', id],
        queryFn: async () => {
            if (!id) return null;

            // Fetch area details
            const { data: area, error: areaError } = await supabase
                .from('areas')
                .select('*')
                .eq('id', id)
                .single();

            if (areaError) throw areaError;

            // Fetch boulders for this area
            const { data: boulders, error: bouldersError } = await supabase
                .from('boulders')
                .select('*, problems(*)')
                .eq('area_id', id)
                .order('name')
                .order('created_at', { foreignTable: 'problems', ascending: true });

            if (bouldersError) throw bouldersError;

            return { area, boulders };
        },
        enabled: !!id,
    });
}

// Fetch specific boulder and its problems
export function useBoulder(id: string | null | undefined) {
    return useQuery({
        queryKey: ['boulder', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('boulders')
                .select('*, area_id, problems(*)')
                .eq('id', id)
                .order('created_at', { foreignTable: 'problems', ascending: true })
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
}
