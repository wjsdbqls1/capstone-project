"""add title/url to notifications and index user_id

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """알림 기록에 제목과 이동 링크를 남기기 위한 컬럼."""
    op.add_column('notifications', sa.Column('title', sa.String(length=100), nullable=True))
    op.add_column('notifications', sa.Column('url', sa.String(length=200), nullable=True))
    # 사용자별 목록 조회가 기본 동작이라 인덱스를 함께 건다
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_notifications_user_id")
    op.drop_column('notifications', 'url')
    op.drop_column('notifications', 'title')
