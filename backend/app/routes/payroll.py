from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.base import User, Employee, SalaryStructure
from app.schemas.response import APIResponse, SalaryStructureResponse, WageUpdateRequest
from app.utils.security import get_current_user, require_admin
from app.services.payroll_service import payroll_service

router = APIRouter(prefix="/payroll", tags=["Payroll & Salary"])

@router.get("/my-salary", response_model=APIResponse[SalaryStructureResponse])
def get_my_salary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    sal = db.query(SalaryStructure).filter(SalaryStructure.employee_id == emp.id).first()
    if not sal:
        # Generate default salary structure
        calc = payroll_service.calculate_salary_structure(50000.0)
        sal = SalaryStructure(employee_id=emp.id, **calc)
        db.add(sal)
        db.commit()
        db.refresh(sal)

    return APIResponse(
        success=True,
        message="Salary structure retrieved",
        data=SalaryStructureResponse(
            id=sal.id,
            employee_id=sal.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            employee_code=emp.employee_code,
            monthly_wage=sal.monthly_wage,
            basic_salary=sal.basic_salary,
            hra=sal.hra,
            standard_allowance=sal.standard_allowance,
            performance_bonus=sal.performance_bonus,
            lta=sal.lta,
            fixed_allowance=sal.fixed_allowance,
            pf_deduction=sal.pf_deduction,
            pt_deduction=sal.pt_deduction,
            gross_salary=sal.gross_salary,
            net_salary=sal.net_salary,
            updated_at=sal.updated_at.strftime("%Y-%m-%d %H:%M")
        )
    )

@router.get("/admin/structures", response_model=APIResponse[List[SalaryStructureResponse]])
def get_all_salary_structures(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    structures = db.query(SalaryStructure).join(Employee).order_by(SalaryStructure.id.desc()).all()
    result = [
        SalaryStructureResponse(
            id=s.id,
            employee_id=s.employee_id,
            employee_name=f"{s.employee.first_name} {s.employee.last_name}",
            employee_code=s.employee.employee_code,
            monthly_wage=s.monthly_wage,
            basic_salary=s.basic_salary,
            hra=s.hra,
            standard_allowance=s.standard_allowance,
            performance_bonus=s.performance_bonus,
            lta=s.lta,
            fixed_allowance=s.fixed_allowance,
            pf_deduction=s.pf_deduction,
            pt_deduction=s.pt_deduction,
            gross_salary=s.gross_salary,
            net_salary=s.net_salary,
            updated_at=s.updated_at.strftime("%Y-%m-%d %H:%M")
        )
        for s in structures
    ]
    return APIResponse(success=True, data=result)

@router.put("/admin/structures/{employee_id}", response_model=APIResponse[SalaryStructureResponse])
def update_employee_salary(
    employee_id: int,
    payload: WageUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    calc = payroll_service.calculate_salary_structure(payload.monthly_wage, payload.performance_bonus)
    
    sal = db.query(SalaryStructure).filter(SalaryStructure.employee_id == employee_id).first()
    if not sal:
        sal = SalaryStructure(employee_id=employee_id, **calc)
        db.add(sal)
    else:
        sal.monthly_wage = calc["monthly_wage"]
        sal.basic_salary = calc["basic_salary"]
        sal.hra = calc["hra"]
        sal.standard_allowance = calc["standard_allowance"]
        sal.performance_bonus = calc["performance_bonus"]
        sal.lta = calc["lta"]
        sal.fixed_allowance = calc["fixed_allowance"]
        sal.pf_deduction = calc["pf_deduction"]
        sal.pt_deduction = calc["pt_deduction"]
        sal.gross_salary = calc["gross_salary"]
        sal.net_salary = calc["net_salary"]

    db.commit()
    db.refresh(sal)

    return APIResponse(
        success=True,
        message=f"Salary structure updated for {emp.employee_code}. Net: ?{sal.net_salary:,.2f}",
        data=SalaryStructureResponse(
            id=sal.id,
            employee_id=sal.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            employee_code=emp.employee_code,
            monthly_wage=sal.monthly_wage,
            basic_salary=sal.basic_salary,
            hra=sal.hra,
            standard_allowance=sal.standard_allowance,
            performance_bonus=sal.performance_bonus,
            lta=sal.lta,
            fixed_allowance=sal.fixed_allowance,
            pf_deduction=sal.pf_deduction,
            pt_deduction=sal.pt_deduction,
            gross_salary=sal.gross_salary,
            net_salary=sal.net_salary,
            updated_at=sal.updated_at.strftime("%Y-%m-%d %H:%M")
        )
    )
