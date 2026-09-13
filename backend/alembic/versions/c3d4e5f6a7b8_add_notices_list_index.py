"""add index on notices(source, posted_date, id) for list query

Revision ID: c3d4e5f6a7b8
Revises: b1c2d3e4f5a6
Create Date: 2026-09-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """공지 목록 조회(source로 걸러 최신순 정렬)가 전체 스캔 + 정렬을 하지 않도록.

    정렬 방향까지 쿼리와 맞춰야 인덱스만으로 상위 N건을 바로 뽑을 수 있다.
    """
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_notices_source_posted "
        "ON notices (source, posted_date DESC, id DESC)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_notices_source_posted")
