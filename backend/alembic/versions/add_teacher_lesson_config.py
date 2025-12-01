"""Add TeacherLessonConfig table

Revision ID: add_teacher_lesson_config
Revises: add_teacher_profile
Create Date: 2025-01-19

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_teacher_lesson_config'
down_revision = 'add_teacher_profile'
branch_labels = None
depends_on = None


def upgrade():
    # Create teacher_lesson_configs table
    op.create_table(
        'teacher_lesson_configs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('subject_name', sa.String(255), nullable=False),
        sa.Column('grade', sa.String(50), nullable=False),
        sa.Column('lessons_per_week', sa.Integer(), default=5),
        sa.Column('double_lessons_per_week', sa.Integer(), default=0),
        sa.Column('single_lesson_duration', sa.Integer(), default=40),
        sa.Column('double_lesson_duration', sa.Integer(), default=80),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create unique index on user_id + subject_name + grade
    op.create_index(
        'ix_teacher_lesson_config_user_subject_grade',
        'teacher_lesson_configs',
        ['user_id', 'subject_name', 'grade'],
        unique=True
    )


def downgrade():
    op.drop_index('ix_teacher_lesson_config_user_subject_grade', table_name='teacher_lesson_configs')
    op.drop_table('teacher_lesson_configs')
