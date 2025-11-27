import { supabase } from "@/lib/supabase";
import BoulderPageContent from "@/components/BoulderPageContent";

// Revalidate every 60 seconds
export const revalidate = 60;

export async function generateStaticParams() {
    const { data: boulders } = await supabase.from('boulders').select('id');
    return boulders?.map(({ id }) => ({ id })) ?? [];
}

export default function BoulderPage() {
    return <BoulderPageContent />;
}
