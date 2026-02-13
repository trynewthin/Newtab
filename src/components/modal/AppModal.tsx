"use client"

import * as React from "react"
import { cn } from "@/core/utils"
import { Search } from "lucide-react"
import { AppSurfaceModal } from "./AppSurfaceModal"
import { Sidebar, SidebarItem } from "./sidebar/Sidebar"
import { SidebarHeader } from "./sidebar/SidebarHeader"
import { usePersistedSidebarCollapsed } from "./sidebar/usePersistedSidebarCollapsed"

// ─── Sidebar item descriptor (declarative) ───
export interface AppModalSidebarItem {
    id: string
    icon: React.ElementType
    label: string
    className?: string
}

// ─── Props ───
interface AppModalBaseProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    footer?: React.ReactNode
    children: React.ReactNode
    className?: string
}

/** Legacy mode: caller manages sidebar/header/state manually */
interface AppModalManualProps extends AppModalBaseProps {
    sidebar: React.ReactNode
    isCollapsed?: boolean
    showMobileMenu?: boolean
    onCloseMobileMenu?: () => void
    header?: React.ReactNode
    // Discriminator — storageKey absent
    storageKey?: undefined
}

/** Managed mode: AppModal owns sidebar state, search, header */
interface AppModalManagedProps extends AppModalBaseProps {
    storageKey: string
    title: string
    icon: React.ElementType
    description?: React.ReactNode
    sidebarItems: AppModalSidebarItem[]
    activeId: string
    onActiveChange: (id: string) => void
    sidebarFooter?: React.ReactNode
    searchPlaceholder?: string
    searchValue?: string
    onSearchChange?: (value: string) => void
    headerChildren?: React.ReactNode
    // Manual props must NOT be passed
    sidebar?: undefined
    header?: undefined
}

export type AppModalProps = AppModalManualProps | AppModalManagedProps

function isManagedMode(props: AppModalProps): props is AppModalManagedProps {
    return typeof props.storageKey === "string"
}

export function AppModal(props: AppModalProps) {
    const {
        open,
        onOpenChange,
        footer,
        children,
        className,
    } = props

    // ─── Managed mode state ───
    const [managedCollapsed, setManagedCollapsed] = usePersistedSidebarCollapsed(
        isManagedMode(props) ? props.storageKey : "__noop__",
        true,
    )
    const [managedMobileMenu, setManagedMobileMenu] = React.useState(false)

    // ─── Resolve values ───
    const isCollapsed = isManagedMode(props) ? managedCollapsed : (props.isCollapsed ?? false)
    const showMobileMenu = isManagedMode(props) ? managedMobileMenu : (props.showMobileMenu ?? false)
    const closeMobileMenu = isManagedMode(props)
        ? () => setManagedMobileMenu(false)
        : props.onCloseMobileMenu

    // ─── Build sidebar & header ───
    let sidebarNode: React.ReactNode
    let headerNode: React.ReactNode

    if (isManagedMode(props)) {
        const {
            title,
            icon,
            description,
            sidebarItems,
            activeId,
            onActiveChange,
            sidebarFooter,
            searchPlaceholder,
            searchValue,
            onSearchChange,
            headerChildren,
        } = props

        sidebarNode = (
            <Sidebar
                title={title}
                isCollapsed={managedCollapsed}
                onCollapseChange={setManagedCollapsed}
                showMobileMenu={managedMobileMenu}
                onCloseMobileMenu={() => setManagedMobileMenu(false)}
                footer={sidebarFooter}
            >
                {sidebarItems.map((item) => (
                    <SidebarItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeId === item.id}
                        className={item.className}
                        onClick={() => {
                            onActiveChange(item.id)
                            setManagedMobileMenu(false)
                        }}
                    />
                ))}
            </Sidebar>
        )

        headerNode = (
            <SidebarHeader
                title={title}
                icon={icon}
                description={description}
                onMenuClick={() => setManagedMobileMenu(true)}
                onClose={() => onOpenChange(false)}
            >
                {onSearchChange && searchPlaceholder && (
                    <div className="relative group hidden sm:block w-48 lg:w-64 transition-all focus-within:w-64 lg:focus-within:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={14} />
                        <input
                            value={searchValue ?? ""}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full modal-minimal-input pl-9 pr-3"
                        />
                    </div>
                )}
                {headerChildren}
            </SidebarHeader>
        )
    } else {
        sidebarNode = props.sidebar
        headerNode = props.header
    }

    return (
        <AppSurfaceModal
            open={open}
            onOpenChange={onOpenChange}
            preset="sidebar"
            sidebar={sidebarNode}
            sidebarCollapsed={isCollapsed}
            header={headerNode}
            footer={footer}
            background={<div className="absolute inset-0 bg-background" />}
            floating={
                showMobileMenu && closeMobileMenu ? (
                    <div
                        className="absolute inset-0 z-20 md:hidden"
                        onClick={closeMobileMenu}
                    />
                ) : null
            }
            content={(
                <div className={cn("flex h-full flex-1 flex-col overflow-hidden bg-background", className)}>
                    <div className="relative z-10 flex-1 overflow-hidden">
                        {children}
                    </div>
                </div>
            )}
        />
    )
}
