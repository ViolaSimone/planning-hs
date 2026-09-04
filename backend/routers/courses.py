
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Course
from schemas import CourseCreate, CourseUpdate, CourseResponse, CourseOrderUpdate
from repositories import (
    get_courses,
    get_course,
    create_course,
    update_course,
    delete_course,
    reorder_courses,
    get_course_role_ids,
    set_course_roles,
)


router = APIRouter()


@router.get("/api/courses", response_model=List[CourseResponse])
async def list_courses(db: AsyncSession = Depends(get_db)):
    result = []
    for course in await get_courses(db):
        role_ids = await get_course_role_ids(db, course.id)
        result.append(CourseResponse(**{**course.__dict__, "required_role_ids": role_ids}))
    return result


@router.post("/api/courses", response_model=CourseResponse, status_code=201)
async def create_course_endpoint(payload: CourseCreate, db: AsyncSession = Depends(get_db)):
    course = await create_course(db, Course(**payload.model_dump(exclude={"required_role_ids"})))
    await set_course_roles(db, course.id, payload.required_role_ids or [])
    return CourseResponse(**{**course.__dict__, "required_role_ids": payload.required_role_ids or []})


@router.put("/api/courses/reorder")
async def reorder_courses_endpoint(payload: CourseOrderUpdate, db: AsyncSession = Depends(get_db)):
    await reorder_courses(db, payload.course_ids)
    return {"message": "Order updated"}


@router.put("/api/courses/{course_id}", response_model=CourseResponse)
async def update_course_endpoint(course_id: int, payload: CourseUpdate, db: AsyncSession = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    role_ids = data.pop("required_role_ids", None)

    course = await update_course(db, course_id, data)
    if not course:
        raise HTTPException(404, "Course not found")

    if role_ids is not None:
        await set_course_roles(db, course_id, role_ids)

    return CourseResponse(**{**course.__dict__, "required_role_ids": await get_course_role_ids(db, course_id)})


@router.delete("/api/courses/{course_id}", status_code=204)
async def delete_course_endpoint(course_id: int, db: AsyncSession = Depends(get_db)):
    if not await delete_course(db, course_id):
        raise HTTPException(404, "Course not found")
