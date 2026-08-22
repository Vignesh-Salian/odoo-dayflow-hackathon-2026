import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Float, Boolean, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="employee")  # 'admin' or 'employee'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee_profile = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_code = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    personal_email = Column(String(255), nullable=True)
    department = Column(String(100), default="Engineering", index=True)
    job_title = Column(String(100), default="Software Engineer")
    company = Column(String(100), default="Dayflow Inc")
    location = Column(String(100), default="Bangalore HQ")
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    joining_date = Column(Date, default=datetime.date.today)
    dob = Column(Date, nullable=True)
    gender = Column(String(20), default="Male")
    marital_status = Column(String(20), default="Single")
    address = Column(Text, nullable=True)
    bank_account = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="employee_profile")
    manager = relationship("Employee", remote_side=[id])
    attendance_records = relationship("AttendanceRecord", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    leave_allocations = relationship("LeaveAllocation", back_populates="employee", cascade="all, delete-orphan")
    salary_structure = relationship("SalaryStructure", back_populates="employee", uselist=False, cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("employee_id", "date", name="uix_emp_attendance_date"),)

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    total_hours = Column(Float, default=0.0)
    status = Column(String(50), nullable=False, default="Present")  # 'Present', 'Half-day', 'Absent', 'Leave'
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("Employee", back_populates="attendance_records")

class LeaveType(Base):
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # 'Paid Leave', 'Sick Leave', 'Unpaid Leave'
    code = Column(String(20), unique=True, nullable=False)  # 'PAID', 'SICK', 'UNPAID'
    max_days_per_year = Column(Integer, default=12)

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, nullable=False, default=1)
    remarks = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Pending")  # 'Pending', 'Approved', 'Rejected'
    admin_comment = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("Employee", back_populates="leave_requests")
    leave_type = relationship("LeaveType")

class LeaveAllocation(Base):
    __tablename__ = "leave_allocations"
    __table_args__ = (UniqueConstraint("employee_id", "leave_type_id", "year", name="uix_emp_leave_year"),)

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    total_allocated = Column(Integer, default=12)
    used_days = Column(Integer, default=0)
    year = Column(Integer, default=2026)

    employee = relationship("Employee", back_populates="leave_allocations")
    leave_type = relationship("LeaveType")

class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=False)
    monthly_wage = Column(Float, nullable=False, default=50000.0)
    basic_salary = Column(Float, nullable=False)
    hra = Column(Float, nullable=False)
    standard_allowance = Column(Float, nullable=False, default=2500.0)
    performance_bonus = Column(Float, nullable=False, default=0.0)
    lta = Column(Float, nullable=False, default=1500.0)
    fixed_allowance = Column(Float, nullable=False)
    pf_deduction = Column(Float, nullable=False)
    pt_deduction = Column(Float, nullable=False, default=200.0)
    gross_salary = Column(Float, nullable=False)
    net_salary = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    employee = relationship("Employee", back_populates="salary_structure")
