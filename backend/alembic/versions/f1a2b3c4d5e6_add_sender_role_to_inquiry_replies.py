"""add sender_role to inquiry_replies

Revision ID: f1a2b3c4d5e6
Revises: 54d74f6409dc
Create Date: 2026-09-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = '54d74f6409dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'inquiry_replies',
        sa.Column('sender_role', sa.String(length=20), server_default='assistant', nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('inquiry_replies', 'sender_role')
