"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FloatingCardProps {
    className?: string;
    image: string;
    title?: string;
    description?: string;
    onHover?: () => void;
    onLeave?: () => void;
    isActive?: boolean;
    onTap?: () => void;
}

function FloatingCard({
    className,
    image,
    title,
    description,
    onHover,
    onLeave,
    isActive,
    onTap,
}: FloatingCardProps) {
    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        onTap?.();
    };

    return (
        <div
            onClick={handleClick}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            className={cn(
                "relative flex h-[280px] sm:h-[400px] w-[200px] sm:w-[300px] -skew-y-[8deg] select-none flex-col rounded-3xl border-4 border-white bg-neutral-100 shadow-2xl transition-all duration-500 hover:border-emerald-400 hover:scale-105 cursor-pointer overflow-hidden",
                isActive && "ring-4 ring-emerald-500/50 scale-105 z-50",
                className
            )}
        >
            {/* Image Container */}
            <div className="relative w-full h-full flex-1 bg-neutral-200">
                <img
                    src={image}
                    alt={title || "Screenshot"}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            </div>

            {/* Optional Title/Caption Overlay */}
            {(title || description) && (
                <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 flex flex-col justify-end text-white z-10">
                    {title && <h3 className="text-lg sm:text-xl font-bold leading-tight">{title}</h3>}
                    {description && <p className="text-xs sm:text-sm text-neutral-200 mt-1 line-clamp-2">{description}</p>}
                </div>
            )}
        </div>
    );
}

interface FloatingStackProps {
    cards?: FloatingCardProps[];
}

export default function FloatingStack({ cards }: FloatingStackProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const getCardClassName = (index: number, baseClassName: string) => {
        // Stacking Logic
        // When hovering/active on back card (0), push others down/right
        const focusedIndex = hoveredIndex ?? activeIndex;

        // Default stacking offsets
        // 0 is back, 1 is middle, 2 is front

        // If focusing 0 (back), move 1 and 2 away
        if (focusedIndex === 0 && index === 1) {
            return baseClassName + " !translate-y-24 sm:!translate-y-36 !translate-x-16 sm:!translate-x-24";
        }
        if (focusedIndex === 0 && index === 2) {
            return baseClassName + " !translate-y-32 sm:!translate-y-52 !translate-x-28 sm:!translate-x-44";
        }

        // If focusing 1 (middle), move 2 away
        if (focusedIndex === 1 && index === 2) {
            return baseClassName + " !translate-y-28 sm:!translate-y-48 !translate-x-28 sm:!translate-x-44";
        }

        // Base State: Tight stack
        return baseClassName;
    };

    const handleTap = (index: number) => {
        setActiveIndex(index === activeIndex ? null : index);
    };

    // Default fallback
    const defaultCards: FloatingCardProps[] = [
        { image: "https://images.unsplash.com/photo-1", title: "Screenshot 1" },
        { image: "https://images.unsplash.com/photo-2", title: "Screenshot 2" },
        { image: "https://images.unsplash.com/photo-3", title: "Screenshot 3" },
    ];

    const displayCards = cards || defaultCards;

    return (
        <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700 py-20 pb-40">
            {displayCards.map((cardProps, index) => (
                <FloatingCard
                    key={index}
                    {...cardProps}
                    className={getCardClassName(index, cardProps.className || "")}
                    onHover={() => setHoveredIndex(index)}
                    onLeave={() => setHoveredIndex(null)}
                    isActive={activeIndex === index}
                    onTap={() => handleTap(index)}
                />
            ))}
        </div>
    );
}

export { FloatingCard, FloatingStack };
export type { FloatingCardProps, FloatingStackProps };
