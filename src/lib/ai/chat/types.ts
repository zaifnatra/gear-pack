// src/lib/ai/chat/types.ts

export interface ChatResponse {
    message: string
    isJSON: boolean
    data?: Record<string, unknown>
    quickActions?: Array<{ label: string; value: string }>
    role?: string
}

/** Minimal shape of a message returned by the Backboard API */
export interface BackboardMessage {
    role: string
    content: string | Array<{ text?: { value?: string } }>
}

/** A single tool call request from the assistant */
export interface BackboardToolCall {
    id: string
    function: {
        name: string
        arguments: string | Record<string, unknown>
    }
}

/** Shape of a run object returned by the Backboard API */
export interface BackboardRun {
    id?: string
    run_id?: string
    status?: string
    tool_calls?: BackboardToolCall[]
    required_action?: {
        submit_tool_outputs: {
            tool_calls: BackboardToolCall[]
        }
    }
}
