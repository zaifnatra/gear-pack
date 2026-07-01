// src/app/actions/ai-chat/scope.ts

import type { ChatResponse } from './types'

export function buildOutOfScopeResponse(): ChatResponse {
    return {
        role: 'assistant',
        isJSON: false,
        message:
            "Sorry — I can't help with that topic. I'm PackBot: hiking/trail planning, trip logistics, and gear packing. Ask me about a hike you want to do, your trip dates/location, or what gear you have.",
        quickActions: [
            { label: "Find a hike nearby", value: "Find a hike nearby" },
            { label: "Plan a weekend trip", value: "Plan a weekend trip" },
            { label: "Analyze my gear closet", value: "Analyze my gear closet" }
        ]
    }
}

export function isClearlyOutOfScope(message: string): boolean {
    const text = message.toLowerCase()

    const isMath =
        /\b(integral|derivative|calculus|algebra|geometry|trigonometry|matrix|proof|theorem|equation|polynomial|math)\b/.test(text) ||
        /\b\d+\s*[xyz]\s*[\+\-*/^=]/.test(text) ||
        /[\+\-*/^=]\s*\d+\s*[xyz]\b/.test(text)

    const isPolitics =
        /\b(politics|political|election|vote|voting|democrat|republican|congress|senate|parliament|president|prime minister)\b/.test(text)

    const isDating = /\b(dating|relationship|girlfriend|boyfriend|abg)\b/.test(text)

    return isMath || isPolitics || isDating
}
