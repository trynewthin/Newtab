import { VALID_SYSTEM_TYPES } from "@/launcher/registry/appManifest"
import type { SystemType } from "@/launcher/registry/systemRegistry"

const MODAL_ROUTE_PREFIX = "/modal/"

function getValidSystemTypes(): readonly SystemType[] {
    return VALID_SYSTEM_TYPES as readonly SystemType[]
}

function normalizeRoutePath(pathname: string): string {
    const trimmed = pathname.trim()
    if (!trimmed) {
        return "/"
    }

    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

export function getSystemDialogRoute(type: SystemType): string {
    return `${MODAL_ROUTE_PREFIX}${type}`
}

export function parseSystemDialogRoute(pathname: string): SystemType | null {
    const normalizedPath = normalizeRoutePath(pathname)
    if (!normalizedPath.startsWith(MODAL_ROUTE_PREFIX)) {
        return null
    }

    const dialogId = decodeURIComponent(normalizedPath.slice(MODAL_ROUTE_PREFIX.length))
    const validTypes = getValidSystemTypes()

    return validTypes.includes(dialogId as SystemType)
        ? (dialogId as SystemType)
        : null
}

export function resolveInitialSystemDialogFromLocationHash(hash: string): SystemType | null {
    const raw = hash.startsWith("#") ? hash.slice(1) : hash
    if (!raw) {
        return null
    }

    return parseSystemDialogRoute(raw)
}
