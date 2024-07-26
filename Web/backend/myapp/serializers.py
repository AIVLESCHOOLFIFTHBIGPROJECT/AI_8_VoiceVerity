from rest_framework import serializers
from .models import Post, Comment, APIKey, YouTubeAnalysis

# 댓글(Comment) 시리얼라이저
class CommentSerializer(serializers.ModelSerializer):
    # author 관련 필드들을 읽기 전용으로 설정
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_is_staff = serializers.BooleanField(source='author.is_staff', read_only=True)

    class Meta:
        model = Comment
        # 포함할 필드들 정의
        fields = ['id', 'author', 'author_name', 'author_id', 'author_is_staff', 'content', 'created_at', 'updated_at', 'post', 'is_public']
        # 읽기 전용 필드 설정
        read_only_fields = ['author', 'post']

    # 댓글 생성 시 author와 post_id 자동 설정
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['author'] = request.user
        validated_data['post_id'] = self.context['post_id']
        return super().create(validated_data)

# 게시글(Post) 시리얼라이저
class PostSerializer(serializers.ModelSerializer):
    # author 관련 필드들을 읽기 전용으로 설정
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_is_staff = serializers.BooleanField(source='author.is_staff', read_only=True)
    # 댓글 시리얼라이저를 사용하여 댓글 리스트를 읽기 전용으로 설정
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        # 포함할 필드들 정의
        fields = ['id', 'title', 'author', 'author_name', 'author_id', 'author_is_staff', 'content', 'created_at', 'updated_at', 'is_notice', 'views', 'comments', 'is_public']
        # 읽기 전용 필드 설정
        read_only_fields = ['author']

    # 게시글 생성 시 author 자동 설정
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['author'] = request.user
        return super().create(validated_data)

# API 키(APIKey) 시리얼라이저
class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        # 포함할 필드들 정의
        fields = ['key', 'created_at', 'last_used_at', 'credits', 'is_active']

# 유튜브 분석(YouTubeAnalysis) 시리얼라이저
class YouTubeAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = YouTubeAnalysis
        # 포함할 필드들 정의
        fields = ['id', 'user', 'url', 'analysis_result', 'created_at']
        # 읽기 전용 필드 설정
        read_only_fields = ['user', 'created_at']

    # 유튜브 분석 생성 시 user 자동 설정
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)
