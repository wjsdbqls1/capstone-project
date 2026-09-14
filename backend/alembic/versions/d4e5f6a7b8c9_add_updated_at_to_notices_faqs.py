"""add updated_at to notices and faqs

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """목록/상세에 '수정됨'을 표시하기 위한 수정 시각.

    기존 행은 NULL로 남겨 둔다. 값이 없으면 '수정된 적 없음'을 뜻한다.
    """
    for table in ("notices", "faqs"):
        op.add_column(table, sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    for table in ("notices", "faqs"):
        op.drop_column(table, "updated_at")
