import { randomUUID } from 'node:crypto'

import { PDFParse } from 'pdf-parse'

import { NotFoundError, ValidationError } from '../../../shared/errors.js'

const documents = new Map()
const CHUNK_SIZE = 1_000
const CHUNK_OVERLAP = 150
const MAX_CONTEXT_CHUNKS = 4
const STOP_WORDS = new Set(['a', 'al', 'ante', 'bajo', 'con', 'contra', 'de', 'del', 'desde', 'el', 'en', 'entre', 'es', 'la', 'las', 'lo', 'los', 'o', 'para', 'por', 'que', 'se', 'sin', 'su', 'sus', 'un', 'una', 'y'])

const normalizeText = (text) => text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const extractTerms = (text) => normalizeText(text)
    .match(/[a-z0-9]{3,}/g)
    ?.filter((term) => !STOP_WORDS.has(term)) || []

const splitIntoChunks = (text) => {
    const normalizedText = text.replace(/\s+/g, ' ').trim()
    const chunks = []
    let start = 0

    while (start < normalizedText.length) {
        const end = Math.min(start + CHUNK_SIZE, normalizedText.length)
        chunks.push(normalizedText.slice(start, end))
        start += CHUNK_SIZE - CHUNK_OVERLAP
    }

    return chunks
}

const getRelevantChunks = (question) => {
    const terms = extractTerms(question)

    if (terms.length === 0) {
        return []
    }

    return [...documents.values()]
        .flatMap((document) => document.chunks.map((text, index) => ({
            documentId: document.id,
            documentName: document.name,
            chunkIndex: index,
            text,
        })))
        .map((chunk) => ({
            ...chunk,
            score: terms.reduce((total, term) => total + (normalizeText(chunk.text).split(term).length - 1), 0),
        }))
        .filter((chunk) => chunk.score > 0)
        .sort((first, second) => second.score - first.score)
        .slice(0, MAX_CONTEXT_CHUNKS)
}

class DocumentService {
    static async createFromPdf(file) {
        if (!file) {
            throw new ValidationError('Debes adjuntar un archivo PDF')
        }

        if (file.mimetype !== 'application/pdf') {
            throw new ValidationError('Solo se permiten archivos PDF')
        }

        const parser = new PDFParse({ data: file.buffer })

        try {
            const result = await parser.getText()
            const text = result.text.trim()

            if (text.length === 0) {
                throw new ValidationError('No se pudo extraer texto del PDF')
            }

            const document = {
                id: randomUUID(),
                name: file.originalname,
                chunks: splitIntoChunks(text),
                createdAt: new Date().toISOString(),
            }

            documents.set(document.id, document)
            return this.toSummary(document)
        } finally {
            await parser.destroy()
        }
    }

    static list() {
        return [...documents.values()].map((document) => this.toSummary(document))
    }

    static remove(id) {
        if (!documents.delete(id)) {
            throw new NotFoundError('Documento no encontrado')
        }
    }

    static getContext(question) {
        if (typeof question !== 'string' || question.trim().length === 0) {
            throw new ValidationError('Debes enviar una pregunta')
        }

        const chunks = getRelevantChunks(question)
        return {
            chunks,
            context: chunks.map((chunk) => `[Fuente: ${chunk.documentName}, fragmento ${chunk.chunkIndex + 1}]\n${chunk.text}`).join('\n\n'),
        }
    }

    static toSummary(document) {
        return {
            id: document.id,
            name: document.name,
            chunkCount: document.chunks.length,
            createdAt: document.createdAt,
        }
    }
}

export default DocumentService
