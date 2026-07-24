from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from datetime import date, timedelta

from .models import MOUTemplate, MOU, MOUDocument, MOURenewal
from .serializers import MOUTemplateSerializer, MOUSerializer, MOUDocumentSerializer
from activity_logs.models import ActivityLog
from notifications.models import Notification
from files.models import File
from folders.models import Folder

def log_activity(user, action, module="MOUs", ip_address=None):
    ActivityLog.objects.create(
        user=user,
        action=action,
        module=module,
        ip_address=ip_address or "127.0.0.1"
    )

def send_notification(user, title, description):
    Notification.objects.create(
        user=user,
        title=title,
        description=description
    )

class MOUTemplateListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = MOUTemplate.objects.all().order_by('-created_at')
    serializer_class = MOUTemplateSerializer

    def perform_create(self, serializer):
        tmpl = serializer.save(created_by=self.request.user)
        log_activity(self.request.user, f"Created MOU Template '{tmpl.name}'", module="Templates")

class MOUTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = MOUTemplate.objects.all()
    serializer_class = MOUTemplateSerializer

class MOUListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = MOU.objects.all().order_by('-created_at')

        # Role filtering
        is_admin = user.role and user.role.name in ["Super Admin", "Admin", "Lawyer / MOU Administrator"]
        if not is_admin:
            # Department users see MOUs in accessible folders or created by them
            all_folders = Folder.objects.all()
            accessible_ids = [f.id for f in all_folders if f.has_access(user)]
            qs = qs.filter(Q(department_id__in=accessible_ids) | Q(created_by=user))

        # Query Filters
        status_filter = request.query_params.get('status')
        type_filter = request.query_params.get('type')
        dept_filter = request.query_params.get('department')
        search_query = request.query_params.get('q', '').strip()

        if status_filter:
            qs = qs.filter(status__iexact=status_filter)
        if type_filter:
            qs = qs.filter(mou_type_id=type_filter)
        if dept_filter:
            qs = qs.filter(department_id=dept_filter)
        if search_query:
            qs = qs.filter(
                Q(title__icontains=search_query) |
                Q(mou_number__icontains=search_query) |
                Q(partner_organization__icontains=search_query) |
                Q(coordinator_name__icontains=search_query) |
                Q(summary__icontains=search_query)
            )

        serializer = MOUSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        user = request.user
        
        # Auto-generate MOU number if not provided
        if not data.get('mou_number'):
            count = MOU.objects.count() + 1
            data['mou_number'] = f"MOU-{date.today().year}-{count:04d}"

        serializer = MOUSerializer(data=data)
        if serializer.is_valid():
            mou = serializer.save(created_by=user)
            
            # Link original document if file_id provided
            original_file_id = request.data.get('original_mou_id')
            if original_file_id:
                try:
                    f = File.objects.get(id=original_file_id)
                    mou.original_mou = f
                    mou.save()
                    MOUDocument.objects.create(mou=mou, document_type='original', file=f, uploaded_by=user)
                except File.DoesNotExist:
                    pass

            log_activity(user, f"Created MOU record '{mou.title}' ({mou.mou_number})")
            send_notification(user, f"MOU Created: {mou.title}", f"MOU {mou.mou_number} is currently in {mou.status} status.")
            
            return Response(MOUSerializer(mou, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MOUDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return MOU.objects.get(pk=pk)
        except MOU.DoesNotExist:
            return None

    def get(self, request, pk):
        mou = self.get_object(pk)
        if not mou:
            return Response({"detail": "MOU not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MOUSerializer(mou, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        mou = self.get_object(pk)
        if not mou:
            return Response({"detail": "MOU not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = MOUSerializer(mou, data=request.data, partial=True)
        if serializer.is_valid():
            updated_mou = serializer.save()
            log_activity(request.user, f"Updated MOU details for '{updated_mou.title}'")
            return Response(MOUSerializer(updated_mou, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        mou = self.get_object(pk)
        if not mou:
            return Response({"detail": "MOU not found."}, status=status.HTTP_404_NOT_FOUND)
        mou.delete()
        log_activity(request.user, f"Deleted MOU record #{pk}")
        return Response({"detail": "MOU deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

class MOUSubmitSignedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            mou = MOU.objects.get(pk=pk)
        except MOU.DoesNotExist:
            return Response({"detail": "MOU not found."}, status=status.HTTP_404_NOT_FOUND)

        signed_date_str = request.data.get('signed_date')
        signed_file_id = request.data.get('signed_mou_id')
        duration = request.data.get('duration_months')

        if signed_date_str:
            try:
                mou.signed_date = date.fromisoformat(signed_date_str)
            except ValueError:
                pass
        else:
            mou.signed_date = date.today()

        if duration:
            mou.duration_months = int(duration)

        # Calculate Expiry
        mou.expiry_date = mou.calculate_expiry(mou.signed_date, mou.duration_months)

        if signed_file_id:
            try:
                f = File.objects.get(id=signed_file_id)
                mou.signed_mou = f
                MOUDocument.objects.create(mou=mou, document_type='signed', file=f, uploaded_by=request.user)
            except File.DoesNotExist:
                pass

        mou.status = 'Pending Verification'
        mou.save()

        log_activity(request.user, f"Submitted signed MOU for '{mou.title}'. Expiry date: {mou.expiry_date}")
        send_notification(request.user, f"Signed MOU Uploaded: {mou.title}", f"Status is now Pending Verification. Expiry date calculated as {mou.expiry_date}.")

        return Response(MOUSerializer(mou, context={'request': request}).data)

class MOUApproveRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            mou = MOU.objects.get(pk=pk)
        except MOU.DoesNotExist:
            return Response({"detail": "MOU not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action') # 'approve' or 'reject'
        remarks = request.data.get('remarks', '')

        if action == 'approve':
            mou.status = 'Active'
            mou.remarks = remarks
            mou.save()
            log_activity(request.user, f"Approved MOU '{mou.title}' → Active")
            send_notification(request.user, f"MOU Approved!", f"MOU '{mou.title}' is now Active.")
        elif action == 'reject':
            mou.status = 'Draft'
            mou.remarks = remarks
            mou.save()
            log_activity(request.user, f"Rejected MOU '{mou.title}'. Remarks: {remarks}")
            send_notification(request.user, f"MOU Rejection Notice", f"MOU '{mou.title}' requires changes. Remarks: {remarks}")
        else:
            return Response({"detail": "Invalid action. Use 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(MOUSerializer(mou, context={'request': request}).data)

class MOURenewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            original = MOU.objects.get(pk=pk)
        except MOU.DoesNotExist:
            return Response({"detail": "MOU not found."}, status=status.HTTP_404_NOT_FOUND)

        # Clone MOU record as a new renewal version
        new_count = MOU.objects.count() + 1
        renewed_mou = MOU.objects.create(
            title=f"{original.title} (Renewed)",
            mou_number=f"MOU-{date.today().year}-{new_count:04d}",
            mou_type=original.mou_type,
            partner_organization=original.partner_organization,
            department=original.department,
            department_name=original.department_name,
            created_by=request.user,
            original_mou=original.signed_mou or original.original_mou,
            duration_months=original.duration_months,
            status='Draft',
            summary=original.summary,
            purpose=original.purpose,
            objectives=original.objectives,
            beneficiaries=original.beneficiaries,
            opportunities=original.opportunities,
            coordinator_name=original.coordinator_name,
            coordinator_designation=original.coordinator_designation,
            coordinator_email=original.coordinator_email,
            coordinator_phone=original.coordinator_phone,
            partner_name=original.partner_name,
            partner_designation=original.partner_designation,
            partner_email=original.partner_email,
            partner_phone=original.partner_phone,
            version_number=original.version_number + 1,
            renewed_from=original
        )

        original.is_renewed = True
        original.status = 'Renewed'
        original.save()

        MOURenewal.objects.create(
            original_mou=original,
            renewed_mou=renewed_mou,
            renewed_by=request.user,
            notes=request.data.get('notes', 'One-click renewal initiated.')
        )

        log_activity(request.user, f"Initiated One-Click Renewal for MOU #{original.id} → New Draft #{renewed_mou.id}")
        send_notification(request.user, f"Renewal Created", f"New renewal draft {renewed_mou.mou_number} created from previous agreement.")

        return Response(MOUSerializer(renewed_mou, context={'request': request}).data, status=status.HTTP_201_CREATED)

class MOUReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mous = MOU.objects.all()

        # Status counts
        status_counts = {}
        for choice, _ in MOU.STATUS_CHOICES:
            status_counts[choice] = mous.filter(status=choice).count()

        # Department counts
        dept_counts = list(mous.values('department_name').annotate(total=Count('id')))

        # Expiry buckets
        today = date.today()
        expiring_30 = mous.filter(status='Active', expiry_date__lte=today + timedelta(days=30), expiry_date__gte=today).count()
        expiring_7 = mous.filter(status='Active', expiry_date__lte=today + timedelta(days=7), expiry_date__gte=today).count()
        expired_count = mous.filter(status='Expired').count()

        return Response({
            "total_mous": mous.count(),
            "status_breakdown": status_counts,
            "department_breakdown": dept_counts,
            "expiring_30_days": expiring_30,
            "expiring_7_days": expiring_7,
            "expired_total": expired_count,
        })
