class PayrollService:
    @staticmethod
    def calculate_salary_structure(monthly_wage: float, performance_bonus: float = 0.0) -> dict:
        wage = float(monthly_wage)
        if wage <= 0:
            raise ValueError("Monthly wage must be a positive number greater than 0")

        basic = round(0.50 * wage, 2)
        hra = round(0.50 * basic, 2)
        standard_allowance = round(min(2500.0, 0.05 * wage), 2)
        lta = round(min(1500.0, 0.03 * wage), 2)
        bonus = round(float(performance_bonus), 2)

        # Fixed allowance accounts for the remaining wage
        fixed_allowance = round(wage - (basic + hra + standard_allowance + lta + bonus), 2)
        if fixed_allowance < 0:
            fixed_allowance = 0.0

        # Deductions
        pf_deduction = round(0.12 * basic, 2)
        pt_deduction = 200.0 if wage >= 15000.0 else 0.0

        gross_salary = wage
        net_salary = round(gross_salary - (pf_deduction + pt_deduction), 2)

        return {
            "monthly_wage": wage,
            "basic_salary": basic,
            "hra": hra,
            "standard_allowance": standard_allowance,
            "performance_bonus": bonus,
            "lta": lta,
            "fixed_allowance": fixed_allowance,
            "pf_deduction": pf_deduction,
            "pt_deduction": pt_deduction,
            "gross_salary": gross_salary,
            "net_salary": net_salary
        }

payroll_service = PayrollService()
