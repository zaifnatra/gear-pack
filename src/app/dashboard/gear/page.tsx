import { getGearItems } from "@/app/actions/gear"
import { GearClosetView } from "@/components/gear/GearClosetView"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function GearPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: gearItems } = await getGearItems(user.id)

    return (
        <GearClosetView
            userId={user.id}
            initialItems={gearItems || []}
        />
    )
}
