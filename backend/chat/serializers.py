from rest_framework import serializers


class AskQuestionSerializer(serializers.Serializer):
    document_id = serializers.IntegerField()
    question = serializers.CharField(max_length=2000)
    level = serializers.CharField(default="INTERMEDIAIRE", required=False)