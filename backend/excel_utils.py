"""Shared helpers for Excel exports.

Import `autosize_worksheet` wherever a DataFrame is written to an Excel
sheet with openpyxl, and call it right after `df.to_excel(...)`, before
closing/seeking the stream.
"""

from openpyxl.utils import get_column_letter
from openpyxl.worksheet.worksheet import Worksheet
import pandas as pd


def autosize_worksheet(
    worksheet: Worksheet,
    df: pd.DataFrame,
    min_width: int = 8,
    max_width: int = 60,
    padding: int = 2,
) -> None:
    for col_idx, column_name in enumerate(df.columns, start=1):
        header_length = len(str(column_name))

        if len(df) > 0:
            max_data_length = max(
                (
                    len(str(value))
                    for value in df[column_name]
                    if pd.notna(value)
                ),
                default=0,
            )
        else:
            max_data_length = 0

        width = max(
            header_length,
            max_data_length,
            min_width,
        ) + padding

        width = min(width, max_width)

        column_letter = get_column_letter(col_idx)
        worksheet.column_dimensions[column_letter].width = width
