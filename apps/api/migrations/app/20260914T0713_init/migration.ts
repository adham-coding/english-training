#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4b9811ae9f5dec036853528d7bc95a1fa6cd32d1371f00a005cf43817ca40447/contract';
import endContract from '../../snapshots/4b9811ae9f5dec036853528d7bc95a1fa6cd32d1371f00a005cf43817ca40447/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'activity',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lessonId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'activity_status_check_bc64f66b',
            "\"status\" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')",
          ),
          checkExpression(
            'activity_type_check_34f2954f',
            "\"type\" IN ('READING', 'LISTENING', 'WRITING', 'SPEAKING', 'VOCABULARY', 'GRAMMAR', 'QUIZ')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'activity_attempt',
        columns: [
          col('activityId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('maxScore', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('percentage', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('score', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('startedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('IN_PROGRESS'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'activity_attempt_status_check_794484ba',
            "\"status\" IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'course',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'course_status_check_bc64f66b',
            "\"status\" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'course_level',
        columns: [
          col('courseId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('levelId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'lesson',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unitId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'lesson_status_check_bc64f66b',
            "\"status\" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'level',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'question',
        columns: [
          col('activityId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('explanation', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('points', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'question_type_check_e5bac24b',
            "\"type\" IN ('SINGLE_CHOICE', 'MULTI_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'MATCHING', 'ORDERING')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'question_option',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('isCorrect', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('questionId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'unit',
        columns: [
          col('courseLevelId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('firstName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('lastName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('USER'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('user_role_check_1954e8c0', "\"role\" IN ('USER', 'ADMIN')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'user_answer',
        columns: [
          col('answerText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('attemptId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('isCorrect', 'bool', { codecRef: { codecId: 'pg/bool@1' } }),
          col('pointsEarned', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('questionId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user_answer_option',
        columns: [
          col('questionOptionId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('userAnswerId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['userAnswerId', 'questionOptionId'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'activity',
        constraint: 'activity_lessonId_order_key',
        columns: ['lessonId', 'order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'course',
        constraint: 'course_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'course_level',
        constraint: 'course_level_courseId_levelId_key',
        columns: ['courseId', 'levelId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'lesson',
        constraint: 'lesson_unitId_slug_key',
        columns: ['unitId', 'slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'lesson',
        constraint: 'lesson_unitId_order_key',
        columns: ['unitId', 'order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'level',
        constraint: 'level_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'question',
        constraint: 'question_activityId_order_key',
        columns: ['activityId', 'order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'question_option',
        constraint: 'question_option_questionId_order_key',
        columns: ['questionId', 'order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'unit',
        constraint: 'unit_courseLevelId_slug_key',
        columns: ['courseLevelId', 'slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'unit',
        constraint: 'unit_courseLevelId_order_key',
        columns: ['courseLevelId', 'order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user_answer',
        constraint: 'user_answer_attemptId_questionId_key',
        columns: ['attemptId', 'questionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'activity',
        index: 'activity_lessonId_idx_e358970d',
        columns: ['lessonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'activity',
        index: 'activity_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'activity',
        index: 'activity_type_idx_b6b604ea',
        columns: ['type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'activity_attempt',
        index: 'activity_attempt_activityId_idx_bf2a659e',
        columns: ['activityId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'activity_attempt',
        index: 'activity_attempt_activityId_startedAt_idx_f3fd6fb2',
        columns: ['activityId', 'startedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'activity_attempt',
        index: 'activity_attempt_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'activity_attempt',
        index: 'activity_attempt_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'activity_attempt',
        index: 'activity_attempt_userId_startedAt_idx_91bd1466',
        columns: ['userId', 'startedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'course',
        index: 'course_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'course_level',
        index: 'course_level_courseId_idx_12f72d2a',
        columns: ['courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'course_level',
        index: 'course_level_levelId_idx_622a0732',
        columns: ['levelId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lesson',
        index: 'lesson_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lesson',
        index: 'lesson_unitId_idx_be785412',
        columns: ['unitId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'level',
        index: 'level_order_idx_0202ea31',
        columns: ['order'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'question',
        index: 'question_activityId_idx_bf2a659e',
        columns: ['activityId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'question_option',
        index: 'question_option_questionId_idx_fdb42076',
        columns: ['questionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'unit',
        index: 'unit_courseLevelId_idx_5bc88201',
        columns: ['courseLevelId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user_answer',
        index: 'user_answer_attemptId_idx_94f50eb9',
        columns: ['attemptId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user_answer',
        index: 'user_answer_questionId_idx_fdb42076',
        columns: ['questionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user_answer_option',
        index: 'user_answer_option_questionOptionId_idx_7974ef6c',
        columns: ['questionOptionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user_answer_option',
        index: 'user_answer_option_userAnswerId_idx_80d1babd',
        columns: ['userAnswerId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'activity',
        foreignKey: {
          name: 'activity_lessonId_fkey',
          columns: ['lessonId'],
          references: { schema: 'public', table: 'lesson', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'activity_attempt',
        foreignKey: {
          name: 'activity_attempt_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'activity_attempt',
        foreignKey: {
          name: 'activity_attempt_activityId_fkey',
          columns: ['activityId'],
          references: { schema: 'public', table: 'activity', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'course_level',
        foreignKey: {
          name: 'course_level_courseId_fkey',
          columns: ['courseId'],
          references: { schema: 'public', table: 'course', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'course_level',
        foreignKey: {
          name: 'course_level_levelId_fkey',
          columns: ['levelId'],
          references: { schema: 'public', table: 'level', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lesson',
        foreignKey: {
          name: 'lesson_unitId_fkey',
          columns: ['unitId'],
          references: { schema: 'public', table: 'unit', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'question',
        foreignKey: {
          name: 'question_activityId_fkey',
          columns: ['activityId'],
          references: { schema: 'public', table: 'activity', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'question_option',
        foreignKey: {
          name: 'question_option_questionId_fkey',
          columns: ['questionId'],
          references: { schema: 'public', table: 'question', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'unit',
        foreignKey: {
          name: 'unit_courseLevelId_fkey',
          columns: ['courseLevelId'],
          references: { schema: 'public', table: 'course_level', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_answer',
        foreignKey: {
          name: 'user_answer_attemptId_fkey',
          columns: ['attemptId'],
          references: { schema: 'public', table: 'activity_attempt', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_answer',
        foreignKey: {
          name: 'user_answer_questionId_fkey',
          columns: ['questionId'],
          references: { schema: 'public', table: 'question', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_answer_option',
        foreignKey: {
          name: 'user_answer_option_userAnswerId_fkey',
          columns: ['userAnswerId'],
          references: { schema: 'public', table: 'user_answer', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_answer_option',
        foreignKey: {
          name: 'user_answer_option_questionOptionId_fkey',
          columns: ['questionOptionId'],
          references: { schema: 'public', table: 'question_option', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
