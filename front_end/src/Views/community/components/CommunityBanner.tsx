import { ArrowLeft } from "lucide-react";
import { Button } from "../../../Components/Community/communityButton";
import { useNavigate } from "react-router-dom";
import type { Community } from "../types";

interface CommunityBannerProps {
  community: Community;
}

/** Cover image strip at the top of a community page, with the back button. */
export function CommunityBanner({
  community,
}: CommunityBannerProps) {
  const navigate = useNavigate();

  return (
    <div
      className="relative h-48 sm:h-64 bg-gradient-to-r from-[#18534f] via-[#226d68] to-[#d6955b] bg-cover bg-center"
      style={{
        backgroundImage: community.banner_url ? `url(${community.banner_url})` : undefined
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
        <Button variant="ghost" onClick={() => navigate('/community/list')} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white h-9 w-9 p-0 sm:h-10 sm:w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
