import { Button } from "../../../Components/Community/communityButton";
import { Textarea } from "../../../Components/Community/communityTextArea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../Components/Community/communityDialog";
import type { Community } from "../types";

interface JoinRequestDialogProps {
  community: Community;
  showJoinDialog: boolean;
  setShowJoinDialog: (open: boolean) => void;
  joinMessage: string;
  setJoinMessage: (value: string) => void;
  handleSubmitJoinRequest: () => void;
}

/** Dialog asking for an optional message before sending a join request. */
export function JoinRequestDialog({
  community,
  showJoinDialog,
  setShowJoinDialog,
  joinMessage,
  setJoinMessage,
  handleSubmitJoinRequest,
}: JoinRequestDialogProps) {
  return (
    <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejoindre {community?.name}</DialogTitle>
          <DialogDescription>
            Ajoutez un message pour accompagner votre demande d'adhésion (optionnel)
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Why do you want to join this community?"
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
            rows={4}
            className="w-full border-2 focus:border-[#226d68] resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">{joinMessage.length} caractères</p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowJoinDialog(false);
              setJoinMessage("");
            }}
            className="border-2"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmitJoinRequest}
            className="bg-[#d6955b] hover:bg-[#c5844a] text-white"
          >
            Envoyer la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
