export class DomainError extends Error {
    constructor(message, status = 500, errors = []) {
        super(message)
        this.name = this.constructor.name
        this.status = status
        this.errors = errors
    }
}

export class ValidationError extends DomainError {
    constructor(message, errors = []) {
        super(message, 400, errors)
    }
}

export class NotFoundError extends DomainError {
    constructor(message) {
        super(message, 404)
    }
}

export class ProviderError extends DomainError {
    constructor(message, status = 502) {
        super(message, status)
    }
}
