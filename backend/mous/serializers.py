from rest_framework import serializers
from .models import MOUTemplate, MOU, MOUDocument, MOURenewal
from files.serializers import FileSerializer
from folders.serializers import FolderSerializer
from users.serializers import CustomUserSerializer

class MOUTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    mou_count = serializers.IntegerField(source='mous.count', read_only=True)

    class Meta:
        model = MOUTemplate
        fields = [
            'id', 'name', 'description', 'template_notes', 
            'fields_schema', 'created_by', 'created_by_name', 
            'is_active', 'mou_count', 'created_at', 'updated_at'
        ]

class MOUDocumentSerializer(serializers.ModelSerializer):
    file_details = FileSerializer(source='file', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)

    class Meta:
        model = MOUDocument
        fields = ['id', 'mou', 'document_type', 'file', 'file_details', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']

class MOUSerializer(serializers.ModelSerializer):
    mou_type_name = serializers.CharField(source='mou_type.name', read_only=True)
    department_folder_name = serializers.CharField(source='department.name', read_only=True)
    created_by_details = CustomUserSerializer(source='created_by', read_only=True)
    original_mou_details = FileSerializer(source='original_mou', read_only=True)
    signed_mou_details = FileSerializer(source='signed_mou', read_only=True)
    days_left = serializers.SerializerMethodField()
    documents = MOUDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = MOU
        fields = '__all__'

    def get_days_left(self, obj):
        return obj.days_remaining()
