"""add category to faqs

Revision ID: a1b2c3d4e5f6
Revises: 840d7dd69236
Create Date: 2026-04-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '840d7dd69236'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# 허용 카테고리 목록
CATEGORIES = ['수강신청', '성적', '졸업', '장학금', '휴복학', '등록금', '기숙사', '공결_출석', '증명서', '기타']


def upgrade() -> None:
    op.add_column(
        'faqs',
        sa.Column(
            'category',
            sa.String(length=50),
            nullable=False,
            server_default='기타',
        )
    )


def downgrade() -> None:
    op.drop_column('faqs', 'category')
