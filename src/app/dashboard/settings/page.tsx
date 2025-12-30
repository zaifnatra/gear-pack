import { SettingsView } from './SettingsView'

export const metadata = {
    title: 'Settings | Gear-Pack',
    description: 'Manage your account settings',
}

export default function SettingsPage() {
    return (
        <div className="container mx-auto max-w-5xl p-6">
            <SettingsView />
        </div>
    )
}
