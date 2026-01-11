import { Link } from "react-router-dom";

export function SettingsPage() {
    return (
        <div className="w-full h-full p-8 pointer-events-auto flex items-center justify-center overflow-hidden">
            <div className="bg-card/80 backdrop-blur rounded-xl border max-w-2xl w-full p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <p className="mb-4">This is a separate setting page managed by React Router.</p>

                <div className="space-y-4">
                    <div className="p-4 border rounded bg-background/50">
                        <h3 className="font-semibold">Demo Setting</h3>
                        <p className="text-sm text-muted-foreground">Some configuration here...</p>
                    </div>
                </div>

                <div className="mt-8">
                    <Link to="/" className="px-4 py-2 bg-secondary rounded hover:opacity-80">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
