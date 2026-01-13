import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { viewStory, toggleStoryLike } from '../../features/stories/storiesSlice';
import { X, Heart, Send, Pause, Play } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../Componenets/ui/avatar';
import { Input } from '../../Componenets/ui/input';
import { motion } from 'motion/react';

export default function StoryViewerView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { storyId } = useParams();
  const { stories } = useAppSelector((state) => state.stories);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  
  const story = stories.find(s => s.id === storyId);
  const currentIndex = stories.findIndex(s => s.id === storyId);

  useEffect(() => {
    if (storyId) {
      dispatch(viewStory(storyId));
    }
  }, [storyId, dispatch]);

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            // Auto-advance to next story
            if (currentIndex < stories.length - 1) {
              navigate(`/story/${stories[currentIndex + 1].id}`);
              return 0;
            } else {
              navigate(-1);
              return 100;
            }
          }
          return prev + 0.5;
        });
      }, 30);
      
      return () => clearInterval(interval);
    }
  }, [isPaused, currentIndex, stories, navigate]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigate(`/story/${stories[currentIndex - 1].id}`);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      navigate(`/story/${stories[currentIndex + 1].id}`);
      setProgress(0);
    } else {
      navigate(-1);
    }
  };

  const handleLike = () => {
    if (storyId) {
      dispatch(toggleStoryLike(storyId));
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, this would send a DM
      setMessage('');
    }
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-2 left-4 right-4 flex gap-1 z-20">
        {stories.map((s, idx) => (
          <div key={s.id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            {idx === currentIndex && (
              <motion.div 
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            )}
            {idx < currentIndex && (
              <div className="h-full bg-white" />
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={story.avatar} />
            <AvatarFallback>{story.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="font-semibold">{story.username}</p>
            <p className="text-xs opacity-80">{story.timestamp}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full max-w-md h-full flex items-center justify-center">
        {/* Navigation areas */}
        <div className="absolute inset-0 flex z-10">
          <button 
            onClick={handlePrevious}
            className="w-1/3 h-full"
            disabled={currentIndex === 0}
          />
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="w-1/3 h-full"
          />
          <button 
            onClick={handleNext}
            className="w-1/3 h-full"
          />
        </div>
        
        <img
          src={story.image}
          alt="Story"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Bottom interaction */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="flex items-center gap-2 bg-black/50 rounded-full p-2 backdrop-blur-sm">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Send message..."
            className="bg-transparent border-0 text-white placeholder:text-white/60 focus-visible:ring-0"
          />
          <button
            onClick={handleLike}
            className="p-2 hover:scale-110 transition-transform"
          >
            <Heart 
              className={`w-6 h-6 ${
                story.isLiked ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </button>
          <button
            onClick={handleSendMessage}
            className="p-2 hover:scale-110 transition-transform"
          >
            <Send className="w-6 h-6 text-white" />
          </button>
        </div>
        {story.isLiked && (
          <p className="text-white text-xs text-center mt-2">
            Liked by you and {story.likes.toLocaleString()} others
          </p>
        )}
      </div>
    </div>
  );
}