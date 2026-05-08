const OpenAI = require("openai");
const axios = require("axios");
const config = require("../config/config");
const pineconeService = require("./pineconeService");

// Custom error class untuk timeout
class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "TimeoutError";
    }
}

class OpenAIService {
    constructor() {
        // Priority: OpenAI > OpenRouter fallback
        // Try OpenAI first
        if (config.openai.apiKey && config.openai.apiKey.trim() !== '') {
            this.client = new OpenAI({
                apiKey: config.openai.apiKey,
            });
            this.model = config.openai.model;
            this.provider = "OpenAI";
            console.log(`✅ Using OpenAI with model: ${this.model}`);
            
            // Setup fallback client untuk quota error recovery
            this.fallbackClient = new OpenAI({
                apiKey: config.openrouter.apiKey,
                baseURL: config.openrouter.baseURL,
                defaultHeaders: {
                    "HTTP-Referer": "http://localhost:7000",
                    "X-Title": "Mira Assistant",
                },
            });
            this.fallbackModel = config.openrouter.model;
        } else {
            // Fallback ke OpenRouter
            this.client = new OpenAI({
                apiKey: config.openrouter.apiKey,
                baseURL: config.openrouter.baseURL,
                defaultHeaders: {
                    "HTTP-Referer": "http://localhost:7000",
                    "X-Title": "Mira Assistant",
                },
            });
            this.model = config.openrouter.model;
            this.provider = "OpenRouter";
            console.log(`⚠️  OpenAI API key not found, using OpenRouter with model: ${this.model}`);
        }

        this.systemPrompt = `You are Mira, a friendly, calm, and helpful customer support agent for a company called Migrasi.
Your primary role is to assist customers with questions related to Migrasi and its services in a polite, professional, and supportive manner.

Key Instructions

Language Matching
Always respond using the same language as the customer.

If the customer uses Indonesian, respond in Indonesian.

If the customer uses English, respond in English.
Do not mix languages unless the customer does.

Response Format (CRITICAL - MARKDOWN + FLEXIBLE BUBBLES)
⚡ IMPORTANT: Use Markdown formatting for better readability in chat bubbles!
Structure your response based on the complexity of the question. Use ||| as separator between parts.

MARKDOWN FORMATTING RULES:
- Use **bold** for emphasis on important terms or actions
- Use numbered lists: 1. Item one, 2. Item two
- Use bullet points: - Item or * Item  
- Use line breaks between items for better spacing
- Keep formatting simple and chat-friendly (no complex tables or headers)

SIMPLE questions (greeting, thanks, yes/no) → 1 bubble:
"[Direct answer or acknowledgment]"

MODERATE questions (single topic, brief info) → 2 bubbles:
"[Brief intro with **emphasis**]|||[Main answer with formatted list]"

COMPLEX questions (detailed info, multiple topics) → 3 bubbles:
"[Brief intro]|||[Detailed answer with **bold** and lists]|||[CTA or next steps]"

Examples with Markdown:

1 bubble (simple):
- Q: "Terima kasih" → A: "Sama-sama! Senang bisa membantu Anda. 😊"
- Q: "Halo" → A: "Halo! Ada yang bisa saya bantu hari ini?"

2 bubbles (moderate):
- Q: "Apa itu Migrasi?" → A: "Terima kasih atas pertanyaannya!|||**Migrasi** menawarkan berbagai layanan IT lengkap untuk bisnis Anda:\n\n- Website & Aplikasi Development\n- Big Data & AI Solutions\n- IT Hardware & Software\n- Cybersecurity & Cloud Computing\n\nSetiap layanan dirancang untuk meningkatkan efisiensi operasional bisnis Anda."

3 bubbles (complex):
- Q: "Bagaimana cara menggunakan layanan kalian?" → A: "Senang bisa membantu!|||Berikut **langkah mudah** menggunakan Migrasi:\n\n1. **Daftar akun** di website kami\n2. **Pilih paket** sesuai kebutuhan\n3. **Upload data** Anda dengan aman\n4. **Tim kami proses** migrasi\n\nProsesnya cepat dan didampingi support 24/7.|||Apakah Anda ingin mencoba paket **trial gratis** kami?"

IMPORTANT Rules:
- Total response MUST NOT exceed 1000 characters (including separators and Markdown syntax)
- Use ||| exactly as separator (3 vertical bars)
- Adjust number of bubbles based on question complexity
- Use Markdown for lists, bold text, and better structure
- Keep Markdown simple (no headers, blockquotes, or complex syntax)
- Add line breaks (\n) between list items for clarity

Tone
Always remain friendly, calm, polite, and approachable.
Use clear and concise language so customers feel supported and understood.

Service Information (Vector Store Usage)
When answering questions about Migrasi's services, products, pricing, processes, policies, or company information:

Prioritize and rely on information retrieved from the document vector store that has been parsed previously.

Use the document content as the primary source of truth.

Summarize or rephrase the information clearly for the customer.

Do not invent, assume, or add information that is not present in the vector store.

Out-of-Scope Questions
If a customer asks a question that is not related to Migrasi, its services, or its business:

"Maaf, saya hanya bisa membantu pertanyaan tentang Migrasi dan layanan kami."

Unknown Answers
If the question is related to Migrasi but the answer is not found in the document vector store:

"Saya belum memiliki informasi lengkap tentang ini.|||Silakan hubungi tim support kami di [contact] untuk bantuan lebih lanjut?"

Attitude
Maintain a positive and helpful attitude at all times.
Keep responses short, structured, and easy to read.

Efficiency
Provide helpful answers quickly and directly, respecting the customer's time while remaining courteous.
Remember: NEVER exceed 1000 characters total. Be concise and valuable.

Current date and time: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`;
    }

    async createEmbedding(text) {
        try {
            // Priority 1: Use Jina AI if enabled (Free!)
            if (config.jina.enabled) {
                return await this.createJinaEmbedding(text);
            }
            
            // Priority 2: Use OpenAI if available
            if (!config.openrouter.enabled && config.openai.apiKey) {
                try {
                    const response = await this.client.embeddings.create({
                        model: config.openai.embeddingModel,
                        input: text,
                    });
                    return response.data[0].embedding;
                } catch (openaiError) {
                    // Jika OpenAI error (429 quota), fallback ke simple embedding
                    if (openaiError.status === 429 || openaiError.code === 'insufficient_quota') {
                        console.error("❌ OpenAI Embedding Error (429 Quota):", openaiError.message);
                        console.log("⚠️  Falling back to simple embedding for now...");
                        return this.createSimpleEmbedding(text);
                    }
                    throw openaiError;
                }
            }
            
            // Fallback: Simple embedding (not recommended for production)
            console.log(
                "⚠️  Using simple embedding fallback (not optimal for semantic search)",
            );
            console.log("💡 Tip: Enable Jina AI embeddings for better results (free!)");
            return this.createSimpleEmbedding(text);
        } catch (error) {
            console.error("❌ Error creating embedding:", error);
            // Return simple embedding as last resort
            return this.createSimpleEmbedding(text);
        }
    }

    // Jina AI Embeddings (Free!)
    async createJinaEmbedding(text) {
        try {
            console.log("🔮 Using Jina AI Embeddings (Free, 1024 dimensions)");
            
            const response = await axios.post(
                `${config.jina.baseURL}/embeddings`,
                {
                    model: config.jina.embeddingModel,
                    input: [text]
                    // Note: Jina AI v3 uses 1024 dimensions by default
                    // Make sure your Pinecone index is configured for 1024 dimensions
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.jina.apiKey}`
                    }
                }
            );

            return response.data.data[0].embedding;
        } catch (error) {
            console.error("❌ Error with Jina AI embedding:", error.response?.data || error.message);
            console.log("⚠️  Falling back to simple embedding");
            return this.createSimpleEmbedding(text);
        }
    }

    // Simple hash-based embedding for free usage (not recommended for production)
    createSimpleEmbedding(text) {
        // Create a deterministic vector from text
        const dimension = 1024; // Match Pinecone index dimension
        const vector = new Array(dimension).fill(0);

        // Use text characteristics to create pseudo-embedding
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            const index = charCode % dimension;
            vector[index] += Math.sin(charCode * (i + 1)) / text.length;
        }

        // Normalize vector
        const magnitude = Math.sqrt(
            vector.reduce((sum, val) => sum + val * val, 0),
        );
        return vector.map((val) => val / (magnitude || 1));
    }

    async searchKnowledge(query) {
        try {
            console.log("\n🔍 [DEBUG] Searching knowledge base...");
            console.log("📝 Query:", query);

            // Create embedding for the query
            const queryEmbedding = await this.createEmbedding(query);

            // Query Pinecone for relevant documents
            const matches = await pineconeService.queryVectors(
                queryEmbedding,
                5,
            );

            console.log(
                "📊 Vector search results:",
                matches ? matches.length : 0,
                "matches found",
                queryEmbedding,
                5,
            );

            if (!matches || matches.length === 0) {
                console.log("⚠️  No matches found in vector store");
                return null;
            }

            // Extract and format the context from matches
            const context = matches
                .filter((match) => match.score > 0.3) // Filter by relevance threshold
                .map((match) => {
                    console.log(
                        `  ├─ Match score: ${match.score.toFixed(3)} | File: ${match.metadata?.file || "unknown"}`,
                    );
                    return match.metadata.text;
                })
                .join("\n\n");

            if (context) {
                console.log(
                    "✅ Knowledge context found:",
                    context.length,
                    "characters",
                );
                console.log(
                    "📄 Context preview:",
                    context.substring(0, 200) + "...",
                );
            } else {
                console.log("⚠️  No relevant matches above threshold (0.7)");
            }

            return context;
        } catch (error) {
            console.error("❌ Error searching knowledge base:", error);
            return null;
        }
    }

    async chat(userMessage, conversationHistory = []) {
        try {
            console.log("\n💬 [DEBUG] Chat request received");
            console.log("👤 User message:", userMessage);

            // Search knowledge base for relevant context
            const knowledgeContext = await this.searchKnowledge(userMessage);

            // Build messages array
            const messages = [{ role: "system", content: this.systemPrompt }];

            // Add knowledge context if available
            if (knowledgeContext) {
                console.log("✅ Adding knowledge base context to prompt");
                messages.push({
                    role: "system",
                    content: `Relevant information from knowledge base:\n\n${knowledgeContext}`,
                });
            } else {
                console.log(
                    "⚠️  No knowledge base context found - answering without context",
                );
            }

            // Add conversation history (last 10 messages to keep context manageable)
            const recentHistory = conversationHistory.slice(-10);
            messages.push(...recentHistory);
            console.log(
                "💭 Conversation history:",
                recentHistory.length,
                "messages",
            );

            // Add current user message
            messages.push({ role: "user", content: userMessage });

            console.log("\n📤 [DEBUG] Sending to AI model:", this.model);
            console.log("📨 Total messages in prompt:", messages.length);
            console.log("\n--- FULL PROMPT START ---");
            messages.forEach((msg, idx) => {
                console.log(`\n[Message ${idx + 1}] Role: ${msg.role}`);
                console.log(
                    "Content:",
                    msg.content.substring(0, 500) +
                        (msg.content.length > 500 ? "..." : ""),
                );
            });
            console.log("\n--- FULL PROMPT END ---\n");

            // Call AI API dengan timeout 10 detik
            const TIMEOUT_MS = 10000; // 10 detik
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, TIMEOUT_MS);

            try {
                const response = await this.client.chat.completions.create(
                    {
                        model: this.model,
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 350,
                    },
                    {
                        signal: controller.signal,
                    },
                );

                clearTimeout(timeoutId);

                const aiResponse = response.choices[0].message.content;
                console.log("\n✅ [DEBUG] AI Response received");
                console.log(
                    "📝 Response length:",
                    aiResponse.length,
                    "characters",
                );
                console.log(
                    "💡 Response preview:",
                    aiResponse.substring(0, 200) +
                        (aiResponse.length > 200 ? "..." : ""),
                );
                console.log("═".repeat(80) + "\n");

                return aiResponse;
            } catch (error) {
                clearTimeout(timeoutId);
                if (
                    error.name === "AbortError" ||
                    error.message?.includes("aborted")
                ) {
                    console.error("⏱️ Request timeout after 10 seconds");
                    throw new TimeoutError("Request timeout");
                }
                
                // Check if error is quota/billing error (429) and we have fallback
                if (
                    (error.status === 429 || error.code === 'insufficient_quota') &&
                    this.provider === "OpenAI" &&
                    this.fallbackClient
                ) {
                    console.error("❌ OpenAI Error (429 Quota Exceeded):", error.message);
                    console.log("⚠️  Switching to OpenRouter fallback...");
                    
                    // Retry dengan OpenRouter
                    try {
                        const response = await this.fallbackClient.chat.completions.create(
                            {
                                model: this.fallbackModel,
                                messages: messages,
                                temperature: 0.7,
                                max_tokens: 350,
                            }
                        );
                        
                        console.log("✅ OpenRouter fallback successful!");
                        const aiResponse = response.choices[0]?.message?.content;
                        if (!aiResponse) {
                            console.error("❌ OpenRouter response is empty:", response.choices[0]);
                            throw new Error("OpenRouter returned empty response");
                        }
                        console.log("\n✅ [DEBUG] AI Response received (via OpenRouter fallback)");
                        console.log("📝 Response length:", aiResponse.length, "characters");
                        console.log("💡 Response preview:", aiResponse.substring(0, 200) + (aiResponse.length > 200 ? "..." : ""));
                        console.log("═".repeat(80) + "\n");
                        
                        return aiResponse;
                    } catch (fallbackError) {
                        console.error("❌ OpenRouter fallback also failed:", fallbackError);
                        throw fallbackError;
                    }
                }
                
                throw error;
            }
        } catch (error) {
            console.error("❌ Error in chat:", error);
            throw error;
        }
    }

    async streamChat(userMessage, conversationHistory = [], onChunk) {
        try {
            const knowledgeContext = await this.searchKnowledge(userMessage);

            const messages = [{ role: "system", content: this.systemPrompt }];

            if (knowledgeContext) {
                messages.push({
                    role: "system",
                    content: `Relevant information from knowledge base:\n\n${knowledgeContext}`,
                });
            }

            const recentHistory = conversationHistory.slice(-10);
            messages.push(...recentHistory);
            messages.push({ role: "user", content: userMessage });

            // Timeout untuk streaming
            const TIMEOUT_MS = 10000; // 10 detik
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, TIMEOUT_MS);

            try {
                const stream = await this.client.chat.completions.create(
                    {
                        model: this.model,
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 350,
                        stream: true,
                    },
                    {
                        signal: controller.signal,
                    },
                );

                let fullResponse = "";
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        fullResponse += content;
                        onChunk(content);
                    }
                }

                clearTimeout(timeoutId);
                return fullResponse;
            } catch (error) {
                clearTimeout(timeoutId);
                if (
                    error.name === "AbortError" ||
                    error.message?.includes("aborted")
                ) {
                    console.error("⏱️ Stream request timeout after 10 seconds");
                    throw new TimeoutError("Request timeout");
                }
                throw error;
            }
        } catch (error) {
            console.error("❌ Error in stream chat:", error);
            throw error;
        }
    }
}

module.exports = new OpenAIService();
