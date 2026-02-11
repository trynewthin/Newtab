import { BaseModal } from "@/platform/shared/components/modal/Modal";
import { PaperEditor } from "./PaperEditor";

interface PaperDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PaperDialog({ open, onOpenChange }: PaperDialogProps) {
    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            showTitle={false}
            showCloseButton={false}
            scrollable={false}
            contentClassName="p-0 overflow-hidden"
        >
            <div className="w-full h-full bg-background rounded-2xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/5">
                <PaperEditor />
            </div>
        </BaseModal>
    );
}

