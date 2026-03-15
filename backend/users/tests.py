from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class RegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/register/'
        self.valid_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'StrongPass123!',
            'cycle_length': 28,
            'period_length': 5,
            'last_period_start': str(date.today() - timedelta(days=3)),
        }

    def test_register_success(self):
        res = self.client.post(self.url, self.valid_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_register_creates_period_entry(self):
        self.client.post(self.url, self.valid_data)
        user = User.objects.get(email='test@example.com')
        from cycles.models import PeriodEntry
        self.assertEqual(PeriodEntry.objects.filter(user=user).count(), 1)
        entry = PeriodEntry.objects.get(user=user)
        self.assertEqual(str(entry.start_date), self.valid_data['last_period_start'])

    def test_register_duplicate_email(self):
        self.client.post(self.url, self.valid_data)
        res = self.client.post(self.url, self.valid_data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_period_length_exceeds_cycle_length(self):
        data = {**self.valid_data, 'period_length': 30, 'cycle_length': 28}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_period_length_equals_cycle_length(self):
        data = {**self.valid_data, 'period_length': 28, 'cycle_length': 28}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_cycle_length_too_short(self):
        data = {**self.valid_data, 'cycle_length': 10}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_cycle_length_too_long(self):
        data = {**self.valid_data, 'cycle_length': 100}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_period_length_zero(self):
        data = {**self.valid_data, 'period_length': 0}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_period_length_too_long(self):
        data = {**self.valid_data, 'period_length': 20}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_email(self):
        data = {**self.valid_data}
        del data['email']
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        data = {**self.valid_data, 'password': '123'}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/login/'
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='StrongPass123!',
        )

    def test_login_success(self):
        res = self.client.post(self.url, {'email': 'test@example.com', 'password': 'StrongPass123!'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_wrong_password(self):
        res = self.client.post(self.url, {'email': 'test@example.com', 'password': 'wrong'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_user(self):
        res = self.client.post(self.url, {'email': 'nobody@example.com', 'password': 'StrongPass123!'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/me/'
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='StrongPass123!',
            cycle_length=28,
            period_length=5,
        )
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], 'test@example.com')
        self.assertEqual(res.data['cycle_length'], 28)

    def test_update_profile(self):
        res = self.client.patch(self.url, {'username': 'newname', 'cycle_length': 30})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, 'newname')
        self.assertEqual(self.user.cycle_length, 30)

    def test_update_profile_period_exceeds_cycle(self):
        res = self.client.patch(self.url, {'period_length': 30})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_update_email(self):
        res = self.client.patch(self.url, {'email': 'new@example.com'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'test@example.com')

    def test_unauthenticated_access(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)