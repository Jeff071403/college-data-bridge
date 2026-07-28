from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_remove_customuser_created_by_alter_userrole_table'),
    ]

    operations = [
        migrations.DeleteModel(
            name='UserRole',
        ),
    ]
