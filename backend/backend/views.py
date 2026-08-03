from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q
from permissions.custom_permissions import HasDynamicPermission
from folders.models import Folder
from files.models import File
from notifications.models import Notification
from activity_logs.models import ActivityLog
from folders.serializers import FolderSerializer
from files.serializers import FileSerializer
from users.serializers import CustomUserSerializer
from activity_logs.serializers import ActivityLogSerializer
from notifications.serializers import NotificationSerializer
from mous.models import MOU
import datetime


User = get_user_model()

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, HasDynamicPermission]
    required_permission = 'view_dashboard'

    def get(self, request):
        user = request.user
        role_name = user.role.name if user.role else 'User'

        # User counts
        if role_name == "Super Admin":
            total_users = User.objects.count()
            active_users = User.objects.filter(status='Active').count()
        elif role_name == "Admin":
            total_users = User.objects.exclude(role__name="Super Admin").count()
            active_users = User.objects.exclude(role__name="Super Admin").filter(status='Active').count()
        else:
            total_users = 0
            active_users = 0

        # Folder, File and MOU counts / querysets
        if role_name == "Super Admin":
            mous_qs = MOU.objects.all()
            folders_qs = Folder.objects.all()
            files_qs = File.objects.all()
        elif role_name == "Admin":
            mous_qs = MOU.objects.filter(created_by=user)
            folders_qs = Folder.objects.filter(Q(created_by=user) | Q(mous__in=mous_qs)).distinct()
            files_qs = File.objects.filter(Q(uploaded_by=user) | Q(folder__in=folders_qs)).distinct()
        else:
            # Standard User
            all_folders = Folder.objects.all()
            accessible_ids = [f.id for f in all_folders if f.has_access(user)]
            folders_qs = Folder.objects.filter(id__in=accessible_ids)
            files_qs = File.objects.filter(folder_id__in=accessible_ids)
            mous_qs = MOU.objects.filter(department__in=folders_qs).distinct()

        total_folders = folders_qs.count()
        total_files = files_qs.count()

        # User specific metrics
        my_files_qs = File.objects.filter(uploaded_by=user)
        my_files_count = my_files_qs.count()
        my_recent_files = my_files_qs.order_by('-created_at')[:5]
        my_recent_files_serializer = FileSerializer(my_recent_files, many=True, context={'request': request})

        # Recent uploads (general / accessible)
        recent_files = files_qs.order_by('-created_at')[:5]
        recent_files_serializer = FileSerializer(recent_files, many=True, context={'request': request})

        # Recent activities (Admins & Super Admins)
        activities_data = []
        is_admin = role_name in ["Super Admin", "Admin"]
        if is_admin:
            recent_activities = ActivityLog.objects.all().order_by('-created_at')[:6]
            recent_activities_serializer = ActivityLogSerializer(recent_activities, many=True)
            activities_data = recent_activities_serializer.data

        # Latest notifications
        latest_notifications = Notification.objects.filter(user=user, is_read=False).order_by('-created_at')[:5]
        notifications_serializer = NotificationSerializer(latest_notifications, many=True)

        # --- Real System Storage Stats ---
        import shutil
        from django.conf import settings
        from django.db.models import Sum
        from users.models import GoogleDriveSetting

        media_root = getattr(settings, 'MEDIA_ROOT', '')
        disk_total = 0
        disk_used = 0
        disk_free = 0
        storage_type = "local"
        drive_connected = False

        drive_setting = GoogleDriveSetting.objects.filter(is_active=True).first()
        if drive_setting and drive_setting.connection_status == 'Connected':
            disk_total = drive_setting.storage_limit or 0
            disk_used = drive_setting.storage_usage or 0
            disk_free = (disk_total - disk_used) if disk_total >= disk_used else 0
            storage_type = "google_drive"
            drive_connected = True
        else:
            try:
                usage = shutil.disk_usage(media_root if media_root else '.')
                disk_total = usage.total
                disk_used = usage.used
                disk_free = usage.free
            except Exception:
                pass

        # Per file-type breakdown from DB (in bytes)
        def bytes_for_types(qs, types):
            result = qs.filter(file_type__in=types).aggregate(total=Sum('size'))
            return result['total'] or 0

        pdf_types = ['application/pdf', 'pdf']
        image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'jpg', 'jpeg', 'png', 'gif', 'webp']
        doc_types = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'doc', 'docx']
        xls_types = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xls', 'xlsx']
        ppt_types = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'ppt', 'pptx']
        video_types = ['video/mp4', 'video/avi', 'video/mov', 'mp4', 'avi', 'mov']
        audio_types = ['audio/mpeg', 'audio/wav', 'mp3', 'wav']

        pdf_size = bytes_for_types(files_qs, pdf_types)
        image_size = bytes_for_types(files_qs, image_types)
        doc_size = bytes_for_types(files_qs, doc_types)
        xls_size = bytes_for_types(files_qs, xls_types)
        ppt_size = bytes_for_types(files_qs, ppt_types)
        video_size = bytes_for_types(files_qs, video_types)
        audio_size = bytes_for_types(files_qs, audio_types)
        total_db_size = files_qs.aggregate(total=Sum('size'))['total'] or 0

        # Recent folders
        recent_folders = folders_qs.order_by('-created_at')[:4]
        recent_folders_serializer = FolderSerializer(recent_folders, many=True)

        # Real MOU stats from database
        from django.db.models import Count
        active_mous = mous_qs.filter(status='Active').count()
        pending_approval = mous_qs.filter(status='Pending Verification').count()
        
        today = datetime.date.today()
        expiring_30 = mous_qs.filter(
            status='Active', 
            expiry_date__lte=today + datetime.timedelta(days=30), 
            expiry_date__gte=today
        ).count()

        # Real Department/Folder distribution
        mou_depts = mous_qs.values('department_name').annotate(value=Count('id')).order_by('-value')
        dept_colors = {
            'Engineering': '#3B82F6',
            'Medical': '#14B8A6',
            'Commerce': '#F59E0B',
            'Arts': '#EC4899',
        }
        
        mou_distribution_data = []
        for item in mou_depts:
            name = item['department_name'] or 'General'
            mou_distribution_data.append({
                'name': name,
                'value': item['value'],
                'color': dept_colors.get(name, '#8B5CF6')
            })

        # Fallback if no MOUs exist
        if not mou_distribution_data:
            for folder in folders_qs.filter(parent=None):
                file_count = files_qs.filter(folder=folder).count()
                mou_distribution_data.append({
                    'name': folder.name,
                    'value': file_count if file_count > 0 else 1,
                    'color': dept_colors.get(folder.name, '#8B5CF6')
                })

        # Trend Data (Last 6 Months)
        trend_months = []
        for i in range(5, -1, -1):
            m = today.month - i
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            month_date = datetime.date(y, m, 1)
            month_name = month_date.strftime('%b')
            trend_months.append({
                'month_date': month_date,
                'month': month_name,
                'year': y,
                'Active': 0,
                'Pending': 0,
                'Expiring': 0
            })
            
        for month_bucket in trend_months:
            start_date = month_bucket['month_date']
            next_m = start_date.month + 1
            next_y = start_date.year
            if next_m > 12:
                next_m = 1
                next_y += 1
            end_date = datetime.date(next_y, next_m, 1)
            
            month_bucket['Active'] = mous_qs.filter(
                status='Active',
                created_at__gte=datetime.datetime.combine(start_date, datetime.time.min),
                created_at__lt=datetime.datetime.combine(end_date, datetime.time.min)
            ).count()
            
            month_bucket['Pending'] = mous_qs.filter(
                status='Pending Verification',
                created_at__gte=datetime.datetime.combine(start_date, datetime.time.min),
                created_at__lt=datetime.datetime.combine(end_date, datetime.time.min)
            ).count()
            
            month_bucket['Expiring'] = mous_qs.filter(
                status='Active',
                expiry_date__gte=start_date,
                expiry_date__lt=end_date
            ).count()
            
        for mb in trend_months:
            mb.pop('month_date')

        return Response({
            "total_users": total_users,
            "active_users": active_users,
            "total_folders": total_folders,
            "total_files": total_files,
            "my_files_count": my_files_count,
            "active_mous": active_mous,
            "pending_approval": pending_approval,
            "expiring_30_days": expiring_30,
            "distribution_data": mou_distribution_data,
            "trend_data": trend_months,
            "recent_uploads": recent_files_serializer.data,
            "my_recent_uploads": my_recent_files_serializer.data,
            "recent_folders": recent_folders_serializer.data,
            "recent_activities": activities_data,
            "latest_notifications": notifications_serializer.data,
            "storage": {
                "storage_type": storage_type,
                "drive_connected": drive_connected,
                "disk_total_bytes": disk_total,
                "disk_used_bytes": disk_used,
                "disk_free_bytes": disk_free,
                "breakdown": {
                    "pdf": pdf_size,
                    "image": image_size,
                    "doc": doc_size,
                    "xls": xls_size,
                    "ppt": ppt_size,
                    "video": video_size,
                    "audio": audio_size,
                    "total": total_db_size
                }
            }
        })


class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({"folders": [], "files": [], "users": []})

        user = request.user
        is_admin = user.role and user.role.name in ["Super Admin", "Admin"]

        # Search folders user has access to
        if user.role and user.role.name == "Super Admin":
            folders = Folder.objects.filter(name__icontains=query)
        else:
            all_folders = Folder.objects.filter(name__icontains=query)
            folders = [f for f in all_folders if f.has_access(user)]

        # Search files user has access to
        if user.role and user.role.name == "Super Admin":
            files = File.objects.filter(name__icontains=query)
        else:
            all_folders = Folder.objects.all()
            accessible_ids = [f.id for f in all_folders if f.has_access(user)]
            files = File.objects.filter(folder_id__in=accessible_ids, name__icontains=query)

        # Search users (Admins only)
        users = []
        if is_admin:
            users = User.objects.filter(
                Q(name__icontains=query) | 
                Q(email__icontains=query) |
                Q(department__icontains=query)
            )

        return Response({
            "folders": FolderSerializer(folders[:20], many=True).data,
            "files": FileSerializer(files[:20], many=True, context={'request': request}).data,
            "users": CustomUserSerializer(users[:20], many=True).data if is_admin else []
        })
