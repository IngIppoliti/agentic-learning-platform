import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { communityAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'

export const useCommunityFeed = (params?: {
  post_type?: string
  topic?: string
}) => {
  return useInfiniteQuery({
    queryKey: ['community', 'feed', params],
    queryFn: ({ pageParam = 1 }) => 
      communityAPI.getFeed({ ...params, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    staleTime: 2 * 60 * 1000, // 2 minuti
    gcTime: 5 * 60 * 1000, // 5 minuti
    retry: 2,
  })
}

export const useCommunityPost = (postId: string) => {
  return useQuery({
    queryKey: ['community', 'post', postId],
    queryFn: () => communityAPI.getPost(postId),
    enabled: !!postId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  })
}

export const useCreatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: communityAPI.createPost,
    onSuccess: (data) => {
      toast.success(`Post creato! +${data.xp_earned} XP`)
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      toast.error('Errore nella creazione del post')
      console.error('Create post error:', error)
    },
  })
}

export const useToggleLike = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId }: { postId: string }) => communityAPI.toggleLike(postId),
    onSuccess: (data, variables) => {
      if (data.xp_earned > 0) {
        toast.success(`+${data.xp_earned} XP`)
      }
      
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['community', 'post', variables.postId] })
    },
    onError: (error) => {
      toast.error('Errore nell\'aggiornamento del like')
      console.error('Toggle like error:', error)
    },
  })
}

export const useAddComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, commentData }: {
      postId: string
      commentData: { content: string; parent_comment_id?: string }
    }) => communityAPI.addComment(postId, commentData),
    onSuccess: (data, variables) => {
      toast.success(`Commento aggiunto! +${data.xp_earned} XP`)
      queryClient.invalidateQueries({ queryKey: ['community', 'post', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      toast.error('Errore nell\'aggiunta del commento')
      console.error('Add comment error:', error)
    },
  })
}

export const useStudyGroups = (params?: {
  topic?: string
  is_public?: boolean
}) => {
  return useInfiniteQuery({
    queryKey: ['community', 'study-groups', params],
    queryFn: ({ pageParam = 1 }) =>
      communityAPI.getStudyGroups({ ...params, page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  })
}

export const useCreateStudyGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: communityAPI.createStudyGroup,
    onSuccess: (data) => {
      toast.success(`Gruppo studio creato! +${data.xp_earned} XP`)
      queryClient.invalidateQueries({ queryKey: ['community', 'study-groups'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      toast.error('Errore nella creazione del gruppo studio')
      console.error('Create study group error:', error)
    },
  })
}

export const useJoinStudyGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId }: { groupId: string }) => communityAPI.joinStudyGroup(groupId),
    onSuccess: (data) => {
      toast.success(`${data.message} +${data.xp_earned} XP`)
      queryClient.invalidateQueries({ queryKey: ['community', 'study-groups'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      toast.error('Errore nell\'unirsi al gruppo')
      console.error('Join study group error:', error)
    },
  })
}
