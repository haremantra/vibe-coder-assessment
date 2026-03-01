/**
 * Notification + Milestone tRPC routers
 * Handles in-app notifications and growth plan milestone tracking
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createNotification,
  getNotificationsByUser,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  initMilestones,
  getMilestonesByAssessment,
  toggleMilestone,
  getPhaseCompletionStatus,
  getAssessmentById,
} from "./db";

export const notificationRouter = router({
  /** Get all notifications for the current user */
  list: protectedProcedure.query(async ({ ctx }) => {
    return getNotificationsByUser(ctx.user.id);
  }),

  /** Get unread notification count */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadCount(ctx.user.id);
  }),

  /** Mark a single notification as read */
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),

  /** Mark all notifications as read */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});

export const milestoneRouter = router({
  /** Initialize milestones for a growth plan (called once after growth plan generation) */
  init: protectedProcedure
    .input(
      z.object({
        assessmentId: z.number(),
        milestones: z.array(
          z.object({
            phaseIndex: z.number(),
            milestoneIndex: z.number(),
            milestoneText: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if milestones already exist for this assessment
      const existing = await getMilestonesByAssessment(input.assessmentId, ctx.user.id);
      if (existing.length > 0) {
        return { alreadyInitialized: true, count: existing.length };
      }

      const data = input.milestones.map((m) => ({
        userId: ctx.user.id,
        assessmentId: input.assessmentId,
        phaseIndex: m.phaseIndex,
        milestoneIndex: m.milestoneIndex,
        milestoneText: m.milestoneText,
      }));

      await initMilestones(data);
      return { alreadyInitialized: false, count: data.length };
    }),

  /** Get all milestones for an assessment */
  getByAssessment: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getMilestonesByAssessment(input.assessmentId, ctx.user.id);
    }),

  /** Toggle a milestone's completion status */
  toggle: protectedProcedure
    .input(
      z.object({
        milestoneId: z.number(),
        completed: z.boolean(),
        assessmentId: z.number(),
        phaseIndex: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await toggleMilestone(input.milestoneId, ctx.user.id, input.completed);

      // Check if the phase is now complete
      const phaseStatus = await getPhaseCompletionStatus(
        input.assessmentId,
        ctx.user.id,
        input.phaseIndex,
      );

      const phaseComplete = phaseStatus.total > 0 && phaseStatus.completed === phaseStatus.total;

      if (phaseComplete && input.completed) {
        const phaseLabels = ["0-30 Day", "30-60 Day", "60-90 Day"];
        const phaseLabel = phaseLabels[input.phaseIndex] ?? `Phase ${input.phaseIndex + 1}`;

        // Fire phase completion notification
        await createNotification({
          userId: ctx.user.id,
          type: "phase_complete",
          title: `${phaseLabel} Phase Complete!`,
          body: `Congratulations! You've completed all milestones in the ${phaseLabel} phase of your growth plan. ${input.phaseIndex < 2 ? "The next phase is now unlocked." : "You've completed the entire 90-day plan!"}`,
          actionUrl: `/history`,
          assessmentId: input.assessmentId,
        });

        // If this was the last phase, fire plan completion + reassess reminder
        if (input.phaseIndex === 2) {
          // Check all 3 phases
          const allPhasesComplete = await Promise.all(
            [0, 1, 2].map((pi) =>
              getPhaseCompletionStatus(input.assessmentId, ctx.user.id, pi),
            ),
          );
          const planComplete = allPhasesComplete.every(
            (p) => p.total > 0 && p.completed === p.total,
          );

          if (planComplete) {
            await createNotification({
              userId: ctx.user.id,
              type: "plan_complete",
              title: "90-Day Growth Plan Complete!",
              body: "You've completed your entire growth plan. Time to reassess your vibe coding maturity and see how much you've grown!",
              actionUrl: `/chat-assess`,
              assessmentId: input.assessmentId,
            });

            await createNotification({
              userId: ctx.user.id,
              type: "reassess_reminder",
              title: "Time to Reassess",
              body: "With your growth plan complete, take the assessment again to measure your progress. Your new scores will appear in the Compare Over Time view.",
              actionUrl: `/chat-assess`,
            });
          }
        }
      }

      return {
        success: true,
        phaseComplete,
        phaseStatus,
      };
    }),

  /** Get completion status for all 3 phases of an assessment */
  phaseStatus: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const phases = await Promise.all(
        [0, 1, 2].map((pi) =>
          getPhaseCompletionStatus(input.assessmentId, ctx.user.id, pi),
        ),
      );
      return phases;
    }),
});
