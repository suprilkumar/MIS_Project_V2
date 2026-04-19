# core/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Centre, CourseCategory, Course
from .serializers import CentreSerializer, CourseCategorySerializer, CourseSerializer


# =====================================================
# CENTRE VIEWS
# =====================================================

@api_view(['GET', 'POST'])
def centre_list(request):
    if request.method == 'GET':
        centres = Centre.objects.all().order_by('centre_name')
        serializer = CentreSerializer(centres, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CentreSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def centre_detail(request, pk):
    centre = get_object_or_404(Centre, pk=pk)
    
    if request.method == 'GET':
        serializer = CentreSerializer(centre)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CentreSerializer(centre, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        centre.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# COURSE CATEGORY VIEWS
# =====================================================

@api_view(['GET', 'POST'])
def category_list(request):
    if request.method == 'GET':
        categories = CourseCategory.objects.all().order_by('category_type')
        serializer = CourseCategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CourseCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def category_detail(request, pk):
    category = get_object_or_404(CourseCategory, pk=pk)
    
    if request.method == 'GET':
        serializer = CourseCategorySerializer(category)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CourseCategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# COURSE VIEWS
# =====================================================

@api_view(['GET', 'POST'])
def course_list(request):
    if request.method == 'GET':
        courses = Course.objects.select_related('centre', 'course_category').all()
        
        # Optional filters
        centre_id = request.query_params.get('centre')
        category_id = request.query_params.get('category')
        status_filter = request.query_params.get('status')
        
        if centre_id:
            courses = courses.filter(centre_id=centre_id)
        if category_id:
            courses = courses.filter(course_category_id=category_id)
        if status_filter:
            courses = courses.filter(course_status=status_filter)
        
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def course_detail(request, pk):
    course = get_object_or_404(Course, pk=pk)
    
    if request.method == 'GET':
        serializer = CourseSerializer(course)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CourseSerializer(course, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# FILTERED LIST VIEWS (Commonly used)
# =====================================================

@api_view(['GET'])
def centres_by_state(request, state):
    """Get centres by state"""
    centres = Centre.objects.filter(centre_state__iexact=state)
    serializer = CentreSerializer(centres, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def courses_by_centre(request, centre_id):
    """Get all courses for a specific centre"""
    courses = Course.objects.filter(centre_id=centre_id).select_related('course_category')
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def courses_by_category(request, category_id):
    """Get all courses for a specific category"""
    courses = Course.objects.filter(course_category_id=category_id).select_related('centre')
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def active_courses(request):
    """Get all active courses"""
    courses = Course.objects.filter(course_status='ACTIVE')
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)