import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Trophy, 
  Star, 
  Zap,
  Users,
  Clock,
  ThumbsUp,
  Award,
  Target,
  TrendingUp,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  Fire
} from 'lucide-react';

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    level: number;
    title: string;
  };
  content: string;
  type: 'achievement' | 'question' | 'tip' | 'celebration' | 'milestone';
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  achievement?: {
    title: string;
    icon: React.ComponentType<any>;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
  milestone?: {
    type: string;
    value: number;
    unit: string;
  };
}

interface CommunityFeedProps {
  posts: CommunityPost[];
  className?: string;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({
  posts,
  className = ""
}) => {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');
  const [showComments, setShowComments] = useState<string | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });

  // Configurazioni per i tipi di post
  const postTypeConfig = {
    achievement: {
      icon: Trophy,
      color: 'text-amber-400',
      bg: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30'
    },
    question: {
      icon: MessageCircle,
      color: 'text-blue-400',
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30'
    },
    tip: {
      icon: Zap,
      color: 'text-purple-400',
      bg: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30'
    },
    celebration: {
      icon: Sparkles,
      color: 'text-pink-400',
      bg: 'from-pink-500/20 to-rose-500/20',
      border: 'border-pink-500/30'
    },
    milestone: {
      icon: Target,
      color: 'text-green-400',
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30'
    }
  };

  // Gestione like
  const handleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts);
    if (likedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  // Gestione bookmark
  const handleBookmark = (postId: string) => {
    const newBookmarkedPosts = new Set(bookmarkedPosts);
    if (bookmarkedPosts.has(postId)) {
      newBookmarkedPosts.delete(postId);
    } else {
      newBookmarkedPosts.add(postId);
    }
    setBookmarkedPosts(newBookmarkedPosts);
  };

  // Filtri disponibili
  const filters = [
    { key: 'all', label: 'Tutti', icon: Users },
    { key: 'achievement', label: 'Successi', icon: Trophy },
    { key: 'question', label: 'Domande', icon: MessageCircle },
    { key: 'tip', label: 'Consigli', icon: Zap },
    { key: 'milestone', label: 'Traguardi', icon: Target }
  ];

  const filteredPosts = posts.filter(
    post => filter === 'all' || post.type === filter
  );

  // Componente Post individuale
  const PostCard = ({ post, index }: { post: CommunityPost; index: number }) => {
    const config = postTypeConfig[post.type];
    const Icon = config.icon;
    const isLiked = likedPosts.has(post.id);
    const isBookmarked = bookmarkedPosts.has(post.id);
    const isExpanded = expandedPosts.has(post.id);

    const timeAgo = (date: Date) => {
      const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
      if (minutes < 60) return `${minutes}m fa`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h fa`;
      const days = Math.floor(hours / 24);
      return `${days}g fa`;
    };

    return (
      <motion.div
        className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { 
          opacity: 1, 
          y: 0,
          transition: { delay: index * 0.1 }
        } : {}}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Header del post */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative">
              <motion.img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full border-2 border-gray-600"
                whileHover={{ scale: 1.1 }}
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{post.author.level}</span>
              </div>
            </div>

            {/* Info autore */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-white">{post.author.name}</h4>
                <span className="text-xs text-gray-400">{post.author.title}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{timeAgo(post.timestamp)}</span>
              </div>
            </div>
          </div>

          {/* Tipo post badge */}
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${config.bg} border ${config.border}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className={`text-xs font-medium ${config.color} capitalize`}>
              {post.type}
            </span>
          </div>
        </div>

        {/* Achievement special display */}
        {post.achievement && (
          <motion.div
            className="mb-4 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <post.achievement.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-amber-400">Achievement Sbloccato!</h5>
                <p className="text-sm text-white">{post.achievement.title}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                  post.achievement.rarity === 'legendary' ? 'bg-gradient-to-r from-amber-400 to-red-500 text-white' :
                  post.achievement.rarity === 'epic' ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white' :
                  post.achievement.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
                  'bg-gray-600 text-gray-200'
                }`}>
                  {post.achievement.rarity.toUpperCase()}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Milestone special display */}
        {post.milestone && (
          <motion.div
            className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-green-400">Traguardo Raggiunto!</h5>
                <p className="text-lg font-bold text-white">
                  {post.milestone.value.toLocaleString()} {post.milestone.unit}
                </p>
                <p className="text-sm text-gray-300">{post.milestone.type}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contenuto del post */}
        <div className="mb-4">
          <motion.p 
            className="text-gray-200 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isExpanded || post.content.length <= 150 
              ? post.content 
              : `${post.content.substring(0, 150)}...`
            }
          </motion.p>

          {post.content.length > 150 && (
            <motion.button
              onClick={() => {
                const newExpanded = new Set(expandedPosts);
                if (isExpanded) {
                  newExpanded.delete(post.id);
                } else {
                  newExpanded.add(post.id);
                }
                setExpandedPosts(newExpanded);
              }}
              className="text-blue-400 text-sm mt-2 hover:text-blue-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isExpanded ? 'Mostra meno' : 'Leggi tutto'}
            </motion.button>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, tagIndex) => (
              <motion.span
                key={tag}
                className="px-3 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full border border-gray-600/50"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + tagIndex * 0.1 }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(107, 114, 128, 0.3)' }}
              >
                #{tag}
              </motion.span>
            ))}
          </div>
        )}

        {/* Azioni del post */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <div className="flex items-center space-x-6">
            {/* Like */}
            <motion.button
              onClick={() => handleLike(post.id)}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </motion.div>
              <span className="text-sm font-medium">{post.likes + (isLiked ? 1 : 0)}</span>
            </motion.button>

            {/* Comments */}
            <motion.button
              onClick={() => setShowComments(showComments === post.id ? null : post.id)}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{post.comments}</span>
            </motion.button>

            {/* Share */}
            <motion.button
              className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-medium">{post.shares}</span>
            </motion.button>
          </div>

          {/* Bookmark */}
          <motion.button
            onClick={() => handleBookmark(post.id)}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked 
                ? 'text-amber-400 bg-amber-500/20' 
                : 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </motion.button>
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {showComments === post.id && (
            <motion.div
              className="mt-4 pt-4 border-t border-gray-700/50"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm text-center">
                  Sezione commenti in arrivo! 💬
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div
        className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Users className="h-8 w-8 text-cyan-400" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-white">Community Feed</h3>
              <p className="text-gray-400">Condividi i tuoi successi e impara dagli altri</p>
            </div>
          </div>

          {/* Stats rapide */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{posts.length}</div>
              <div className="text-xs text-gray-400">Post</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-pink-400">
                {posts.reduce((sum, post) => sum + post.likes, 0)}
              </div>
              <div className="text-xs text-gray-400">Likes</div>
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filterOption) => {
            const FilterIcon = filterOption.icon;
            return (
              <motion.button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === filterOption.key
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FilterIcon className="h-4 w-4" />
                <span>{filterOption.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Feed Posts */}
        <div className="space-y-6 max-h-96 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {filteredPosts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </AnimatePresence>

          {filteredPosts.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nessun post trovato per questo filtro</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CommunityFeed;