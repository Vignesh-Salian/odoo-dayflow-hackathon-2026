from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.base import User, Employee, AttendanceRecord
from app.schemas.response import APIResponse, AttendanceResponse
from app.utils.security import get_current_user, require_admin

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

@router.post("/check-in", response_model=APIResponse[AttendanceResponse])
def check_in(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    today = datetime.date.today()
    now = datetime.datetime.now()

    rec = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == emp.id,
        AttendanceRecord.date == today
    ).first()

    if rec and rec.check_in and not rec.check_out:
        raise HTTPException(status_code=400, detail="You already have an active check-in today")

    if not rec:
        rec = AttendanceRecord(
            employee_id=emp.id,
            date=today,
            check_in=now,
            status="Present"
        )
        db.add(rec)
    else:
        # Re-checkin
        rec.check_in = now
        rec.check_out = None
        rec.total_hours = 0.0
        rec.status = "Present"

    db.commit()
    db.refresh(rec)

    return APIResponse(
        success=True,
        message=f"Checked in successfully at {now.strftime('%I:%M %p')}",
        data=AttendanceResponse(
            id=rec.id,
            employee_id=rec.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            date=rec.date.strftime("%Y-%m-%d"),
            check_in=rec.check_in.strftime("%H:%M:%S") if rec.check_in else None,
            check_out=rec.check_out.strftime("%H:%M:%S") if rec.check_out else None,
            total_hours=rec.total_hours,
            status=rec.status,
            remarks=rec.remarks
        )
    )

@router.post("/check-out", response_model=APIResponse[AttendanceResponse])
def check_out(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    today = datetime.date.today()
    now = datetime.datetime.now()

    rec = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == emp.id,
        AttendanceRecord.date == today
    ).first()

    if not rec or not rec.check_in:
        raise HTTPException(status_code=400, detail="Cannot check out without an active check-in today")

    if rec.check_out:
        raise HTTPException(status_code=400, detail="You have already checked out for today")

    rec.check_out = now
    duration = (now - rec.check_in).total_seconds() / 3600.0
    rec.total_hours = round(max(0.0, duration), 2)
    
    if rec.total_hours < 4.0:
        rec.status = "Half-day"
    else:
        rec.status = "Present"

    db.commit()
    db.refresh(rec)

    return APIResponse(
        success=True,
        message=f"Checked out successfully. Total hours: {rec.total_hours} hrs",
        data=AttendanceResponse(
            id=rec.id,
            employee_id=rec.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            date=rec.date.strftime("%Y-%m-%d"),
            check_in=rec.check_in.strftime("%H:%M:%S") if rec.check_in else None,
            check_out=rec.check_out.strftime("%H:%M:%S") if rec.check_out else None,
            total_hours=rec.total_hours,
            status=rec.status,
            remarks=rec.remarks
        )
    )

@router.get("/status", response_model=APIResponse[dict])
def get_today_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return APIResponse(success=True, data={"has_profile": False})

    today = datetime.date.today()
    rec = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == emp.id,
        AttendanceRecord.date == today
    ).first()

    return APIResponse(
        success=True,
        data={
            "has_profile": True,
            "employee_id": emp.id,
            "date": today.strftime("%Y-%m-%d"),
            "is_checked_in": bool(rec and rec.check_in and not rec.check_out),
            "is_checked_out": bool(rec and rec.check_out),
            "check_in_time": rec.check_in.strftime("%I:%M %p") if rec and rec.check_in else None,
            "check_out_time": rec.check_out.strftime("%I:%M %p") if rec and rec.check_out else None,
            "total_hours": rec.total_hours if rec else 0.0,
            "status": rec.status if rec else "Not Marked"
        }
    )

@router.get("/my-logs", response_model=APIResponse[List[AttendanceResponse]])
def get_my_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return APIResponse(success=True, data=[])

    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == emp.id
    ).order_by(AttendanceRecord.date.desc()).all()

    result = [
        AttendanceResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            date=r.date.strftime("%Y-%m-%d"),
            check_in=r.check_in.strftime("%H:%M:%S") if r.check_in else None,
            check_out=r.check_out.strftime("%H:%M:%S") if r.check_out else None,
            total_hours=r.total_hours,
            status=r.status,
            remarks=r.remarks
        )
        for r in records
    ]
    return APIResponse(success=True, data=result, message=f"Fetched {len(result)} records")

@router.get("/company", response_model=APIResponse[List[AttendanceResponse]])
def get_company_logs(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    records = db.query(AttendanceRecord).join(Employee).order_by(AttendanceRecord.date.desc(), AttendanceRecord.id.desc()).all()
    result = [
        AttendanceResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=f"{r.employee.first_name} {r.employee.last_name}",
            date=r.date.strftime("%Y-%m-%d"),
            check_in=r.check_in.strftime("%H:%M:%S") if r.check_in else None,
            check_out=r.check_out.strftime("%H:%M:%S") if r.check_out else None,
            total_hours=r.total_hours,
            status=r.status,
            remarks=r.remarks
        )
        for r in records
    ]
    return APIResponse(success=True, data=result, message=f"Fetched {len(result)} company attendance records")
