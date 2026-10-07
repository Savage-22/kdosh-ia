import { ValidationError } from '../../../shared/errors.js'
import OpenRouterService from '../../openrouter/application/openRouter.Service.js'
import DocumentService from './document.Service.js'

const DEFAULT_SYSTEM_PROMPT = `Eres el asistente de Kdosh.
Responde únicamente usando el contexto documental proporcionado.
Si el contexto no contiene la información necesaria, di claramente: "No encuentro esa información en los documentos cargados."
No inventes datos. Responde en español, salvo que el usuario solicite otro idioma.`

class RagService {
    static async answer({ model, question, systemPrompt, temperature }) {
        if (typeof question !== 'string' || question.trim().length === 0) {
            throw new ValidationError('Debes enviar una pregunta')
        }

        const { context, chunks } = DocumentService.getContext(question)

        if (chunks.length === 0) {
            return {
                answer: 'No encuentro esa información en los documentos cargados.',
                sources: [],
            }
        }

        const prompt = `${systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT}\n\nContexto documental:\n${context}`
        const sources = chunks.map(({ documentId, documentName, chunkIndex }) => ({
            documentId,
            documentName,
            chunkIndex: chunkIndex + 1,
        }))
        const completion = await OpenRouterService.createChatCompletion({
            model,
            temperature,
            usageType: 'rag',
            documentSources: sources,
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: question },
            ],
        })

        return {
            answer: completion.choices?.[0]?.message?.content || '',
            sources,
            usage: completion.usage,
        }
    }
}

export { DEFAULT_SYSTEM_PROMPT }
export default RagService
