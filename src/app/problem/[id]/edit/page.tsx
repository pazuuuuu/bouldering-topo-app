import { supabase } from "@/lib/supabase";
import ProblemEditFormParent from "@/components/ProblemEditForm";

export async function generateStaticParams() {
    const { data: problems } = await supabase
        .from('problems')
        .select('id');

    return (problems || []).map((problem) => ({
        id: problem.id,
    }));
}

export default function EditProblemPage() {
    return <ProblemEditFormParent />;
}
