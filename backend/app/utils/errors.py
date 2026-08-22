from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from app.utils.logger import logger

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    formatted_errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        msg = err.get("msg", "Invalid value")
        err_type = err.get("type", "")
        
        if "missing" in err_type:
            readable_msg = f"Field '{field}' is required and cannot be empty."
        elif "value_error" in err_type:
            readable_msg = f"Invalid format for '{field}': {msg}"
        else:
            readable_msg = f"{field}: {msg}" if field else msg

        formatted_errors.append({
            "field": field or "general",
            "message": readable_msg,
            "type": err_type
        })

    logger.warning(f"Validation failed on {request.method} {request.url.path}: {formatted_errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "message": "Input validation failed. Please check the submitted fields.",
            "errors": formatted_errors
        }
    )

async def integrity_exception_handler(request: Request, exc: IntegrityError):
    err_str = str(exc.orig) if hasattr(exc, "orig") else str(exc)
    logger.error(f"Database integrity violation on {request.url.path}: {err_str}")
    
    user_msg = "Database constraint violation occurred."
    if "unique" in err_str.lower() or "duplicate" in err_str.lower():
        user_msg = "A record with these unique details already exists."
    elif "foreign key" in err_str.lower():
        user_msg = "Referenced related entity was not found."

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "data": None,
            "message": user_msg,
            "errors": [{"field": "database", "message": user_msg}]
        }
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": exc.detail if isinstance(exc.detail, str) else "Request error",
            "errors": exc.detail if isinstance(exc.detail, list) else None
        }
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "message": "An internal server error occurred while processing the request.",
            "errors": None
        }
    )
