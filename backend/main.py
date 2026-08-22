import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.database import Base, engine, SessionLocal
from app.models.base import User, Employee, LeaveType, LeaveAllocation, SalaryStructure, AttendanceRecord
from app.utils.logger import logger
from app.utils.security import hash_password
from app.utils.errors import (
    validation_exception_handler,
    integrity_exception_handler,
    http_exception_handler,
    global_exception_handler
)
from app.services.payroll_service import payroll_service
from app.routes import auth, employees, attendance, leave, payroll, health

settings = get_settings()

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    try:
        # 1. Seed Leave Types
        if db.query(LeaveType).count() == 0:
            lt_paid = LeaveType(name="Paid Leave", code="PAID", max_days_per_year=12)
            lt_sick = LeaveType(name="Sick Leave", code="SICK", max_days_per_year=6)
            lt_unpaid = LeaveType(name="Unpaid Leave", code="UNPAID", max_days_per_year=30)
            db.add_all([lt_paid, lt_sick, lt_unpaid])
            db.commit()
            logger.info("Seeded default Leave Types (PAID, SICK, UNPAID).")

        # 2. Seed Admin User & Profile
        admin_user = db.query(User).filter(User.email == "admin@dayflow.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@dayflow.com",
                password_hash=hash_password("Admin@2026"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.flush()

            admin_emp = Employee(
                user_id=admin_user.id,
                employee_code="EMP-2026-000",
                first_name="HR",
                last_name="Administrator",
                phone="+91 9876543210",
                department="HR & Administration",
                job_title="HR Director",
                location="Bangalore HQ",
                joining_date=datetime.date(2024, 1, 1)
            )
            db.add(admin_emp)
            db.flush()

            sal_calc = payroll_service.calculate_salary_structure(120000.0)
            db.add(SalaryStructure(employee_id=admin_emp.id, **sal_calc))
            db.commit()
            logger.info("Seeded default Admin account (admin@dayflow.com / Admin@2026).")

        # 3. Seed Starter Employee Profile
        emp_user = db.query(User).filter(User.email == "john.doe@dayflow.com").first()
        if not emp_user:
            emp_user = User(
                email="john.doe@dayflow.com",
                password_hash=hash_password("Employee@2026"),
                role="employee",
                is_active=True
            )
            db.add(emp_user)
            db.flush()

            emp_profile = Employee(
                user_id=emp_user.id,
                employee_code="EMP-2026-001",
                first_name="John",
                last_name="Doe",
                phone="+91 9123456789",
                personal_email="john.personal@gmail.com",
                department="Engineering",
                job_title="Senior Software Engineer",
                location="Bangalore HQ",
                joining_date=datetime.date(2025, 3, 1),
                address="Indiranagar 100ft Road, Bangalore",
                bank_account="HDFC00012345678"
            )
            db.add(emp_profile)
            db.flush()

            sal_calc = payroll_service.calculate_salary_structure(55000.0)
            db.add(SalaryStructure(employee_id=emp_profile.id, **sal_calc))

            # Allocations
            leave_types = db.query(LeaveType).all()
            for lt in leave_types:
                db.add(LeaveAllocation(
                    employee_id=emp_profile.id,
                    leave_type_id=lt.id,
                    total_allocated=lt.max_days_per_year,
                    used_days=0,
                    year=2026
                ))

            # Sample attendance record
            db.add(AttendanceRecord(
                employee_id=emp_profile.id,
                date=datetime.date.today(),
                check_in=datetime.datetime.now() - datetime.timedelta(hours=5),
                total_hours=5.0,
                status="Present"
            ))

            db.commit()
            logger.info("Seeded default Employee account (john.doe@dayflow.com / Employee@2026).")

    except Exception as e:
        db.rollback()
        logger.warning(f"Seed note: {e}")
    finally:
        db.close()

seed_database()

app = FastAPI(
    title="Dayflow HRMS API",
    version="1.0.0",
    description="Odoo x NMIT Bangalore Hackathon 2026 - Human Resource Management System Backend API",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Register Dayflow HRMS Routers
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(leave.router, prefix="/api")
app.include_router(payroll.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to Dayflow HRMS API Server",
        "database": settings.DATABASE_URL.split("://")[0],
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
