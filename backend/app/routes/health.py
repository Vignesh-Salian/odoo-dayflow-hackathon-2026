import datetime
from fastapi import APIRouter
from app.schemas.response import APIResponse

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=APIResponse[dict])
def check_health():
    return APIResponse(
        success=True,
        message="Service is running healthy",
        data={
            "status": "online",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "version": "1.0.0",
            "environment": "active"
        }
    )
