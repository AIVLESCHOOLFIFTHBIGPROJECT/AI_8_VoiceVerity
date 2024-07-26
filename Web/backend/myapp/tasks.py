# myapp/tasks.py

from celery import shared_task
from django.utils import timezone
from datetime import datetime, date
from myapp.models import CustomUser, UserSubscription, UploadHistory

@shared_task
def reset_daily_credits():
    # 오늘 날짜 가져오기
    today = timezone.now().date()
    # 활성화된 구독 가져오기
    subscriptions = UserSubscription.objects.filter(is_active=True)

    # 구독이 반복되면 매일 API 호출 제한을 리셋
    for subscription in subscriptions:
        if subscription.plan.is_recurring:
            subscription.daily_credits = subscription.plan.api_calls_per_day
            subscription.save()

    return f'Daily credits reset for {subscriptions.count()} subscriptions.'

@shared_task
def expire_general_credits():
    # 오늘 날짜 가져오기
    today = timezone.now().date()
    # 반복되지 않는 활성화된 구독 가져오기
    subscriptions = UserSubscription.objects.filter(plan__is_recurring=False, is_active=True)

    for subscription in subscriptions:
        if subscription.end_date:
            # subscription.end_date가 datetime일 경우 date로 변환
            if isinstance(subscription.end_date, datetime):
                subscription_end_date = subscription.end_date.date()
            else:
                subscription_end_date = subscription.end_date
            
            # 구독 종료일이 오늘 날짜와 같거나 이전이면 비활성화
            if subscription_end_date <= today:
                subscription.is_active = False
                subscription.save()

    return f'Expired general credits for {subscriptions.count()} subscriptions.'

@shared_task
def reset_free_credits():
    # 모든 사용자 가져오기
    users = CustomUser.objects.all()

    # 각 사용자에게 무료 크레딧을 5로 리셋
    for user in users:
        user.free_credits = 5
        user.save()

    return f'Free credits reset for {users.count()} users.'

@shared_task
def reset_upload_counts():
    # 오늘 날짜 가져오기
    today = timezone.now().date()
    # 오늘 업로드된 기록 가져오기
    upload_histories = UploadHistory.objects.filter(upload_date=today)

    # 각 기록의 업로드 카운트와 유튜브 업로드 카운트를 0으로 리셋
    for history in upload_histories:
        history.upload_count = 0
        history.youtube_upload_count = 0
        history.save()

    return f'Upload counts reset for {upload_histories.count()} histories.'
