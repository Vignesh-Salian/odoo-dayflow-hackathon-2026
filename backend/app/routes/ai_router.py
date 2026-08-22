from fastapi import APIRouter
from app.schemas.response import APIResponse, AIAnalysisRequest
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/process", response_model=APIResponse[dict])
async def process_with_ai(payload: AIAnalysisRequest):
    result = await ai_service.generate_insights(
        prompt=payload.prompt,
        context=payload.context_data
    )
    return APIResponse(
        success=True,
        data=result,
        message="AI processing completed successfully"
    )
