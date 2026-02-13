export const chatWithAI = async (message, conversationId, onChunk, onComplete, onError) => {
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
            throw new Error(`API Error: ${response.statusText}`);
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
