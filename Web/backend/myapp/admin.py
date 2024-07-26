from django.contrib import admin
from .models import CustomUser, SubscriptionPlan, UserSubscription, PaymentHistory, APIKey, AudioFile, UploadHistory, Payment, Post, Comment, ApiCallHistory, YouTubeAnalysis

# CustomUser 모델 관리자
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('username', 'email', 'nickname', 'company', 'contact', 'sms_marketing', 'email_marketing', 'free_credits')
    # 검색 가능 필드
    search_fields = ('email', 'username', 'nickname', 'company', 'contact')
    # 필터 가능 필드
    list_filter = ('sms_marketing', 'email_marketing')

# SubscriptionPlan 모델 관리자
@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('name', 'price', 'api_calls_per_day', 'credits', 'is_recurring')
    # 검색 가능 필드
    search_fields = ('name',)
    # 필터 가능 필드
    list_filter = ('is_recurring',)

# UserSubscription 모델 관리자
@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('user', 'plan', 'start_date', 'end_date', 'daily_credits', 'total_credits', 'is_active')
    # 검색 가능 필드
    search_fields = ('user__username', 'plan__name')
    # 필터 가능 필드
    list_filter = ('is_active', 'start_date')

# PaymentHistory 모델 관리자
@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('user', 'plan', 'amount', 'payment_date', 'is_successful')
    # 검색 가능 필드
    search_fields = ('user__username', 'plan__name')
    # 필터 가능 필드
    list_filter = ('is_successful', 'payment_date')

# APIKey 모델 관리자
@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('user', 'key', 'created_at', 'last_used_at', 'is_active')
    # 검색 가능 필드
    search_fields = ('user__username', 'key')
    # 필터 가능 필드
    list_filter = ('created_at', 'last_used_at')

# AudioFile 모델 관리자
@admin.register(AudioFile)
class AudioFileAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('user', 'file_name', 'file_path', 'analysis_result', 'uploaded_at')
    # 검색 가능 필드
    search_fields = ('user__username', 'file_name')
    # 필터 가능 필드
    list_filter = ('uploaded_at',)

# UploadHistory 모델 관리자
@admin.register(UploadHistory)
class UploadHistoryAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('user', 'upload_date', 'upload_count', 'youtube_upload_count')
    # 검색 가능 필드
    search_fields = ('user__username',)
    # 필터 가능 필드
    list_filter = ('upload_date',)

# Payment 모델 관리자
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('user', 'plan', 'tid', 'status', 'amount', 'created_at', 'updated_at')
    # 검색 가능 필드
    search_fields = ('user__username', 'tid')
    # 필터 가능 필드
    list_filter = ('status', 'created_at', 'updated_at')

# Post 모델 관리자
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('title', 'author', 'created_at', 'updated_at', 'is_notice', 'views', 'is_public')
    # 검색 가능 필드
    search_fields = ('title', 'author__username')
    # 필터 가능 필드
    list_filter = ('created_at', 'updated_at', 'is_notice', 'is_public')

# Comment 모델 관리자
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('post', 'author', 'created_at', 'updated_at', 'is_public')
    # 검색 가능 필드
    search_fields = ('post__title', 'author__username', 'content')
    # 필터 가능 필드
    list_filter = ('created_at', 'updated_at', 'is_public')

# ApiCallHistory 모델 관리자
@admin.register(ApiCallHistory)
class ApiCallHistoryAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('user', 'api_key', 'endpoint', 'timestamp', 'success', 'response_time', 'file_path', 'youtube_url')
    # 검색 가능 필드
    search_fields = ('user__username', 'api_key', 'endpoint')
    # 필터 가능 필드
    list_filter = ('timestamp', 'success')

# YouTubeAnalysis 모델 관리자
@admin.register(YouTubeAnalysis)
class YouTubeAnalysisAdmin(admin.ModelAdmin):
    # 관리자 화면에 표시할 필드들
    list_display = ('user', 'url', 'analysis_result', 'created_at')
    # 검색 가능 필드
    search_fields = ('user__username', 'url', 'analysis_result')
    # 필터 가능 필드
    list_filter = ('created_at',)
