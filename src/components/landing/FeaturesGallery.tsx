import React from 'react';
import FloatingStack, { FloatingCardProps } from '@/components/ui/twitter-testimonial-cards';

export function FeaturesGallery() {

    const featureCards: FloatingCardProps[] = [
        {
            className:
                "[grid-area:stack] hover:-translate-y-10 transition-all duration-500",
            image: "/s3.png",
            title: "Trip Planner",
            description: "Seamless itinerary management."
        },
        {
            className:
                "[grid-area:stack] translate-x-12 sm:translate-x-20 translate-y-8 sm:translate-y-12 hover:-translate-y-1 transition-all duration-500",
            image: "/s2.png",
            title: "Gear Closet",
            description: "Digital inventory for your equipment."
        },
        {
            className: "[grid-area:stack] translate-x-24 sm:translate-x-40 translate-y-16 sm:translate-y-24 hover:translate-y-6 sm:hover:translate-y-10 transition-all duration-500",
            image: "/s1.png",
            title: "PackBot AI",
            description: "Your personal outdoor assistant."
        },
    ];

    return (
        <div className="w-full max-w-[1400px] mx-auto mt-20 relative z-20 flex justify-center items-center min-h-[600px]">
            <FloatingStack cards={featureCards} />
        </div>
    );
}
