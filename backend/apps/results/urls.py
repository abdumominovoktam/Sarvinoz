from django.urls import path
from .views import MyResultsAndProfileView, ResultComparisonView

urlpatterns = [
    path('my-results/', MyResultsAndProfileView.as_view(), name='my-results'),
    path('comparison/', ResultComparisonView.as_view(), name='results-comparison'),
]
