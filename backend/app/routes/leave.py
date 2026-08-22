from typing import List
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.base import User, Employee, LeaveType, LeaveRequest, LeaveAllocation, AttendanceRecord
from app.schemas.response import (
    APIResponse, LeaveTypeResponse, LeaveRequestCreate,
    LeaveReviewRequest, LeaveRequestResponse, LeaveAllocationResponse
)
from app.utils.security import get_current_user, require_admin

router = APIRouter(prefix="/leave", tags=["Leave & Time-Off"])

@router.get("/types", response_model=APIResponse[List[LeaveTypeResponse]])
def list_leave_types(db: Session = Depends(get_db)):
    types = db.query(LeaveType).all()
    result = [
        LeaveTypeResponse(id=t.id, name=t.name, code=t.code, max_days_per_year=t.max_days_per_year)
        for t in types
    ]
    return APIResponse(success=True, data=result)

@router.get("/allocations", response_model=APIResponse[List[LeaveAllocationResponse]])
def get_leave_allocations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return APIResponse(success=True, data=[])

    allocs = db.query(LeaveAllocation).filter(LeaveAllocation.employee_id == emp.id).all()
    result = [
        LeaveAllocationResponse(
            leave_type_name=a.leave_type.name if a.leave_type else "Leave",
            total_allocated=a.total_allocated,
            used_days=a.used_days,
            remaining_days=max(0, a.total_allocated - a.used_days)
        )
        for a in allocs
    ]
    return APIResponse(success=True, data=result)

@router.get("/my-requests", response_model=APIResponse[List[LeaveRequestResponse]])
def get_my_leave_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return APIResponse(success=True, data=[])

    requests = db.query(LeaveRequest).filter(LeaveRequest.employee_id == emp.id).order_by(LeaveRequest.id.desc()).all()
    result = [
        LeaveRequestResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            leave_type_name=r.leave_type.name if r.leave_type else "General Leave",
            start_date=r.start_date.strftime("%Y-%m-%d"),
            end_date=r.end_date.strftime("%Y-%m-%d"),
            total_days=r.total_days,
            remarks=r.remarks,
            status=r.status,
            admin_comment=r.admin_comment,
            created_at=r.created_at.strftime("%Y-%m-%d %H:%M")
        )
        for r in requests
    ]
    return APIResponse(success=True, data=result)

@router.post("/request", response_model=APIResponse[LeaveRequestResponse])
def apply_leave(
    payload: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    try:
        s_date = datetime.datetime.strptime(payload.start_date, "%Y-%m-%d").date()
        e_date = datetime.datetime.strptime(payload.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if e_date < s_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

    total_days = (e_date - s_date).days + 1

    # Overlap check
    overlap = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == emp.id,
        LeaveRequest.status != "Rejected",
        LeaveRequest.start_date <= e_date,
        LeaveRequest.end_date >= s_date
    ).first()

    if overlap:
        raise HTTPException(
            status_code=400,
            detail=f"You already have a {overlap.status.lower()} leave request overlapping with this period"
        )

    # Allocation check
    alloc = db.query(LeaveAllocation).filter(
        LeaveAllocation.employee_id == emp.id,
        LeaveAllocation.leave_type_id == payload.leave_type_id
    ).first()

    lt = db.query(LeaveType).filter(LeaveType.id == payload.leave_type_id).first()
    if not lt:
        raise HTTPException(status_code=404, detail="Selected leave type not found")

    if alloc and (alloc.total_allocated - alloc.used_days) < total_days and lt.code != "UNPAID":
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient leave balance for {lt.name}. Remaining: {alloc.total_allocated - alloc.used_days} days, Requested: {total_days} days."
        )

    new_req = LeaveRequest(
        employee_id=emp.id,
        leave_type_id=payload.leave_type_id,
        start_date=s_date,
        end_date=e_date,
        total_days=total_days,
        remarks=payload.remarks.strip() if payload.remarks else None,
        status="Pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    return APIResponse(
        success=True,
        message=f"Leave request submitted for {total_days} day(s)",
        data=LeaveRequestResponse(
            id=new_req.id,
            employee_id=new_req.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            leave_type_name=lt.name,
            start_date=new_req.start_date.strftime("%Y-%m-%d"),
            end_date=new_req.end_date.strftime("%Y-%m-%d"),
            total_days=new_req.total_days,
            remarks=new_req.remarks,
            status=new_req.status,
            admin_comment=new_req.admin_comment,
            created_at=new_req.created_at.strftime("%Y-%m-%d %H:%M")
        )
    )

@router.get("/admin/requests", response_model=APIResponse[List[LeaveRequestResponse]])
def get_all_leave_requests(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    requests = db.query(LeaveRequest).join(Employee).order_by(LeaveRequest.id.desc()).all()
    result = [
        LeaveRequestResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=f"{r.employee.first_name} {r.employee.last_name}",
            leave_type_name=r.leave_type.name if r.leave_type else "Leave",
            start_date=r.start_date.strftime("%Y-%m-%d"),
            end_date=r.end_date.strftime("%Y-%m-%d"),
            total_days=r.total_days,
            remarks=r.remarks,
            status=r.status,
            admin_comment=r.admin_comment,
            created_at=r.created_at.strftime("%Y-%m-%d %H:%M")
        )
        for r in requests
    ]
    return APIResponse(success=True, data=result)

@router.put("/admin/requests/{id}/review", response_model=APIResponse[LeaveRequestResponse])
def review_leave_request(
    id: int,
    payload: LeaveReviewRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    old_status = req.status
    req.status = payload.status
    req.admin_comment = payload.admin_comment
    req.reviewed_by = current_user.id

    # If newly approved, update used allocation and create attendance records
    if payload.status == "Approved" and old_status != "Approved":
        alloc = db.query(LeaveAllocation).filter(
            LeaveAllocation.employee_id == req.employee_id,
            LeaveAllocation.leave_type_id == req.leave_type_id
        ).first()
        if alloc:
            alloc.used_days += req.total_days

        # Auto-mark attendance as 'Leave' for request dates
        curr = req.start_date
        while curr <= req.end_date:
            att = db.query(AttendanceRecord).filter(
                AttendanceRecord.employee_id == req.employee_id,
                AttendanceRecord.date == curr
            ).first()
            if not att:
                att = AttendanceRecord(
                    employee_id=req.employee_id,
                    date=curr,
                    status="Leave",
                    remarks=f"Approved Leave ({req.leave_type.name if req.leave_type else 'Leave'})"
                )
                db.add(att)
            else:
                att.status = "Leave"
                att.remarks = f"Approved Leave ({req.leave_type.name if req.leave_type else 'Leave'})"
            curr += datetime.timedelta(days=1)

    db.commit()
    db.refresh(req)

    return APIResponse(
        success=True,
        message=f"Leave request marked as {payload.status}",
        data=LeaveRequestResponse(
            id=req.id,
            employee_id=req.employee_id,
            employee_name=f"{req.employee.first_name} {req.employee.last_name}",
            leave_type_name=req.leave_type.name if req.leave_type else "Leave",
            start_date=req.start_date.strftime("%Y-%m-%d"),
            end_date=req.end_date.strftime("%Y-%m-%d"),
            total_days=req.total_days,
            remarks=req.remarks,
            status=req.status,
            admin_comment=req.admin_comment,
            created_at=req.created_at.strftime("%Y-%m-%d %H:%M")
        )
    )
