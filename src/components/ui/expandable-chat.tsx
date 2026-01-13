"use client";

import React, { useRef, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ChatPosition = "bottom-right" | "bottom-left";
export type ChatSize = "sm" | "md" | "lg" | "xl" | "full";

const chatConfig = {
    dimensions: {
        sm: "sm:w-[380px] sm:h-[500px]",
        md: "sm:w-[450px] sm:h-[600px]",
        lg: "sm:w-[550px] sm:h-[700px]",
        xl: "sm:w-[700px] sm:h-[800px]",
        full: "sm:w-full sm:h-full",
    },
    positions: {
        "bottom-right": "bottom-5 right-5",
        "bottom-left": "bottom-5 left-5",
    },
    chatPositions: {
        "bottom-right": "sm:bottom-[calc(100%+10px)] sm:right-0",
        "bottom-left": "sm:bottom-[calc(100%+10px)] sm:left-0",
    },
    states: {
        open: "pointer-events-auto opacity-100 visible scale-100 translate-y-0",
        closed:
            "pointer-events-none opacity-0 invisible scale-100 sm:translate-y-5",
    },
};

interface ExpandableChatProps extends React.HTMLAttributes<HTMLDivElement> {
    position?: ChatPosition;
    size?: ChatSize;
    icon?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}

const ExpandableChat: React.FC<ExpandableChatProps> = ({
    className,
    position = "bottom-right",
    size = "md",
    icon,
    children,
    isOpen: controlledIsOpen,
    onOpenChange,
    ...props
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const toggleChat = () => {
        const newState = !isOpen;
        if (isControlled && onOpenChange) {
            onOpenChange(newState);
        } else {
            setInternalIsOpen(newState);
        }
    };

    return (
        <div
            className={cn(`fixed ${chatConfig.positions[position]} z-[100]`, className)}
            {...props}
        >
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] sm:hidden"
                    onClick={() => {
                        if (isControlled && onOpenChange) onOpenChange(false)
                        else setInternalIsOpen(false)
                    }}
                />
            )}

            <div
                ref={chatRef}
                className={cn(
                    "flex flex-col bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/20 dark:border-neutral-800 shadow-2xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] sm:absolute fixed inset-4 bottom-20 sm:inset-auto ring-1 ring-black/5 dark:ring-white/10 z-[100]",
                    chatConfig.chatPositions[position],
                    chatConfig.dimensions[size],
                    isOpen ? chatConfig.states.open : chatConfig.states.closed,
                    "rounded-3xl sm:rounded-3xl", // Always rounded now
                    className,
                )}
            >
                {children}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 sm:hidden text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full z-[110]"
                    onClick={toggleChat}
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>
            <ExpandableChatToggle
                icon={icon}
                isOpen={isOpen}
                toggleChat={toggleChat}
                className="relative z-[100]"
            />
        </div>
    );
};

ExpandableChat.displayName = "ExpandableChat";

const ExpandableChatHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    ...props
}) => (
    <div
        className={cn("flex items-center justify-between p-4 border-b", className)}
        {...props}
    />
);

ExpandableChatHeader.displayName = "ExpandableChatHeader";

const ExpandableChatBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    ...props
}) => <div className={cn("flex-grow overflow-y-auto", className)} {...props} />;

ExpandableChatBody.displayName = "ExpandableChatBody";

const ExpandableChatFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    ...props
}) => <div className={cn("border-t p-4", className)} {...props} />;

ExpandableChatFooter.displayName = "ExpandableChatFooter";

interface ExpandableChatToggleProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    isOpen: boolean;
    toggleChat: () => void;
}

const ExpandableChatToggle: React.FC<ExpandableChatToggleProps> = ({
    className,
    icon,
    isOpen,
    toggleChat,
    ...props
}) => (
    <Button
        variant="default"
        onClick={toggleChat}
        className={cn(
            "w-14 h-14 rounded-full shadow-md hidden md:flex items-center justify-center hover:shadow-lg hover:shadow-black/30 transition-all duration-300",
            className,
        )}
        {...props}
    >
        {isOpen ? (
            <X className="h-6 w-6" />
        ) : (
            icon || <MessageCircle className="h-6 w-6" />
        )}
    </Button>
);

ExpandableChatToggle.displayName = "ExpandableChatToggle";

export {
    ExpandableChat,
    ExpandableChatHeader,
    ExpandableChatBody,
    ExpandableChatFooter,
};
