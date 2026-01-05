import { prisma } from "@/lib/prisma"

const BACKBOARD_API_URL = process.env.BACKBOARD_API_URL || "https://app.backboard.io/api"
const BACKBOARD_MODEL = "claude-3-7-sonnet-20250219"

if (!process.env.BACKBOARD_API_KEY) {
    console.warn("Missing BACKBOARD_API_KEY in environment variables.")
}

interface BackboardMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

interface ThreadRun {
    id: string
    status: 'queued' | 'in_progress' | 'requires_action' | 'completed' | 'failed' | 'cancelled'
    required_action?: {
        submit_tool_outputs: {
            tool_calls: {
                id: string
                function: {
                    name: string
                    arguments: string // JSON string
                }
            }[]
        }
    }
}

/**
 * Generic fetch wrapper for Backboard API
 */
async function backboardFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${BACKBOARD_API_URL}${endpoint}`

    // Determine headers
    const headers: Record<string, string> = {
        "X-API-Key": process.env.BACKBOARD_API_KEY || "",
        ...(options.headers as Record<string, string>),
    }

    // Only add JSON content type if NOT FormData AND not GET
    const method = options.method?.toUpperCase() || 'GET'
    if (!(options.body instanceof FormData) && method !== 'GET' && method !== 'HEAD') {
        headers["Content-Type"] = "application/json"
    }

    const response = await fetch(url, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const errorBody = await response.text()
        console.error(`Backboard API Error [${response.status}]:`, errorBody)
        throw new Error(`Backboard API Error: ${response.statusText} (${response.status})`)
    }

    // Handle empty body (like 204 No Content)
    const text = await response.text()
    if (!text) return {}

    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

/**
 * Creates a new Thread
 */
export async function createThread(assistantId?: string) {
    try {
        const asstId = assistantId || await getAssistantId()
        const res = await backboardFetch(`/assistants/${asstId}/threads`, {
            method: 'POST',
            body: JSON.stringify({})
        })
        return res.thread_id
    } catch (e) {
        console.error("Failed to create thread", e)
        return null
    }
}

/**
 * Adds a message to a thread and triggers the assistant
 * Returns the Run object (or message object acting as run)
 */
export async function addMessage(threadId: string, role: 'user' | 'system', content: string) {
    // Backboard requires Multipart/Form-Data for messages
    const formData = new FormData()
    formData.append("role", role)
    formData.append("content", content)

    const res = await backboardFetch(`/threads/${threadId}/messages`, {
        method: 'POST',
        body: formData
    })
    return res // This is the "Run" object based on debug logs
}

// createRun is NOT needed as addMessage triggers it.
// We keep submitToolOutputs as that is still required for tool handling.


/**
 * Submits tool outputs via messages (since the run endpoint is not standard)
 */
export async function submitToolOutputs(threadId: string, runId: string, toolOutputs: { tool_call_id: string, output: string }[]) {
    let lastResponse;

    // We send each output as a separate tool message
    for (const output of toolOutputs) {
        const formData = new FormData()
        formData.append("role", "tool")
        formData.append("tool_call_id", output.tool_call_id)
        formData.append("content", output.output)

        lastResponse = await backboardFetch(`/threads/${threadId}/messages`, {
            method: 'POST',
            body: formData
        })
    }

    return lastResponse || { status: 'queued' }
}

/**
 * Gets the latest assistant message from a thread
 */
/**
 * Gets the latest assistant message from a thread
 */
export async function getLatestResponse(threadId: string): Promise<string> {
    // Backboard API returns messages inside the Thread object
    // GET /threads/:id -> { messages: [...] }
    const threadData = await backboardFetch(`/threads/${threadId}`)
    const messages = threadData.messages || []

    // Assuming messages are in Chronological order (Oldest -> Newest) based on debug logs
    // we want the LAST message.
    // If empty, return empty string.
    if (messages.length === 0) return ""

    const lastMsg = messages[messages.length - 1]

    if (lastMsg && lastMsg.role === 'assistant') {
        // Content might be array of text/images
        if (Array.isArray(lastMsg.content)) {
            return lastMsg.content.map((c: any) => c.text?.value || '').join('\n')
        }
        return lastMsg.content || ""
    }
    return ""
}

/**
 * Gets the full thread history
 */
export async function getThreadHistory(threadId: string) {
    try {
        const threadData = await backboardFetch(`/threads/${threadId}`)
        return threadData.messages || []
    } catch (error) {
        console.error("Error fetching thread history:", error)
        return []
    }
}

/**
 * Gets or sets an ephemeral Assistant ID
 * Since we want to configure it with specific tools/instructions,
 * we might need to create it once or use a predefined one.
 * For MVP, let's assume valid ID is provided in ENV.
 */
export async function getAssistantId() {
    if (process.env.BACKBOARD_ASSISTANT_ID) {
        return process.env.BACKBOARD_ASSISTANT_ID
    }
    throw new Error("BACKBOARD_ASSISTANT_ID is missing.")
}

// Export fetcher for specialized use if needed
export { backboardFetch }
