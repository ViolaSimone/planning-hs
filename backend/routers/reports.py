"""Aggregated compliance reports (per course, per medical plan) and their
CSV/Excel export with human-readable Italian column headers."""

from io import BytesIO
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services import get_training_report, get_medical_surveillance_report
from config import settings
from excel_utils import autosize_worksheet

router = APIRouter()


def _renewal_label(value: int, unit: str) -> str:
    if unit == "years":
        return f"{value} {'anno' if value == 1 else 'anni'}"
    return f"{value} {'mese' if value == 1 else 'mesi'}"


def _course_report_dataframe(report: list) -> pd.DataFrame:
    df = pd.DataFrame(report)
    if df.empty:
        return df
    df = df.drop(columns=["course_id"], errors="ignore")
    return df.rename(columns={
        "course_name": "Corso",
        "total_employees": "Totale dipendenti",
        "trained_count": "Formati",
        "missing_count": "Da Formare",
        "expiring_soon_count": "In scadenza",
        "expired_count": "Scaduti",
        "to_update_count": "Da aggiornare",
        "compliance_percentage": "Compliance %",
    })


def _medical_report_dataframe(report: list) -> pd.DataFrame:
    df = pd.DataFrame(report)
    if df.empty:
        return df

    df["Rinnovo"] = df.apply(lambda row: _renewal_label(row["renewal_value"], row["renewal_unit"]), axis=1)
    df = df.drop(columns=["plan_id", "renewal_value", "renewal_unit"], errors="ignore")
    df = df.rename(columns={
        "plan_name": "Piano sanitario",
        "total_employees": "Totale dipendenti",
        "medically_fit_count": "Idonei",
        "missing_count": "Mancanti",
        "expiring_soon_count": "In scadenza",
        "expired_count": "Scaduti",
        "to_visit_count": "Tot da Visitare",
        "compliance_percentage": "Compliance %",
    })

    ordered_columns = [
        "Piano sanitario", "Rinnovo", "Totale dipendenti", "Idonei",
        "Mancanti", "In scadenza", "Scaduti", "Tot da Visitare", "Compliance %",
    ]
    return df[[col for col in ordered_columns if col in df.columns]]


@router.get("/api/reports/training")
async def get_training_report_endpoint(
    days_threshold: int = Query(default=150, ge=0),
    course_ids: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    selected_ids = [int(value.strip()) for value in course_ids.split(",")] if course_ids else None
    return await get_training_report(
        db,
        days_threshold=days_threshold,
        course_ids=selected_ids,
        yellow=settings.ALERT_EXPIRING_SOON_DAYS,
        red=settings.ALERT_CRITICAL_DAYS,
    )


@router.get("/api/reports/export/csv")
async def export_training_report_csv(
    days_threshold: int = Query(default=150, ge=0),
    course_ids: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    selected_ids = [int(value.strip()) for value in course_ids.split(",")] if course_ids else None
    report = await get_training_report(
        db,
        days_threshold=days_threshold,
        course_ids=selected_ids,
        yellow=settings.ALERT_EXPIRING_SOON_DAYS,
        red=settings.ALERT_CRITICAL_DAYS,
    )
    df = _course_report_dataframe(report)
    stream = BytesIO()
    df.to_csv(stream, index=False, encoding="utf-8-sig")
    stream.seek(0)
    return StreamingResponse(
        stream, media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=training_report.csv"},
    )


@router.get("/api/reports/export/excel")
async def export_training_report_excel(
    days_threshold: int = Query(default=150, ge=0),
    course_ids: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    selected_ids = [int(value.strip()) for value in course_ids.split(",")] if course_ids else None
    report = await get_training_report(
        db,
        days_threshold=days_threshold,
        course_ids=selected_ids,
        yellow=settings.ALERT_EXPIRING_SOON_DAYS,
        red=settings.ALERT_CRITICAL_DAYS,
    )
    df = _course_report_dataframe(report)
    stream = BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Report corsi")
        autosize_worksheet(writer.sheets["Report corsi"], df)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=training_report.xlsx"},
    )


@router.get("/api/reports/medical")
async def get_medical_report_endpoint(
    days_threshold: int = Query(default=150, ge=0),
    plan_ids: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    selected_ids = [int(value.strip()) for value in plan_ids.split(",")] if plan_ids else None
    return await get_medical_surveillance_report(db, days_threshold=days_threshold, plan_ids=selected_ids)


@router.get("/api/reports/medical/export/csv")
async def export_medical_report_csv(
    days_threshold: int = Query(default=150, ge=0),
    plan_ids: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    selected_ids = [int(value.strip()) for value in plan_ids.split(",")] if plan_ids else None
    report = await get_medical_surveillance_report(db, days_threshold=days_threshold, plan_ids=selected_ids)
    df = _medical_report_dataframe(report)
    stream = BytesIO()
    df.to_csv(stream, index=False, encoding="utf-8-sig")
    stream.seek(0)
    return StreamingResponse(
        stream, media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=medical_surveillance_report.csv"},
    )


@router.get("/api/reports/medical/export/excel")
async def export_medical_report_excel(
    days_threshold: int = Query(default=150, ge=0),
    plan_ids: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    selected_ids = [int(value.strip()) for value in plan_ids.split(",")] if plan_ids else None
    report = await get_medical_surveillance_report(db, days_threshold=days_threshold, plan_ids=selected_ids)
    df = _medical_report_dataframe(report)
    stream = BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Idoneita mediche")
        autosize_worksheet(writer.sheets["Idoneita mediche"], df)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=medical_surveillance_report.xlsx"},
    )
