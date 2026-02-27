from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from cycles.models import CycleEntry
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with cycle data for a user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='seededuser',
            help='Username to seed cycles for (default: seededuser)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='seededpassword123',
            help='Password if the user needs to be created (default: seededpassword123)',
        )

    def handle(self, *args, **kwargs):
        username = kwargs['username']
        password = kwargs['password']

        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': f'{username}@example.com'}
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(f'Created user: {username}')
        else:
            self.stdout.write(f'User {username} already exists, skipping')

        today = date.today()
        cycle_length = 28
        period_duration = 5
        num_cycles = 6

        start = today - timedelta(days=cycle_length * num_cycles)

        cycles_created = 0
        for i in range(num_cycles):
            cycle_start = start + timedelta(days=cycle_length * i)
            cycle_end = cycle_start + timedelta(days=period_duration - 1)

            _, created = CycleEntry.objects.get_or_create(
                user=user,
                start_date=cycle_start,
                defaults={
                    'end_date': cycle_end,
                    'notes': f'Seeded cycle {i + 1}',
                }
            )
            if created:
                cycles_created += 1
                self.stdout.write(f'Added cycle: {cycle_start} → {cycle_end}')

        self.stdout.write(self.style.SUCCESS(
            f'Done! {cycles_created} cycle(s) seeded for {username}.'
        ))