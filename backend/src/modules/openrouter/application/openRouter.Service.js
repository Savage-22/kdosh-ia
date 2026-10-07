import { config } from '../../../config/env.js'
import { ProviderError, ValidationError } from '../../../shared/errors.js'
import UsageModel from '../../usage/infrastructure/usage.Model.js'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const REQUEST_TIMEOUT_MS = 60_000

const createHeaders = () => ({
    Authorization: `Bearer ${config.openRouterApiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': config.openRouterAppUrl,
    'X-Title': config.openRouterAppName,
})

const readProviderError = async (response) => {
    const payload = await response.json().catch(() => null)
    return payload?.error?.message || payload?.message || 'OpenRouter no pudo completar la solicitud'
}

const requestOpenRouter = async (path, options = {}) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        const response = await fetch(`${OPENROUTER_BASE_URL}${path}`, {
            ...options,
            headers: { ...createHeaders(), ...options.headers },
            signal: controller.signal,
        })

        if (!response.ok) {
            const message = await readProviderError(response)
            const status = [400, 402, 429, 503].includes(response.status) ? response.status : 502
            throw new ProviderError(message, status)
        }

        return response.json()
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new ProviderError('OpenRouter tardó demasiado en responder', 504)
        }

        if (error instanceof ProviderError) {
            throw error
        }

        throw new ProviderError('No fue posible conectar con OpenRouter')
    } finally {
        clearTimeout(timeout)
    }
}

const validateMessages = (messages) => {
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new ValidationError('Debes enviar al menos un mensaje')
    }

    const areValid = messages.every((message) => (
        ['system', 'user', 'assistant'].includes(message?.role)
        && typeof message.content === 'string'
        && message.content.trim().length > 0
    ))

    if (!areValid) {
        throw new ValidationError('Los mensajes no tienen un formato válido')
    }
}

class OpenRouterService {
    static async listModels() {
        const payload = await requestOpenRouter('/models')
        return payload.data || []
    }

    static async createChatCompletion({ model, messages, temperature, usageType = 'chat', documentSources = [] }) {
        if (typeof model !== 'string' || model.trim().length === 0) {
            throw new ValidationError('Debes seleccionar un modelo')
        }

        validateMessages(messages)

        const payload = {
            model,
            messages,
            ...(typeof temperature === 'number' && { temperature }),
        }

        const completion = await requestOpenRouter('/chat/completions', {
            method: 'POST',
            body: JSON.stringify(payload),
        })

        try {
            await UsageModel.create({ requestType: usageType, requestedModel: model, completion, documentSources })
        } catch (error) {
            console.error('No se pudo registrar el uso de OpenRouter', error)
        }

        return completion
    }
}

export default OpenRouterService
