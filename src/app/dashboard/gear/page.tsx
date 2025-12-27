import { getGearItems } from "@/app/actions/gear"
import { GearClosetView } from "@/components/gear/GearClosetView"

export default async function GearPage() {
    const dummyUserId = "user-123" // Placeholder
    const { data: gearItems } = await getGearItems(dummyUserId)

    return (
        <GearClosetView
            userId={dummyUserId}
            initialItems={gearItems || []}
        />
    )
}
