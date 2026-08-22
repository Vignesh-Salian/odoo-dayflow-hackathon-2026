from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.base import DemoItem
from app.schemas.response import APIResponse, ItemCreate

router = APIRouter(prefix="/items", tags=["Items"])

@router.get("", response_model=APIResponse[List[dict]])
def list_items(db: Session = Depends(get_db)):
    try:
        items = db.query(DemoItem).order_by(DemoItem.id.desc()).all()
        result = [
            {
                "id": i.id,
                "title": i.title,
                "description": i.description,
                "category": i.category,
                "status": i.status,
                "created_at": i.created_at.strftime("%Y-%m-%d %H:%M") if i.created_at else "Just now"
            }
            for i in items
        ]
        return APIResponse(success=True, data=result, message=f"Fetched {len(result)} items")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=APIResponse[dict])
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    try:
        new_item = DemoItem(
            title=payload.title,
            description=payload.description,
            category=payload.category,
            status=payload.status
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        
        return APIResponse(
            success=True,
            data={
                "id": new_item.id,
                "title": new_item.title,
                "description": new_item.description,
                "category": new_item.category,
                "status": new_item.status,
                "created_at": "Just now"
            },
            message="Item created successfully"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
