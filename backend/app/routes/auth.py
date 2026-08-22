from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.base import User, Employee
from app.schemas.response import APIResponse, LoginRequest, TokenResponse
from app.utils.security import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=APIResponse[TokenResponse])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact HR Officer."
        )

    emp = db.query(Employee).filter(Employee.user_id == user.id).first()
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return APIResponse(
        success=True,
        message="Login successful",
        data=TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id,
            email=user.email,
            role=user.role,
            employee_id=emp.id if emp else None,
            employee_code=emp.employee_code if emp else None,
            first_name=emp.first_name if emp else "Admin",
            last_name=emp.last_name if emp else "User"
        )
    )

@router.get("/me", response_model=APIResponse[dict])
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    return APIResponse(
        success=True,
        message="Current user profile retrieved",
        data={
            "user_id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "employee_id": emp.id if emp else None,
            "employee_code": emp.employee_code if emp else None,
            "first_name": emp.first_name if emp else "Admin",
            "last_name": emp.last_name if emp else "User",
            "department": emp.department if emp else "Administration",
            "job_title": emp.job_title if emp else "HR Administrator"
        }
    )
