'use client';

import React, { useState } from "react";
import { Sidebar as SidebarPrimitive, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import Link from 'next/link';
import { motion } from "framer-motion";
import { Home, Map, Users, Backpack, Bot, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const links = [
        {
            label: "Home",
            href: "/dashboard",
            icon: (
                <Home className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Trips",
            href: "/dashboard/trips",
            icon: (
                <Map className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Social",
            href: "/dashboard/social",
            icon: (
                <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Gear Closet",
            href: "/dashboard/gear",
            icon: (
                <Backpack className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "AI Assistant",
            href: "?chat=open",
            icon: (
                <Bot className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
    ];
    const [open, setOpen] = useState(false);

    return (
        <div className={cn(
            "rounded-md flex flex-col md:flex-row w-full flex-1 max-w-7xl mx-auto overflow-hidden",
            "h-screen" // Needs fixed height for sidebar to work properly
        )}>
            <SidebarPrimitive open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10 bg-emerald-50/20 bg-gradient-to-b from-emerald-50/90 via-white/90 to-emerald-50/50 backdrop-blur-xl border-r border-emerald-100/60 dark:bg-neutral-900 dark:from-neutral-900 dark:to-neutral-900 dark:border-neutral-800">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="mt-8 flex flex-col gap-6">
                            {links.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>
                    </div>
                </SidebarBody>
            </SidebarPrimitive>
        </div>
    );
}

export const Logo = () => {
    return (
        <Link
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-black dark:text-white whitespace-pre"
            >
                Gear Pack
            </motion.span>
        </Link>
    );
};
export const LogoIcon = () => {
    return (
        <Link
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
        </Link>
    );
};
