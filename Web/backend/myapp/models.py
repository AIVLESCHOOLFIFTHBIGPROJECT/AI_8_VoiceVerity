from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.conf import settings

# CustomUser 모델: 사용자 정보를 확장하여 커스터마이징
class CustomUser(AbstractUser):
    username = models.CharField(max_length=150, unique=False)
    email = models.EmailField(unique=True)
    company = models.CharField(max_length=100, blank=True)
    contact = models.CharField(max_length=15, blank=True)
    nickname = models.CharField(max_length=50, blank=True)
    consent_personal_info = models.BooleanField(default=False)
    consent_service_terms = models.BooleanField(default=False)
    consent_voice_data = models.BooleanField(default=False)
    sms_marketing = models.BooleanField(default=False)
    email_marketing = models.BooleanField(default=False)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    free_credits = models.IntegerField(default=5)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
# 구독 플랜 모델: 다양한 구독 플랜 정보를 저장
class SubscriptionPlan(models.Model):
    PLAN_CHOICES = [
        ('Pay As You Go', 'Pay As You Go'),
        ('BASIC', 'Basic'),
        ('ASSOCIATE', 'Associate'),
        ('PROFESSIONAL', 'Professional'),
    ]
    name = models.CharField(max_length=20, choices=PLAN_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    api_calls_per_day = models.IntegerField(null=True, blank=True)
    credits = models.IntegerField(null=True, blank=True)
    is_recurring = models.BooleanField(default=False)
    description = models.TextField(default="")

    def __str__(self):
        return self.name

# 사용자 구독 모델: 사용자의 구독 상태를 저장
class UserSubscription(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    daily_credits = models.IntegerField(default=0)
    total_credits = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    # 비반복 구독일 경우, 종료 날짜를 90일 후로 설정
    def save(self, *args, **kwargs):
        if not self.end_date and not self.plan.is_recurring:
            self.end_date = timezone.now() + timezone.timedelta(days=90)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"

# 결제 기록 모델: 사용자의 결제 기록을 저장
class PaymentHistory(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    is_successful = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} - {self.amount}"
    
# 결제 모델: 결제 정보를 저장
class Payment(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    tid = models.CharField(max_length=100, unique=True)
    partner_order_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='initiated')
    approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user} - {self.plan} - {self.tid}"

# API 키 모델: API 키 정보를 저장
class APIKey(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    key = models.CharField(max_length=32, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.key

# 오디오 파일 모델: 업로드된 오디오 파일 정보를 저장
class AudioFile(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=1024)
    file_size = models.PositiveIntegerField()
    file_extension = models.CharField(max_length=10)
    analysis_result = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name

# 유튜브 분석 모델: 유튜브 분석 결과를 저장
class YouTubeAnalysis(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    url = models.URLField()
    analysis_result = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.url} - {self.analysis_result}"

# 업로드 기록 모델: 사용자의 업로드 기록을 저장
class UploadHistory(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    upload_date = models.DateField()
    upload_count = models.IntegerField(default=0)
    youtube_upload_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'upload_date')

    def __str__(self):
        return f"{self.user.email} - {self.upload_date}: {self.upload_count} uploads"

# 게시글 모델: 게시글 정보를 저장
class Post(models.Model):
    title = models.CharField(max_length=255)
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_notice = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    views = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title

# 댓글 모델: 게시글에 달린 댓글 정보를 저장
class Comment(models.Model):
    post = models.ForeignKey(Post, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return self.content

# API 호출 기록 모델: API 호출 내역을 저장
class ApiCallHistory(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    api_key = models.CharField(max_length=32)
    endpoint = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=True)  # API 호출 성공 여부
    response_time = models.FloatField(null=True, blank=True)  # 응답 시간 (밀리초 단위)
    file_path = models.CharField(max_length=1024, null=True, blank=True)
    youtube_url = models.URLField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.endpoint} - {self.timestamp}"
