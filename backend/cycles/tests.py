from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from cycles.models import PeriodEntry, Symptom, SymptomEntry

User = get_user_model()


class PeriodEntryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/period-entries/'
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='StrongPass123!',
            cycle_length=28,
            period_length=5,
        )
        self.client.force_authenticate(user=self.user)

    def test_create_period_entry(self):
        data = {'start_date': str(date.today())}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PeriodEntry.objects.filter(user=self.user).count(), 1)

    def test_create_period_with_end_date(self):
        start = date.today() - timedelta(days=5)
        end = date.today() - timedelta(days=1)
        data = {'start_date': str(start), 'end_date': str(end)}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['period_days'], 5)

    def test_start_date_cannot_be_future(self):
        data = {'start_date': str(date.today() + timedelta(days=5))}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_end_date_cannot_be_before_start_date(self):
        start = date.today() - timedelta(days=2)
        end = date.today() - timedelta(days=5)
        data = {'start_date': str(start), 'end_date': str(end)}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_overlapping_periods_rejected(self):
        start = date.today() - timedelta(days=3)
        PeriodEntry.objects.create(user=self.user, start_date=start)
        # Try to create another period within the existing period window
        data = {'start_date': str(date.today() - timedelta(days=1))}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_overlapping_periods_allowed(self):
        old_start = date.today() - timedelta(days=20)
        old_end = date.today() - timedelta(days=16)
        PeriodEntry.objects.create(user=self.user, start_date=old_start, end_date=old_end)
        data = {'start_date': str(date.today())}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_list_period_entries(self):
        PeriodEntry.objects.create(user=self.user, start_date=date.today() - timedelta(days=30))
        PeriodEntry.objects.create(user=self.user, start_date=date.today() - timedelta(days=2))
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_update_period_end_date(self):
        entry = PeriodEntry.objects.create(user=self.user, start_date=date.today() - timedelta(days=3))
        res = self.client.patch(f'{self.url}{entry.id}/', {'end_date': str(date.today())})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        entry.refresh_from_db()
        self.assertEqual(entry.end_date, date.today())

    def test_delete_period_entry(self):
        entry = PeriodEntry.objects.create(user=self.user, start_date=date.today() - timedelta(days=3))
        res = self.client.delete(f'{self.url}{entry.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        # Soft delete — should be excluded from default queryset
        self.assertEqual(PeriodEntry.objects.filter(user=self.user).count(), 0)

    def test_cannot_see_other_users_entries(self):
        other_user = User.objects.create_user(
            email='other@example.com', username='other', password='StrongPass123!',
        )
        PeriodEntry.objects.create(user=other_user, start_date=date.today() - timedelta(days=3))
        res = self.client.get(self.url)
        self.assertEqual(len(res.data), 0)

    def test_unauthenticated_access(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_period_days_property(self):
        entry = PeriodEntry.objects.create(
            user=self.user,
            start_date=date.today() - timedelta(days=4),
            end_date=date.today(),
        )
        self.assertEqual(entry.period_days, 5)

    def test_period_days_none_without_end_date(self):
        entry = PeriodEntry.objects.create(user=self.user, start_date=date.today())
        self.assertIsNone(entry.period_days)


class SymptomEntryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/symptom-entries/'
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='StrongPass123!',
        )
        self.client.force_authenticate(user=self.user)
        self.symptom = Symptom.objects.create(name='Cramps', category='physical')

    def test_create_symptom_entry(self):
        data = {'symptom': self.symptom.id, 'date': str(date.today()), 'severity': 2}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_cannot_log_future_symptom(self):
        data = {'symptom': self.symptom.id, 'date': str(date.today() + timedelta(days=1)), 'severity': 1}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_symptom_entries(self):
        SymptomEntry.objects.create(user=self.user, symptom=self.symptom, date=date.today(), severity=1)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_cannot_see_other_users_symptom_entries(self):
        other_user = User.objects.create_user(
            email='other@example.com', username='other', password='StrongPass123!',
        )
        SymptomEntry.objects.create(user=other_user, symptom=self.symptom, date=date.today(), severity=1)
        res = self.client.get(self.url)
        self.assertEqual(len(res.data), 0)


class SymptomListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/symptoms/'
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='StrongPass123!',
        )
        self.client.force_authenticate(user=self.user)
        Symptom.objects.create(name='Cramps', category='physical')
        Symptom.objects.create(name='Bloating', category='digestive')

    def test_list_symptoms(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_symptoms_read_only(self):
        res = self.client.post(self.url, {'name': 'New', 'category': 'other'})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)