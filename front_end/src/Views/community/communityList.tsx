import { Search, Users, Plus, } from "lucide-react";
import { Button } from "../../Components/Community/communityButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../Components/Community/communityCard";
import { Input } from "../../Components/Community/communityInput";
import { Avatar, AvatarImage, AvatarFallback } from "../../Components/Community/communityAvatar";
import { getCommunities } from "../../api/axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


interface Community {
  id: string;
  name: string;
  members?: number;
  bio: string;
  description?: string;
  image?: string;
  avatar_url?: string;
  type?: string;
  _count?: {
    members: number;
  };
}

// The list navigates by itself; props passed by the router wrapper are ignored.
type CommunityListProps = Record<string, unknown>;

export function CommunityList(_props: CommunityListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCreateClick = () => {
    navigate("/home/community/create");
  };

  const handleSelectCommunity = (id: string) => {
    navigate(`/home/community/${id}`);
  };

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await getCommunities();
        console.log("API Response:", response);
        console.log("Communities data:", response.data);
        
        const communitiesData = response.data.data || response.data.communities || response.data;
        setCommunities(Array.isArray(communitiesData) ? communitiesData : []);
      } catch (error) {
        console.error("Failed to fetch communities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary dark:text-foreground">
                {t("communities.title")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("communities.discover")}</p>
            </div>
            <Button onClick={handleCreateClick} className="bg-[#d6955b] hover:bg-[#c5844a] text-white hidden sm:flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("communities.create")}</span>
            </Button>
            <Button onClick={handleCreateClick} className="bg-[#d6955b] hover:bg-[#c5844a] text-white sm:hidden p-2">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mt-6">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("communities.searchCommunities")}
              className="ps-10 h-12 bg-card border-border focus:border-secondary dark:focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">{t("communities.loadingCommunities")}</p>
          </div>
        ) : communities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">{t("communities.noCommunities")}</p>
            <Button onClick={handleCreateClick} className="bg-[#d6955b] hover:bg-[#c5844a] text-white hidden sm:flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("communities.createTheFirstCommunity")}</span>
            </Button>
            <Button onClick={handleCreateClick} className="bg-[#d6955b] hover:bg-[#c5844a] text-white sm:hidden p-2">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">{t("communities.allCommunities")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <Card
                  key={community.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-secondary dark:hover:border-primary overflow-hidden flex flex-col"
                  onClick={() => handleSelectCommunity(community.id)}
                >
                  {/* Banner Header */}
                  <div 
                    className="h-24 bg-gradient-to-r from-[#18534f] to-[#226d68] flex items-center justify-center bg-cover bg-center relative"
                    style={{
                      backgroundImage: community.image ? `url(${community.image})` : undefined
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                    <Avatar className="h-20 w-20 border-4 border-card shadow-lg relative z-10">
                      <AvatarImage src={community.avatar_url} alt={community.name} />
                      <AvatarFallback className="bg-[#d6955b] text-white text-sm font-bold">
                        {community.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <CardHeader className="pt-4">
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary dark:group-hover:text-foreground transition-colors">
                        {community.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 mt-1">{community.bio}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    {community.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{community.description}</p>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">{t("communities.membersCount", { count: community._count?.members || community.members || 0 })}</span>
                      </div>
                      {community.type && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#d6955b] text-white capitalize">
                          {community.type}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}