from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('files', '0006_fileownership_created_at_fileownership_shared_by_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='FileOwnership',
        ),
        migrations.DeleteModel(
            name='FilePermission',
        ),
    ]
