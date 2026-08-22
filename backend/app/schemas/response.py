from typing import Generic, TypeVar, Optional, Any, List, Dict
from pydantic import BaseModel, Field, EmailStr, field_validator
import datetime

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = "Operation successful"
    errors: Optional[List[Dict[str, Any]]] = None

# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str
    employee_id: Optional[int] = None
    employee_code: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

# --- EMPLOYEE SCHEMAS ---
class EmployeeCreate(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: Optional[str] = Field("Dayflow@2026", min_length=6)
    department: str = Field("Engineering", min_length=2, max_length=100)
    job_title: str = Field("Software Engineer", min_length=2, max_length=100)
    monthly_wage: float = Field(50000.0, ge=10000.0, le=1000000.0)
    phone: Optional[str] = None
    location: Optional[str] = "Bangalore HQ"
    role: str = Field("employee", description="Role: employee or admin")

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    address: Optional[str] = None
    bank_account: Optional[str] = None
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None

class EmployeeResponse(BaseModel):
    id: int
    user_id: int
    employee_code: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    personal_email: Optional[str] = None
    department: str
    job_title: str
    company: str
    location: str
    joining_date: str
    dob: Optional[str] = None
    gender: str
    marital_status: str
    address: Optional[str] = None
    bank_account: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str

# --- ATTENDANCE SCHEMAS ---
class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    total_hours: float
    status: str
    remarks: Optional[str] = None

# --- LEAVE SCHEMAS ---
class LeaveTypeResponse(BaseModel):
    id: int
    name: str
    code: str
    max_days_per_year: int

class LeaveRequestCreate(BaseModel):
    leave_type_id: int
    start_date: str
    end_date: str
    remarks: Optional[str] = None

class LeaveReviewRequest(BaseModel):
    status: str = Field(..., description="Approved or Rejected")
    admin_comment: Optional[str] = None

    @field_validator("status")
    def validate_review_status(cls, v):
        if v.title() not in {"Approved", "Rejected"}:
            raise ValueError("Status must be 'Approved' or 'Rejected'")
        return v.title()

class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    leave_type_name: str
    start_date: str
    end_date: str
    total_days: int
    remarks: Optional[str] = None
    status: str
    admin_comment: Optional[str] = None
    created_at: str

class LeaveAllocationResponse(BaseModel):
    leave_type_name: str
    total_allocated: int
    used_days: int
    remaining_days: int

# --- PAYROLL SCHEMAS ---
class WageUpdateRequest(BaseModel):
    monthly_wage: float = Field(..., ge=10000.0, le=2000000.0)
    performance_bonus: Optional[float] = Field(0.0, ge=0.0)

class SalaryStructureResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    monthly_wage: float
    basic_salary: float
    hra: float
    standard_allowance: float
    performance_bonus: float
    lta: float
    fixed_allowance: float
    pf_deduction: float
    pt_deduction: float
    gross_salary: float
    net_salary: float
    updated_at: str
