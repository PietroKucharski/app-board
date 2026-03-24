"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ThumbsUpIcon } from "lucide-react"
import type { ComponentProps } from "react"
import type z from "zod"
import type { IssueInteractionsResponseSchema } from "@/api/routes/schemas/issue-interactions"
import { Button } from "@/components/button"
import { toggleLike } from "@/http/toggle-like"

type IssueInteractionsResponse = z.infer<typeof IssueInteractionsResponseSchema>

interface LikeButtonProps extends ComponentProps<"button"> {
  issueId: string
  initialLikes: number
  initialLiked?: boolean
}

export function LikeButton({
  issueId,
  initialLikes,
  initialLiked = false,
  ...props
}: LikeButtonProps) {
  const queryClient = useQueryClient()
  const { mutate: handleToggleLike, isPending } = useMutation({
    mutationFn: () => toggleLike({ issueId }),
    onMutate: async () => {
      const previousData = queryClient.getQueryData<IssueInteractionsResponse>([
        "issue-like",
        issueId,
      ])

      queryClient.setQueryData<IssueInteractionsResponse>(
        ["issue-like", issueId],
        (old) => {
          if (!old) {
            return undefined
          }

          return {
            ...old,
            interactions: old.interactions.map((interaction) => {
              if (interaction.issueId === issueId) {
                return {
                  ...interaction,
                  isLiked: !interaction.isLiked,
                  likesCount: interaction.isLiked
                    ? interaction.likesCount - 1
                    : interaction.likesCount + 1,
                }
              }

              return interaction
            }),
          }
        },
      )

      return { previousData }
    },
    onError: async (err, _params, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<IssueInteractionsResponse>(
          ["issue-like", issueId],
          context.previousData,
        )
      }
    },
  })
  const liked = initialLiked

  return (
    <Button
      data-liked={liked}
      className="data-[liked=true]:bg-indigo-600 data-[liked=true]:text-white data-[liked=true]:hover:bg-indigo-500"
      aria-label={liked ? "Unlike" : "Like"}
      disabled={isPending}
      onClick={() => handleToggleLike()}
      {...props}
    >
      <ThumbsUpIcon className="size-3" />
      <span className="text-sm">{initialLikes}</span>
    </Button>
  )
}
