from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from roles.models import Role, RolePermission
from permissions.models import Permission
from folders.models import Folder, FolderPermission
from users.models import UserPermission

User = get_user_model()

class DocumentManagementSystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Create permissions
        self.view_dashboard = Permission.objects.create(
            name="View Dashboard", codename="view_dashboard", description="View dashboard stats"
        )
        self.manage_users = Permission.objects.create(
            name="Manage Users", codename="manage_users", description="Manage users list"
        )
        self.view_folder = Permission.objects.create(
            name="View Folder", codename="view_folder", description="View explorer folders"
        )
        self.create_folder = Permission.objects.create(
            name="Create Folder", codename="create_folder", description="Create folders"
        )

        # 2. Create roles
        self.super_admin_role = Role.objects.create(name="Super Admin", description="Super Admin")
        self.admin_role = Role.objects.create(name="Admin", description="Admin")
        self.user_role = Role.objects.create(name="User", description="User")

        # Map some permissions to User role
        RolePermission.objects.create(role=self.user_role, permission=self.view_dashboard)
        RolePermission.objects.create(role=self.user_role, permission=self.view_folder)

        # Map all permissions to Admin role
        RolePermission.objects.create(role=self.admin_role, permission=self.view_dashboard)
        RolePermission.objects.create(role=self.admin_role, permission=self.manage_users)
        RolePermission.objects.create(role=self.admin_role, permission=self.view_folder)
        RolePermission.objects.create(role=self.admin_role, permission=self.create_folder)

        # 3. Create users
        self.super_admin = User.objects.create_user(
            email="superadmin@test.edu", password="password123", name="Super Admin", role=self.super_admin_role
        )
        self.admin_user = User.objects.create_user(
            email="admin@test.edu", password="password123", name="Admin User", role=self.admin_role
        )
        self.normal_user = User.objects.create_user(
            email="user@test.edu", password="password123", name="Normal User", role=self.user_role
        )

    def get_jwt_token(self, email, password):
        response = self.client.post('/api/users/auth/login/', {'email': email, 'password': password})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data['access']

    def test_jwt_login_success(self):
        token = self.get_jwt_token("user@test.edu", "password123")
        self.assertIsNotNone(token)

    def test_jwt_login_failed_with_disabled_user(self):
        self.normal_user.status = 'Disabled'
        self.normal_user.save()

        response = self.client.post('/api/users/auth/login/', {'email': 'user@test.edu', 'password': 'password123'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_dashboard_permission_for_user(self):
        # Normal User has view_dashboard permission by role
        token = self.get_jwt_token("user@test.edu", "password123")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_manage_users_permission_for_user_blocked(self):
        # Normal User does NOT have manage_users permission by role
        token = self.get_jwt_token("user@test.edu", "password123")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        # Accessing users list (which requires manage_users)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_permission_override_grant(self):
        # Grant normal_user manage_users override permission
        UserPermission.objects.create(user=self.normal_user, permission=self.manage_users, is_granted=True)

        token = self.get_jwt_token("user@test.edu", "password123")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        # Now they should be allowed to view users
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_permission_override_revoke(self):
        # Revoke normal_user view_dashboard permission (which is normally granted by role)
        UserPermission.objects.create(user=self.normal_user, permission=self.view_dashboard, is_granted=False)

        token = self.get_jwt_token("user@test.edu", "password123")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        # Now they should be blocked
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_folder_access_inheritance(self):
        # Create a hierarchy: Root -> Company A -> Legal
        root_folder = Folder.objects.create(name="Company A", created_by=self.admin_user)
        child_folder = Folder.objects.create(name="Legal", parent=root_folder, created_by=self.admin_user)

        token = self.get_jwt_token("user@test.edu", "password123")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        # 1. By default, Normal User cannot access root folder (it falls back to False)
        self.assertFalse(root_folder.has_access(self.normal_user))
        
        # 2. Grant explicit access on root folder
        FolderPermission.objects.create(user=self.normal_user, folder=root_folder, is_granted=True)

        # 3. User should now have access to root folder and child folder (inherited!)
        self.assertTrue(root_folder.has_access(self.normal_user))
        self.assertTrue(child_folder.has_access(self.normal_user))

        # 4. Revoke access explicitly on child folder
        FolderPermission.objects.create(user=self.normal_user, folder=child_folder, is_granted=False)

        # 5. User has access to root, but blocked on child
        self.assertTrue(root_folder.has_access(self.normal_user))
        self.assertFalse(child_folder.has_access(self.normal_user))

    def test_create_user_invitation(self):
        # Authenticate as super admin
        token = self.get_jwt_token("superadmin@test.edu", "password123")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        # Create invitation with email only
        response = self.client.post('/api/users/invite/', {
            'email': 'invitee@test.edu'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        
        # Verify invitation exists in DB with default stream, department and role
        from users.models import UserInvitation
        invitation = UserInvitation.objects.get(email='invitee@test.edu')
        self.assertEqual(invitation.department, '')
        self.assertEqual(invitation.stream, '')
        self.assertEqual(invitation.system_role.name, 'User')

    def test_public_get_invitation_by_token(self):
        # Create invitation directly
        from users.models import UserInvitation
        from django.utils import timezone
        from datetime import timedelta
        from users.invitation_services import TokenService

        expires_at = timezone.now() + timedelta(hours=24)
        token = TokenService.generate_token('invitee2@test.edu', 'Aided', 'Physics', self.user_role.id, expires_at)
        
        invitation = UserInvitation.objects.create(
            email='invitee2@test.edu',
            stream='Aided',
            department='Physics',
            system_role=self.user_role,
            token=token,
            expires_at=expires_at,
            created_by=self.super_admin
        )

        # Public user fetches invitation metadata
        response = self.client.get(f'/api/users/invitation/{token}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'invitee2@test.edu')
        self.assertEqual(response.data['department'], 'Physics')

    def test_register_via_invitation_success(self):
        # Create invitation directly
        from users.models import UserInvitation
        from django.utils import timezone
        from datetime import timedelta
        from users.invitation_services import TokenService

        expires_at = timezone.now() + timedelta(hours=24)
        token = TokenService.generate_token('invitee3@test.edu', 'Self-Financed (SFS)', 'Commerce', self.user_role.id, expires_at)
        
        invitation = UserInvitation.objects.create(
            email='invitee3@test.edu',
            stream='Self-Financed (SFS)',
            department='Commerce',
            system_role=self.user_role,
            token=token,
            expires_at=expires_at,
            created_by=self.super_admin
        )

        # Register using the token
        response = self.client.post('/api/users/register/', {
            'token': token,
            'name': 'New Registrant',
            'password': 'StrongPassword@123',
            'designation': 'Assistant Professor'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify CustomUser was created in database
        user_created = User.objects.get(email='invitee3@test.edu')
        self.assertEqual(user_created.name, 'New Registrant')
        self.assertEqual(user_created.department, 'Commerce')
        self.assertEqual(user_created.stream, 'Self-Financed (SFS)')
        self.assertEqual(user_created.role, self.user_role)
        self.assertEqual(user_created.designation, 'Assistant Professor')

        # Verify invitation is marked as used
        invitation.refresh_from_db()
        self.assertTrue(invitation.is_used)

    def test_register_via_invitation_fails_with_invalid_password(self):
        # Create invitation directly
        from users.models import UserInvitation
        from django.utils import timezone
        from datetime import timedelta
        from users.invitation_services import TokenService

        expires_at = timezone.now() + timedelta(hours=24)
        token = TokenService.generate_token('invitee4@test.edu', 'Aided', 'History', self.user_role.id, expires_at)
        
        invitation = UserInvitation.objects.create(
            email='invitee4@test.edu',
            stream='Aided',
            department='History',
            system_role=self.user_role,
            token=token,
            expires_at=expires_at,
            created_by=self.super_admin
        )

        # Register with simple password (missing uppercase/special)
        response = self.client.post('/api/users/register/', {
            'token': token,
            'name': 'Weak Pass User',
            'password': 'password123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
