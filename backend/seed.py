import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from roles.models import Role, RolePermission
from permissions.models import Permission

User = get_user_model()

def seed_data():
    print("Starting data seeding...")

    # 1. Define Permissions
    permissions_list = [
        # Folders
        ("View Folder", "view_folder", "Can view folders in explorer"),
        ("Create Folder", "create_folder", "Can create folders in explorer"),
        ("Rename Folder", "rename_folder", "Can rename folders"),
        ("Delete Folder", "delete_folder", "Can delete folders"),
        ("Create Nested Folder", "create_nested_folder", "Can create subfolders inside folders"),
        # Files
        ("Upload Files", "upload_files", "Can upload files"),
        ("Download Files", "download_files", "Can download files"),
        ("Delete Files", "delete_files", "Can delete files"),
        ("Replace Files", "replace_files", "Can replace files (create new versions)"),
        ("Preview Files", "preview_files", "Can preview files inline"),
        # In-App System
        ("View Notifications", "view_notifications", "Can view system notifications"),
        ("View Dashboard", "view_dashboard", "Can view system dashboard stats"),
        # User Admin
        ("Manage Users", "manage_users", "Can view users lists and details"),
        ("Create Users", "create_users", "Can create new users"),
        ("Edit Users", "edit_users", "Can update user details, roles, permissions"),
        ("Delete Users", "delete_users", "Can delete users"),
    ]

    db_permissions = {}
    for name, codename, desc in permissions_list:
        perm, created = Permission.objects.get_or_create(
            codename=codename,
            defaults={"name": name, "description": desc}
        )
        db_permissions[codename] = perm
        if created:
            print(f"Created permission: {codename}")

    # 2. Define Roles
    roles_list = [
        ("Super Admin", "Super Administrator with full system control"),
        ("Admin", "Administrator who can manage files, folders, and users"),
        ("User", "Standard user who can read, preview, upload, and download files in assigned folders"),
    ]

    db_roles = {}
    for name, desc in roles_list:
        role, created = Role.objects.get_or_create(
            name=name,
            defaults={"description": desc}
        )
        db_roles[name] = role
        if created:
            print(f"Created role: {name}")

    # 3. Associate Permissions to Roles
    # Super Admin: In code they bypass check, but let's associate all just in case
    for perm in db_permissions.values():
        RolePermission.objects.get_or_create(role=db_roles["Super Admin"], permission=perm)

    # Admin: gets all permissions
    for perm in db_permissions.values():
        RolePermission.objects.get_or_create(role=db_roles["Admin"], permission=perm)

    # User: gets limited permissions
    user_perms_codenames = [
        "view_folder", "upload_files", "download_files", 
        "preview_files", "view_notifications", "view_dashboard"
    ]
    for code in user_perms_codenames:
        RolePermission.objects.get_or_create(role=db_roles["User"], permission=db_permissions[code])

    print("Role permissions mapped successfully.")

    # 4. Create default users for testing
    users_data = [
        ("superadmin@college.edu", "Super Admin", "superadmin@college.edu", "AdminPass123!", "Super Admin", "Super Admin", "MOU Dept"),
        ("admin@college.edu", "System Admin", "admin@college.edu", "AdminPass123!", "Admin", "MOU Administrator", "MOU Dept"),
        ("user@college.edu", "John Doe", "user@college.edu", "UserPass123!", "User", "MOU Analyst", "MOU Dept"),
    ]

    for email, name, username, password, role_name, designation, department in users_data:
        if not User.objects.filter(email=email).exists():
            role = db_roles[role_name]
            
            # Superuser flag for Django Admin integration
            is_staff = (role_name in ["Super Admin", "Admin"])
            is_superuser = (role_name == "Super Admin")

            user = User.objects.create_user(
                email=email,
                password=password,
                name=name,
                role=role,
                designation=designation,
                department=department,
                is_staff=is_staff,
                is_superuser=is_superuser,
                status="Active"
            )
            print(f"Created user account: {email} with role: {role_name}")
        else:
            print(f"User account '{email}' already exists.")

    # 5. Seed MOU Templates & Sample MOUs
    from mous.models import MOUTemplate, MOU
    from datetime import date, timedelta

    templates = [
        ("Internship", "MOU template for student industrial internship & practical training programs", [
            {"name": "duration", "label": "Duration (Months)", "type": "number"},
            {"name": "students_count", "label": "Eligible Students", "type": "number"},
            {"name": "stipend", "label": "Monthly Stipend", "type": "text"},
        ]),
        ("Placement", "Template for campus recruitment and placement partnerships", [
            {"name": "eligible_depts", "label": "Eligible Departments", "type": "text"},
            {"name": "package", "label": "Expected CTC Package", "type": "text"},
            {"name": "selection_process", "label": "Selection Process", "type": "text"},
        ]),
        ("Research", "Joint research collaboration, funding, & IP agreements", [
            {"name": "funding", "label": "Funding Amount ($)", "type": "text"},
            {"name": "research_area", "label": "Research Domain", "type": "text"},
            {"name": "principal_investigator", "label": "Principal Investigator", "type": "text"},
        ]),
        ("Industry Collaboration", "General industry-academia partnership for workshops and labs", [
            {"name": "lab_setup", "label": "Co-Branded Lab Setup", "type": "text"},
            {"name": "mentor", "label": "Industry Mentor", "type": "text"},
        ]),
    ]

    tmpl_objs = {}
    for tname, tdesc, tfields in templates:
        tmpl, created = MOUTemplate.objects.get_or_create(
            name=tname,
            defaults={"description": tdesc, "fields_schema": tfields, "template_notes": f"Standard {tname} template notes for coordinators."}
        )
        tmpl_objs[tname] = tmpl

    # Sample MOUs
    sample_mous = [
        ("MOU-2026-0001", "ABC Technologies Internship Agreement", "Internship", "ABC Tech Corp", "Engineering", "Active", 12, date(2026, 1, 15)),
        ("MOU-2026-0002", "IIT Bombay Joint Research Initiative", "Research", "IIT Bombay", "Medical", "Active", 24, date(2025, 8, 10)),
        ("MOU-2026-0003", "Infosys Placement & Recruitment Drive", "Placement", "Infosys Ltd", "Engineering", "Pending Verification", 12, date(2026, 7, 1)),
        ("MOU-2026-0004", "TATA Motors Industrial Training", "Industry Collaboration", "TATA Motors", "Commerce", "Expiring Soon", 6, date(2026, 2, 1)),
    ]

    admin_user = User.objects.filter(email="admin@college.edu").first()

    for mnum, mtitle, mtype_name, partner, dept, mstatus, duration, signed_dt in sample_mous:
        if not MOU.objects.filter(mou_number=mnum).exists():
            tmpl = tmpl_objs.get(mtype_name)
            m = MOU(
                mou_number=mnum,
                title=mtitle,
                mou_type=tmpl,
                partner_organization=partner,
                department_name=dept,
                status=mstatus,
                duration_months=duration,
                signed_date=signed_dt,
                created_by=admin_user,
                summary=f"Strategic partnership agreement with {partner} for {mtype_name.lower()} opportunities.",
                purpose=f"To enhance student exposure and practical training in {dept}.",
                beneficiaries=["Students", "Faculty", "Institution"],
                opportunities=["Internship", "Placement", "Training"],
                coordinator_name="Dr. Robert Smith",
                coordinator_email="r.smith@college.edu",
                partner_name="Sarah Jenkins",
                partner_email=f"contact@{partner.lower().replace(' ', '')}.com"
            )
            m.expiry_date = m.calculate_expiry(signed_dt, duration)
            if mstatus == "Expiring Soon":
                m.expiry_date = date.today() + timedelta(days=14)
                m.status = "Active" # will be reported as expiring in UI
            m.save()
            print(f"Created sample MOU: {mnum} - {mtitle}")

    print("Seeding completed successfully.")

if __name__ == "__main__":
    seed_data()

