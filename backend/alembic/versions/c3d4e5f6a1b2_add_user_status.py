"""add user status

Revision ID: c3d4e5f6a1b2
Revises: b2c3d4e5f6a1
Create Date: 2026-07-14

학생 상태(재학/휴학/졸업) 컬럼 추가. grade(1~4)는 그대로 유지.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a1b2'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('status', sa.String(length=20), nullable=False, server_default='재학'),
    )


def downgrade() -> None:
    op.drop_column('users', 'status')
