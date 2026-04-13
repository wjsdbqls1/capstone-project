"""add missing notice columns

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-04-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a1'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notices', sa.Column('target_grade', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('notices', sa.Column('source', sa.String(length=50), nullable=False, server_default='internal'))
    op.add_column('notices', sa.Column('file_path', sa.String(length=500), nullable=True))
    op.add_column('notices', sa.Column('original_filename', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('notices', 'original_filename')
    op.drop_column('notices', 'file_path')
    op.drop_column('notices', 'source')
    op.drop_column('notices', 'target_grade')
