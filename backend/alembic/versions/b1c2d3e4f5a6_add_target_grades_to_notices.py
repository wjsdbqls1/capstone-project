"""add target_grades to notices

Revision ID: b1c2d3e4f5a6
Revises: a7b8c9d0e1f2
Create Date: 2026-09-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'notices',
        sa.Column('target_grades', sa.String(length=20), server_default='0', nullable=False),
    )
    # 기존 target_grade(정수) 값을 문자열로 그대로 옮겨줌 (0=전체, 1~4=학년)
    op.execute("UPDATE notices SET target_grades = CAST(target_grade AS VARCHAR)")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('notices', 'target_grades')
