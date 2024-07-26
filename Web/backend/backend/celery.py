# backend/celery.py

from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

# Django 설정 모듈을 기본값으로 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Celery 앱을 초기화하고 이름을 'backend'로 설정
app = Celery('backend')

# Django 설정으로부터 구성 로드 (CELERY로 시작하는 설정들을 가져옴)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Django 앱들에서 task를 자동으로 검색
app.autodiscover_tasks()

# 주기적인 작업 스케줄 설정
app.conf.beat_schedule = {
    # 매일 자정에 reset_daily_credits 작업 실행
    'reset-daily-credits-every-day': {
        'task': 'myapp.tasks.reset_daily_credits',
        'schedule': crontab(hour=0, minute=0),
    },
    # 매일 자정에 expire_general_credits 작업 실행
    'expire-general-credits-every-day': {
        'task': 'myapp.tasks.expire_general_credits',
        'schedule': crontab(hour=0, minute=0),
    },
    # 매일 자정에 reset_free_credits 작업 실행
    'reset-free-credits-every-day': {
        'task': 'myapp.tasks.reset_free_credits',
        'schedule': crontab(hour=0, minute=0),
    },
    # 매일 자정에 reset_upload_counts 작업 실행
    'reset-upload-counts-every-day': {
        'task': 'myapp.tasks.reset_upload_counts',
        'schedule': crontab(hour=0, minute=0),
    },
}

# 디버그용 작업 정의
@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

# Celery 앱을 'celery' 변수로 노출
celery = app 
