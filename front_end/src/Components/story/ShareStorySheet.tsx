import { useAppDispatch } from "../../hooks";
import { shareStory } from "../../features/stories/storiesSlice";
import RecipientPickerSheet from "../share/RecipientPickerSheet";

interface Props {
  storyId: string;
  onClose: () => void;
}

/** Sends a story to people by DM (story viewer's "send to"). */
export default function ShareStorySheet({ storyId, onClose }: Props) {
  const dispatch = useAppDispatch();
  return (
    <RecipientPickerSheet
      onClose={onClose}
      onSend={async (recipientIds, note) =>
        (await dispatch(shareStory({ storyId, recipientIds, note })).unwrap()).shared_count
      }
    />
  );
}
