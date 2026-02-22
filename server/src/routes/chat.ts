import { Router, Request, Response } from 'express'
import { getGeminiService } from '../services/geminiService.js'

export const chatRouter = Router()

interface ChatRequest {
    message: string
    context: any // Flexible context object (Wellness, Period, etc.)
}

chatRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { message, context } = req.body as ChatRequest

        if (!message) {
            res.status(400).json({ error: 'Message is required' })
            return
        }

        console.log(`[Chat] Message: "${message.slice(0, 50)}..."`)
        // console.log(`[Chat] Context keys: ${Object.keys(context || {}).join(', ')}`)

        const service = getGeminiService()
        const response = await service.chatWithHera(context || {}, message)

        res.json({ response })
    } catch (error: any) {
        console.error('Chat error:', error?.message || error)
        const msg = (error?.message || '').toLowerCase()
        if (msg.includes('quota') || msg.includes('429') || msg.includes('resource') || msg.includes('rate') || msg.includes('exhausted')) {
            res.json({
                response: "I'm a little busy right now — too many requests in a short time. Please wait about 30 seconds and try again! 🩺"
            })
        } else {
            res.json({
                response: "I'm sorry, I'm having a brief issue connecting to my AI brain. Please try again in a moment. If this keeps happening, the AI service may be temporarily overloaded. 🩺"
            })
        }
    }
})
