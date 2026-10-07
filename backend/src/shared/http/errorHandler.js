import multer from 'multer'

import { DomainError } from '../errors.js'

export const notFoundHandler = (req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' })
}

export const errorHandler = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'El PDF supera el límite de 10 MB'
            : 'No se pudo procesar el archivo cargado'

        return res.status(400).json({ success: false, message })
    }

    if (error instanceof DomainError) {
        return res.status(error.status).json({
            success: false,
            message: error.message,
            ...(error.errors.length > 0 && { errors: error.errors }),
        })
    }

    console.error(error)
    return res.status(500).json({ success: false, message: 'Ocurrió un error interno' })
}
