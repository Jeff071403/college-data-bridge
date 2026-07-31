from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile
from datetime import date

from roles.models import Role
from folders.models import Folder
from files.models import File
from mous.models import MOU, MOUShare, DepartmentSubmission

User = get_user_model()

class MOUSharingTests(APITestCase):
    def setUp(self):
        # Create Roles
        self.super_admin_role = Role.objects.create(name='Super Admin', description='Super admin role')
        self.admin_role = Role.objects.create(name='Admin', description='Admin role')
        self.dept_user_role = Role.objects.create(name='Normal User', description='Department user role')

        # Create Users
        self.admin = User.objects.create_user(
            email='admin@mcc.edu',
            password='password123',
            name='Admin User',
            role=self.admin_role
        )
        self.dept_user = User.objects.create_user(
            email='cs_aided@mcc.edu',
            password='password123',
            name='CS Aided User',
            role=self.dept_user_role,
            department='Computer Science (Aided)'
        )

        # Create Folders
        self.mou_folder = Folder.objects.create(
            name='Infosys MOU Folder',
            google_folder_id='folder_infosys_123',
            created_by=self.admin
        )

        # Create MOU
        self.mou = MOU.objects.create(
            title='Infosys MOU',
            mou_number='MOU/2026/INF01',
            partner_organization='Infosys Ltd',
            duration_months=36,
            expiry_date=date(2029, 7, 27),
            department=self.mou_folder,
            status='Draft',
            created_by=self.admin
        )

    @patch('services.drive_service.create_folder')
    def test_share_mou_folder(self, mock_create_folder):
        mock_create_folder.return_value = 'mock_google_submission_folder_id'
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('mou-share', args=[self.mou.id])
        
        data = {
            'department_name': 'Computer Science (Aided)',
            'permission': 'Upload Only'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify share record was created
        shares = MOUShare.objects.filter(mou=self.mou)
        self.assertEqual(shares.count(), 1)
        self.assertEqual(shares.first().department.name, 'Computer Science (Aided)')
        self.assertEqual(shares.first().permission, 'Upload Only')
        self.assertEqual(shares.first().status, 'Shared')
        
        # Verify subfolder 'Department Submission' was created in DB and synced
        submission_folder = Folder.objects.filter(parent=self.mou_folder, name='Department Submission').first()
        self.assertIsNotNone(submission_folder)
        self.assertEqual(submission_folder.google_folder_id, 'mock_google_submission_folder_id')

    def test_revoke_mou_share(self):
        # Setup share
        dept_folder = Folder.objects.create(name='Computer Science (Aided)', created_by=self.admin)
        share = MOUShare.objects.create(
            mou=self.mou,
            department=dept_folder,
            permission='View Only',
            status='Shared',
            shared_by=self.admin
        )

        self.client.force_authenticate(user=self.admin)
        url = reverse('mou-share-delete', args=[share.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MOUShare.objects.filter(id=share.id).exists())

    @patch('services.drive_service.upload_file')
    @patch('services.drive_service.create_folder')
    def test_department_submission_multipart(self, mock_create_folder, mock_upload_file):
        mock_create_folder.return_value = 'mock_sub_google_id'
        mock_upload_file.return_value = {
            'id': 'mock_uploaded_file_google_id',
            'mimeType': 'application/pdf',
            'size': 5000,
            'webViewLink': 'https://drive.google.com/mock',
            'webContentLink': 'https://drive.google.com/mock/download'
        }

        # First, share the folder with the department so the user has access
        dept_folder = Folder.objects.create(name='Computer Science (Aided)', created_by=self.admin)
        MOUShare.objects.create(
            mou=self.mou,
            department=dept_folder,
            permission='Upload Only',
            status='Shared',
            shared_by=self.admin
        )

        self.client.force_authenticate(user=self.dept_user)
        url = reverse('mou-submission')

        # Dummy signed copy PDF
        pdf_file = SimpleUploadedFile("signed_infosys.pdf", b"pdf content", content_type="application/pdf")

        data = {
            'mou_id': self.mou.id,
            'file': pdf_file,
            'signed_date': '2026-07-27',
            'mou_month': 'July',
            'mou_year': 2026,
            'summary': 'This agreement establishes Infosys academic linkage.',
            'purpose': 'Providing placement and internship opportunities.',
            'benefits': 'Placement links, guest lectures, curriculum audit.',
            'remarks': 'Uploaded signed scanned version.'
        }

        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify database changes
        sub = DepartmentSubmission.objects.filter(mou=self.mou).first()
        self.assertIsNotNone(sub)
        self.assertEqual(sub.review_status, 'Pending Verification')
        self.assertEqual(sub.mou_year, 2026)
        self.assertEqual(sub.mou_month, 'July')
        self.assertEqual(sub.signed_file.google_file_id, 'mock_uploaded_file_google_id')

        # Verify MOU status updated
        self.mou.refresh_from_db()
        self.assertEqual(self.mou.status, 'Pending Verification')

    @patch('services.drive_service.upload_file')
    @patch('services.drive_service.create_folder')
    def test_department_submission_backdated(self, mock_create_folder, mock_upload_file):
        mock_create_folder.return_value = 'mock_sub_google_id'
        mock_upload_file.return_value = {
            'id': 'mock_uploaded_file_google_id',
            'mimeType': 'application/pdf',
            'size': 5000,
            'webViewLink': 'https://drive.google.com/mock',
            'webContentLink': 'https://drive.google.com/mock/download'
        }

        dept_folder = Folder.objects.create(name='Computer Science (Aided)', created_by=self.admin)
        MOUShare.objects.create(
            mou=self.mou,
            department=dept_folder,
            permission='Upload Only',
            status='Shared',
            shared_by=self.admin
        )

        self.client.force_authenticate(user=self.dept_user)
        url = reverse('mou-submission')

        pdf_file = SimpleUploadedFile("signed_infosys.pdf", b"pdf content", content_type="application/pdf")

        data = {
            'mou_id': self.mou.id,
            'file': pdf_file,
            'signed_date': '2026-07-27',
            'mou_month': 'July',
            'mou_year': 2026,
            'summary': 'This agreement establishes Infosys academic linkage.',
            'purpose': 'Providing placement and internship opportunities.',
            'benefits': 'Placement links, guest lectures, curriculum audit.',
            'remarks': 'Uploaded signed scanned version.',
            'created_at': '2026-07-25T10:30:00'
        }

        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        sub = DepartmentSubmission.objects.filter(mou=self.mou).first()
        self.assertIsNotNone(sub)
        
        from django.utils.timezone import make_aware
        from datetime import datetime
        expected_dt = make_aware(datetime(2026, 7, 25, 10, 30, 0))
        self.assertEqual(sub.uploaded_at, expected_dt)
        self.assertEqual(sub.signed_file.created_at, expected_dt)

    def test_approve_department_submission(self):
        dept_folder = Folder.objects.create(name='Computer Science (Aided)', created_by=self.admin)
        share = MOUShare.objects.create(
            mou=self.mou,
            department=dept_folder,
            permission='Upload Only',
            status='Signed MOU Uploaded',
            shared_by=self.admin
        )
        dummy_file = File.objects.create(name='dummy.pdf', size=100, folder=dept_folder, uploaded_by=self.dept_user)
        
        submission = DepartmentSubmission.objects.create(
            mou=self.mou,
            department=dept_folder,
            signed_file=dummy_file,
            signed_date=date(2026, 7, 27),
            mou_month='July',
            mou_year=2026,
            summary='Linkage summary',
            purpose='Objective purpose',
            benefits=['Placements'],
            uploaded_by=self.dept_user,
            review_status='Pending Verification'
        )

        self.client.force_authenticate(user=self.admin)
        url = reverse('mou-submission-review', args=[submission.id])

        data = {
            'action': 'approve',
            'comments': 'All checks are compliant and clean.'
        }

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        submission.refresh_from_db()
        self.assertEqual(submission.review_status, 'Verified')
        self.assertEqual(submission.reviewer_comments, 'All checks are compliant and clean.')

        self.mou.refresh_from_db()
        self.assertEqual(self.mou.status, 'Active')
        self.assertEqual(self.mou.remarks, 'All checks are compliant and clean.')

        share.refresh_from_db()
        self.assertEqual(share.status, 'Completed')

class CustomTimeMiddlewareTests(APITestCase):
    def setUp(self):
        # Create Roles
        self.super_admin_role = Role.objects.create(name='Super Admin', description='Super admin role')
        self.admin_role = Role.objects.create(name='Admin', description='Admin role')
        self.normal_role = Role.objects.create(name='Normal User', description='Normal user role')

        self.admin = User.objects.create_user(
            email='admin@mcc.edu',
            password='password123',
            name='Admin User',
            role=self.admin_role
        )
        self.dept_user = User.objects.create_user(
            email='coord@mcc.edu',
            password='password123',
            name='Coordinator User',
            role=self.normal_role,
            department='Computer Science (Aided)'
        )

        # Create Folder
        self.folder = Folder.objects.create(
            name='Test Dept Folder',
            created_by=self.admin
        )

        # Create Active MOU
        self.mou = MOU.objects.create(
            title='Test Expiry MOU',
            mou_number='MOU/2026/EXP01',
            partner_organization='Test Org',
            duration_months=12,
            signed_date=date(2026, 1, 1),
            expiry_date=date(2027, 1, 1), # Expires on Jan 1st 2027
            department=self.folder,
            status='Active',
            coordinator_email='coord@mcc.edu',
            created_by=self.admin
        )

    def test_middleware_simulated_clock_overrides_date(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('mou-reports-stats')

        # Request with simulated clock header (e.g. 2026-12-15) - 17 days remaining
        # Expiry is 2027-01-01. If we set date to 2026-12-15 (17 days remaining),
        # days remaining is <= 30, so a 30-day reminder warning should be triggered.
        response = self.client.get(
            url, 
            HTTP_X_CUSTOM_TIME='2026-12-15T10:00:00Z'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that warning notifications for 30 days were generated
        from notifications.models import Notification
        
        # Admin notifications
        admin_notis = Notification.objects.filter(user=self.admin, metadata__mou_id=self.mou.id)
        self.assertTrue(admin_notis.exists())
        self.assertEqual(admin_notis.first().metadata.get('days_remaining'), 30)

        # Coordinator notifications
        coord_notis = Notification.objects.filter(user=self.dept_user, metadata__mou_id=self.mou.id)
        self.assertTrue(coord_notis.exists())
        self.assertEqual(coord_notis.first().metadata.get('days_remaining'), 30)

    def test_middleware_simulated_clock_triggers_expiry(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('mou-reports-stats')

        # Request with simulated date post expiry (e.g. 2027-01-02)
        response = self.client.get(
            url, 
            HTTP_X_CUSTOM_TIME='2027-01-02T12:00:00Z'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # MOU should be expired
        self.mou.refresh_from_db()
        self.assertEqual(self.mou.status, 'Expired')

        # Verification of notifications
        from notifications.models import Notification
        admin_expiry_noti = Notification.objects.filter(
            user=self.admin, 
            metadata__mou_id=self.mou.id,
            metadata__days_remaining=0
        )
        self.assertTrue(admin_expiry_noti.exists())


class MOUCategoryTests(APITestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(name='Admin', description='Admin role')
        self.admin = User.objects.create_user(
            email='admin@mcc.edu',
            password='password123',
            name='Admin User',
            role=self.admin_role
        )

    def test_create_category(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('mou-category-list')
        data = {
            'name': 'Google Cloud Research Labs',
            'code': 'GCP',
            'color': '#8B5CF6',
            'icon_type': 'company',
            'coordinator_name': 'Sundar Pichai',
            'coordinator_email': 'sundar@google.com',
            'category_type': 'Company'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Google Cloud Research Labs')
        self.assertEqual(response.data['code'], 'GCP')
        self.assertEqual(response.data['category_type'], 'Company')


