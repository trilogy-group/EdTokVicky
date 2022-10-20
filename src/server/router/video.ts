import { Follow, Like } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

export const videoRouter = createRouter()
  .query("for-you", {
    input: z.object({
      cursor: z.number().nullish(),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {
      const skip = input.cursor || 0;
      const items = await prisma.video.findMany({
        where: {
          /*
                    done: {
                      equals: false,
                    }
          */
        },
        take: 4,
        skip,
        include: {
          user: true,
          post: true,
          question: true,
          //   _count: { select: { likes: true, comments: true } },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      let likes: Like[] = [];
      let followings: Follow[] = [];

      if (session?.user?.id) {
        /*
                [likes, followings] = await Promise.all([
                  prisma.like.findMany({
                    where: {
                      userId: session.user.id,
                      videoId: { in: items.map((item) => item.id) },
                    },
                  }),
                  prisma.follow.findMany({
                    where: {
                      followerId: session.user.id,
                      followingId: {
                        in: items.map((item) => item.userId),
                      },
                    },
                  }),
                ]);
        */
        console.log("the number of items ", items.length);
      }

      return {
        items: items.map((item) => ({
          ...item,
          //likedByMe: likes.some((like) => like.videoId === item.id),
          followedByMe: followings.some(
            (following) => following.followingId === item.userId
          ),
        })),
        nextSkip: items.length === 0 ? null : skip + 4,
      };
    },
  })
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .query("following", {
    input: z.object({
      cursor: z.number().nullish(),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {
      const followingIds = (
        await prisma.follow.findMany({
          where: {
            followerId: session?.user?.id!,
          },
          select: {
            followingId: true,
          },
        })
      ).map((item) => item.followingId);

      const skip = input.cursor || 0;
      const items = await prisma.video.findMany({
        take: 4,
        skip,
        include: {
          user: true,
          //_count: { select: { likes: true, comments: true } },
          post: true
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      let likes: Like[] = [];
      let followings: Follow[] = [];
      /*
            [likes, followings] = await Promise.all([
              prisma.like.findMany({
                where: {
                  userId: session?.user?.id!,
                  videoId: { in: items.map((item) => item.id) },
                },
              }),
              prisma.follow.findMany({
                where: {
                  followerId: session?.user?.id!,
                  followingId: {
                    in: items.map((item) => item.userId),
                  },
                },
              }),
            ]);
      */
      return {
        items: items.map((item) => ({
          ...item,
          likedByMe: false,
          followedByMe: followings.some(
            (following) => following.followingId === item.userId
          ),
          post: item.post
        })),
        nextSkip: items.length === 0 ? null : skip + 4,
      };
    },
  })
  .mutation("create-post", {
    input: z.object({
      caption: z.string(),
      videoURL: z.string().url(),
      coverURL: z.string().url(),
      videoWidth: z.number().gt(0),
      videoHeight: z.number().gt(0),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const createdPost = await prisma.post.create({
        data: {
          ...input,
        },
      });
      console.log("createdPost ", createdPost);

      /*
      const createdVideo = await prisma.video.create({
        data: {
          userId: session?.user?.id!,
          done: false,
          postId: createdPost.id,
        },
      });
      console.log("video ", createdVideo);
*/

      await prisma.video.upsert({
        where: {
          video_identifier: {
            userId: session?.user?.id as string,
            postId: createdPost.id
          }
        },
        update: {},
        create: {
          userId: session?.user?.id!,
          postId: createdPost.id,
          done: false,

        },
      });

      return createdPost;
    },
  }).mutation("post-got-it", {
    input: z.object({
      postId: z.string(),
      caption: z.string()
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      console.log("input post id", input.postId);

      const createdQuestion = await prisma.question.create({
        data: {
          caption: input.caption,
        },
      });

      await prisma.video.update({
        where: {
          video_identifier: {
            userId: session?.user?.id as string,
            postId: input.postId
          }
        },
        data: {
          done: true,
          questionId: createdQuestion.id
        }
      });
    },
  }).mutation("post-question-answer", {
    input: z.object({
      score: z.number().gt(0),
      postId: z.string()
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      console.log("post id of the question", input.postId);

      await prisma.video.update({
        where: {
          video_identifier: {
            userId: session?.user?.id as string,
            postId: input.postId
          }
        },
        data: {
          score: input.score
        }
      });
    },
  });
