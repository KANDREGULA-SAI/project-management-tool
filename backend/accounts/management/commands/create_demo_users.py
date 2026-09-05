from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = "Create demo users for the deployed application"

    def handle(self, *args, **options):
        manager, created = User.objects.get_or_create(
            email="manager@example.com",
            defaults={"role": "MANAGER"},
        )

        if created:
            manager.set_password("manager123")
            manager.save()
            self.stdout.write("Manager user created.")
        else:
            self.stdout.write("Manager user already exists.")

        member, created = User.objects.get_or_create(
            email="member@example.com",
            defaults={"role": "MEMBER"},
        )

        if created:
            member.set_password("member123")
            member.save()
            self.stdout.write("Member user created.")
        else:
            self.stdout.write("Member user already exists.")

        self.stdout.write(self.style.SUCCESS("Demo users ready."))