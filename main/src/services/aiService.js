export const chatWithAI = async (message, conversationId, onChunk, onComplete, onError, onConversationCreated) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/ai/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                message,
                conversation_id: conversationId
            })
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // Not JSON, use statusText
            }
            throw new Error(`API Error: ${errorMessage}`);
        }

        // Capture conversation ID from header
        const serverConvId = response.headers.get('X-Conversation-Id');
        if (serverConvId && onConversationCreated) {
            onConversationCreated(serverConvId);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            if (onChunk) onChunk(chunk);
        }

        if (onComplete) onComplete(fullResponse);

    } catch (error) {
        console.error("AI Chat Error:", error);
        if (onError) onError(error);
    }
};

export const getChatHistory = async (conversationId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/ai/history/${conversationId}/`, {
        headers: {
            'Authorization': `Token ${token}`
        }
    });
    if (!response.ok) throw new Error("Could not fetch history");
    return await response.json();
};
