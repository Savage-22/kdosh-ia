class DomainError(Exception):
    def __init__(self, message: str, status: int = 500):
        self.message = message
        self.status = status


class ValidationError(DomainError):
    def __init__(self, message: str):
        super().__init__(message, 400)


class NotFoundError(DomainError):
    def __init__(self, message: str):
        super().__init__(message, 404)


class ProviderError(DomainError):
    def __init__(self, message: str, status: int = 502):
        super().__init__(message, status)
