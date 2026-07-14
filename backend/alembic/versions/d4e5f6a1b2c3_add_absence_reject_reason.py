"""add reject_reason to absence_requests

Revision ID: d4e5f6a1b2c3
Revises: c3d4e5f6a1b2
Create Date: 2026-07-14

공결 반려 사유(reject_reason) 컬럼 추가. 모델과 실제 테이블 동기화.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a1b2c3'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'absence_requests',
        sa.Column('reject_reason', sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('absence_requests', 'reject_reason')
