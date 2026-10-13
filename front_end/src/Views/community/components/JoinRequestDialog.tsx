import { Button } from "../../../Components/Community/communityButton";
import { Textarea } from "../../../Components/Community/communityTextArea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../Components/Community/communityDialog";
import type { Community } from "../types";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("communities.joinName", { name: community?.name })}</DialogTitle>
          <DialogDescription>
            Add a message to go with your join request (optional)
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder={t("communities.whyDoYouWantToJoin")}
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
            rows={4}
            className="w-full border-2 focus:border-[#226d68] resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">{t("communities.charactersCount", { n: joinMessage.length })}</p>
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
            {t("actions.cancel")}
          </Button>
          <Button
            onClick={handleSubmitJoinRequest}
            className="bg-[#d6955b] hover:bg-[#c5844a] text-white"
          >
            {t("communities.sendRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
