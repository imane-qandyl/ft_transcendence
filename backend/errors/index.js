class CustomError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class BadRequestError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = 400;
    }
}

class UnauthorizedError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = 401;
    }
}

class NotFoundError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = 404;
    }
}

class ForbiddenError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = 403;
    }
}

module.exports = {
    CustomError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError
};
