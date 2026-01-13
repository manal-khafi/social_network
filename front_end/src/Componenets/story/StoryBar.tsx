import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { addStory } from '../../features/stories/storiesSlice';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function StoryBar() {
  const dispatch = useAppDispatch();
  const { stories } = useAppSelector((state) => state.stories);
  const { currentUser } = useAppSelector((state) => state.user);
  const [open, setOpen] = useState(false);
  const [storyImage, setStoryImage] = useState('');

  const handleCreateStory = () => {
    if (storyImage.trim()) {
      dispatch(addStory({ image: storyImage }));
      toast.success('Story created!');
      setStoryImage('');
      setOpen(false);
    }
  };

  const useRandomImage = () => {
    const randomImages = [
      'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
    ];
    setStoryImage(randomImages[Math.floor(Math.random() * randomImages.length)]);
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="p-4 flex gap-4 overflow-x-auto">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-primary">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>{currentUser?.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                  <Plus className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
              <span className="text-xs">Your story</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Story</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Story Image URL</label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={storyImage}
                  onChange={(e) => setStoryImage(e.target.value)}
                />
                <Button
                  onClick={useRandomImage}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Use Random Image
                </Button>
              </div>
              {storyImage && (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={storyImage} alt="Preview" className="w-full h-64 object-cover" />
                </div>
              )}
              <Button
                onClick={handleCreateStory}
                disabled={!storyImage.trim()}
                className="w-full bg-[#d6955b] hover:bg-[#c58549]"
              >
                Create Story
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {stories.map((story) => (
          <Link
            key={story.id}
            to={`/story/${story.id}`}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className={`p-0.5 rounded-full ${story.isViewed ? 'bg-muted' : 'bg-gradient-to-tr from-primary to-accent'}`}>
              <Avatar className="w-16 h-16 border-2 border-card">
                <AvatarImage src={story.avatar} />
                <AvatarFallback>{story.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs max-w-[64px] truncate">{story.username}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}