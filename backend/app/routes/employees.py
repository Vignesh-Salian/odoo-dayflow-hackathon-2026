from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.base import User, Employee, SalaryStructure, LeaveAllocation, LeaveType
from app.schemas.response import APIResponse, EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.utils.security import get_current_user, require_admin, hash_password
from app.services.payroll_service import payroll_service

router = APIRouter(prefix="/employees", tags=["Employee Management"])

def generate_employee_code(db: Session) -> str:
    count = db.query(Employee).count() + 1
    return f"EMP-2026-{count:03d}"

@router.get("", response_model=APIResponse[List[EmployeeResponse]])
def list_employees(
    department: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Employee).join(User)
    if department:
        query = query.filter(Employee.department == department)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Employee.first_name.ilike(search_pattern)) |
            (Employee.last_name.ilike(search_pattern)) |
            (Employee.employee_code.ilike(search_pattern)) |
            (User.email.ilike(search_pattern))
        )
    
    employees = query.order_by(Employee.id.desc()).all()
    
    result = []
    for emp in employees:
        result.append(
            EmployeeResponse(
                id=emp.id,
                user_id=emp.user_id,
                employee_code=emp.employee_code,
                first_name=emp.first_name,
                last_name=emp.last_name,
                email=emp.user.email if emp.user else "",
                phone=emp.phone,
                personal_email=emp.personal_email,
                department=emp.department,
                job_title=emp.job_title,
                company=emp.company,
                location=emp.location,
                joining_date=emp.joining_date.strftime("%Y-%m-%d") if emp.joining_date else "",
                dob=emp.dob.strftime("%Y-%m-%d") if emp.dob else None,
                gender=emp.gender,
                marital_status=emp.marital_status,
                address=emp.address,
                bank_account=emp.bank_account,
                avatar_url=emp.avatar_url,
                role=emp.user.role if emp.user else "employee"
            )
        )
    return APIResponse(success=True, data=result, message=f"Fetched {len(result)} employees")

@router.post("", response_model=APIResponse[EmployeeResponse])
def create_employee(
    payload: EmployeeCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Check duplicate email
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{payload.email}' already exists"
        )
    
    # 1. Create User
    new_user = User(
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
        role=payload.role.lower(),
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # 2. Create Employee
    code = generate_employee_code(db)
    new_emp = Employee(
        user_id=new_user.id,
        employee_code=code,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone,
        department=payload.department,
        job_title=payload.job_title,
        location=payload.location or "Bangalore HQ",
        joining_date=datetime.date.today()
    )
    db.add(new_emp)
    db.flush()

    # 3. Auto-calculate and create Salary Structure
    sal_calc = payroll_service.calculate_salary_structure(payload.monthly_wage)
    new_sal = SalaryStructure(
        employee_id=new_emp.id,
        monthly_wage=sal_calc["monthly_wage"],
        basic_salary=sal_calc["basic_salary"],
        hra=sal_calc["hra"],
        standard_allowance=sal_calc["standard_allowance"],
        performance_bonus=sal_calc["performance_bonus"],
        lta=sal_calc["lta"],
        fixed_allowance=sal_calc["fixed_allowance"],
        pf_deduction=sal_calc["pf_deduction"],
        pt_deduction=sal_calc["pt_deduction"],
        gross_salary=sal_calc["gross_salary"],
        net_salary=sal_calc["net_salary"]
    )
    db.add(new_sal)

    # 4. Auto-allocate default Leave Types
    leave_types = db.query(LeaveType).all()
    for lt in leave_types:
        alloc = LeaveAllocation(
            employee_id=new_emp.id,
            leave_type_id=lt.id,
            total_allocated=lt.max_days_per_year,
            used_days=0,
            year=2026
        )
        db.add(alloc)

    db.commit()
    db.refresh(new_emp)

    return APIResponse(
        success=True,
        message=f"Employee {new_emp.employee_code} created successfully",
        data=EmployeeResponse(
            id=new_emp.id,
            user_id=new_emp.user_id,
            employee_code=new_emp.employee_code,
            first_name=new_emp.first_name,
            last_name=new_emp.last_name,
            email=new_user.email,
            phone=new_emp.phone,
            personal_email=new_emp.personal_email,
            department=new_emp.department,
            job_title=new_emp.job_title,
            company=new_emp.company,
            location=new_emp.location,
            joining_date=new_emp.joining_date.strftime("%Y-%m-%d"),
            dob=None,
            gender=new_emp.gender,
            marital_status=new_emp.marital_status,
            address=new_emp.address,
            bank_account=new_emp.bank_account,
            avatar_url=new_emp.avatar_url,
            role=new_user.role
        )
    )

@router.get("/{id}", response_model=APIResponse[EmployeeResponse])
def get_employee(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Authorization Check: Admin or Self
    if current_user.role.lower() != "admin" and emp.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access your own profile")

    return APIResponse(
        success=True,
        message="Employee profile retrieved",
        data=EmployeeResponse(
            id=emp.id,
            user_id=emp.user_id,
            employee_code=emp.employee_code,
            first_name=emp.first_name,
            last_name=emp.last_name,
            email=emp.user.email if emp.user else "",
            phone=emp.phone,
            personal_email=emp.personal_email,
            department=emp.department,
            job_title=emp.job_title,
            company=emp.company,
            location=emp.location,
            joining_date=emp.joining_date.strftime("%Y-%m-%d") if emp.joining_date else "",
            dob=emp.dob.strftime("%Y-%m-%d") if emp.dob else None,
            gender=emp.gender,
            marital_status=emp.marital_status,
            address=emp.address,
            bank_account=emp.bank_account,
            avatar_url=emp.avatar_url,
            role=emp.user.role if emp.user else "employee"
        )
    )

@router.put("/{id}", response_model=APIResponse[EmployeeResponse])
def update_employee(
    id: int,
    payload: EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    is_admin = current_user.role.lower() == "admin"
    is_self = emp.user_id == current_user.id

    if not is_admin and not is_self:
        raise HTTPException(status_code=403, detail="Forbidden: Cannot edit another employee profile")

    # Permitted fields for self
    if payload.first_name and (is_admin or is_self): emp.first_name = payload.first_name.strip()
    if payload.last_name and (is_admin or is_self): emp.last_name = payload.last_name.strip()
    if payload.phone is not None: emp.phone = payload.phone.strip()
    if payload.personal_email is not None: emp.personal_email = payload.personal_email.strip()
    if payload.address is not None: emp.address = payload.address.strip()
    if payload.bank_account is not None: emp.bank_account = payload.bank_account.strip()
    if payload.avatar_url is not None: emp.avatar_url = payload.avatar_url.strip()

    # Admin-only fields
    if is_admin:
        if payload.department: emp.department = payload.department.strip()
        if payload.job_title: emp.job_title = payload.job_title.strip()
        if payload.location: emp.location = payload.location.strip()

    db.commit()
    db.refresh(emp)

    return APIResponse(
        success=True,
        message="Employee profile updated successfully",
        data=EmployeeResponse(
            id=emp.id,
            user_id=emp.user_id,
            employee_code=emp.employee_code,
            first_name=emp.first_name,
            last_name=emp.last_name,
            email=emp.user.email if emp.user else "",
            phone=emp.phone,
            personal_email=emp.personal_email,
            department=emp.department,
            job_title=emp.job_title,
            company=emp.company,
            location=emp.location,
            joining_date=emp.joining_date.strftime("%Y-%m-%d") if emp.joining_date else "",
            dob=emp.dob.strftime("%Y-%m-%d") if emp.dob else None,
            gender=emp.gender,
            marital_status=emp.marital_status,
            address=emp.address,
            bank_account=emp.bank_account,
            avatar_url=emp.avatar_url,
            role=emp.user.role if emp.user else "employee"
        )
    )
