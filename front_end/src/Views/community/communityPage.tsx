import { ArrowLeft, UserPlus, UserMinus, Users, TrendingUp, Hash, Settings, Upload, Image as ImageIcon, Palette, Shield, Check, X, Plus, Trash2, Edit2, Info, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCommunityById, getCommunityMembers, updateCommunity, getCommunityRequests, approveJoinRequest, rejectJoinRequest, getCommunityRules, createCommunityRule, updateCommunityRule, deleteCommunityRule, checkMembershipStatus, joinCommunity, leaveCommunity } from "../../api/axios";
import { storage } from "../../config/firebaseConfig";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { Button } from "../../Components/Community/communityButton";
import { Badge } from "../../Components/Community/communityBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/Community/communityTabs";
import { Card, CardContent } from "../../Components/Community/communityCard";
import { Avatar, AvatarImage, AvatarFallback } from "../../Components/Community/communityAvatar";
import { ScrollArea } from "../../Components/Community/communityScrollArea";
import { Input } from "../../Components/Community/communityInput";
import { Label } from "../../Components/Community/communityLabel";
import { Textarea } from "../../Components/Community/communityTextArea";
import { Switch } from "../../Components/Community/communitySwitch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/Community/communitySelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../Components/Community/communityDialog";
import { useAppSelector } from "../../hooks";
import { toast } from "sonner";

interface CommunityPageProps {
  communityId: string | number;
  onBack: () => void;
}

interface Member {
  id: string;
  userId?: string;
  name?: string;
  username?: string;
  followers?: number;
  avatar?: string;
  isVerified?: boolean;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string | null;
    is_verified?: boolean;
  };
  joinedAt?: string;
  role?: string;
}

interface Community {
  id: string;
  name: string;
  bio?: string;
  description?: string;
  avatar_url?: string;
  banner_url?: string;
  _count?: {
    members: number;
  };
  type?: string;
  createdAt?: string;
  is_private?: boolean;
  allow_posts?: boolean;
  require_approval?: boolean;
}

interface JoinRequest {
  id: string;
  user_id: string;
  community_id: string;
  message?: string;
  status: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface CommunityRule {
  id: string;
  title: string;
  description: string;
  order: number;
  community_id: string;
  created_at: string;
  updated_at: string;
}

export function CommunityPage({ communityId, onBack }: CommunityPageProps) {

  const authUser = useAppSelector((s) => s.auth.user);
  const authUserId = authUser?.id;


  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les paramètres
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [logoImagePreview, setLogoImagePreview] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);
  const [allowPosts, setAllowPosts] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [isAdmin] = useState(true);



  // Admin states
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [rules, setRules] = useState<CommunityRule[]>([]);
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [newRuleDescription, setNewRuleDescription] = useState("");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Join dialog states
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      if (!communityId) return;

      setLoading(true);
      try {
        // 1) community
        const communityRes = await getCommunityById(communityId);
        const c: Community =
          communityRes.data?.data || communityRes.data?.community || communityRes.data;

        if (!cancelled) {
          setCommunity(c);
          // init settings inputs
          setEditName(c?.name || "");
          setEditDescription(c?.bio || c?.description || "");
          setEditCategory(c?.type || "");
          setIsPublic(!(c?.is_private ?? false));
          setAllowPosts(c?.allow_posts ?? true);
          setRequireApproval(c?.require_approval ?? false);
        }

        // 2) members
        const membersRes = await getCommunityMembers(communityId);
        const membersData =
          membersRes.data?.data || membersRes.data?.members || membersRes.data || [];
        if (!cancelled) setMembers(Array.isArray(membersData) ? membersData : []);
      } catch (error) {
        console.error("Failed to fetch community page data:", error);
        if (!cancelled) setCommunity(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [communityId]);


  // Fetch community data from backend
  useEffect(() => {
    const checkMembership = async () => {
      if (!communityId || !authUserId) return;

      try {
        const response = await checkMembershipStatus(communityId, authUserId);
        const isMember = response.data?.isMember || false;
        setIsJoined(isMember);
      } catch (error) {
        console.error("Failed to check membership status:", error);
      }
    };

    checkMembership();
  }, [communityId, authUserId]);


  // Fetch join requests for admin
  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!isAdmin || !communityId) return;

      try {
        const response = await getCommunityRequests(communityId);
        const requestsData = response.data?.requests || response.data || [];
        // Filter only pending requests
        const pendingRequests = requestsData.filter((req: JoinRequest) => req.status === 'pending');
        setJoinRequests(pendingRequests);
      } catch (error) {
        console.error("Failed to fetch join requests:", error);
      }
    };

    fetchJoinRequests();
  }, [communityId, isAdmin]);



  // Fetch community rules
  useEffect(() => {
    const fetchRules = async () => {
      if (!communityId) return;

      try {
        const response = await getCommunityRules(communityId);
        const rulesData = response.data?.data || response.data || [];
        setRules(rulesData);
      } catch (error) {
        console.error("Failed to fetch community rules:", error);
      }
    };

    fetchRules();
  }, [communityId]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToFirebase = async (file: File, path: string): Promise<string> => {
    try {
      const fileRef = storageRef(storage, `communities/${path}/${Date.now()}-${uuidv4()}`);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (error) {
      console.error("Error uploading image to Firebase:", error);
      throw error;
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    try {
      await approveJoinRequest(communityId, requestId, userId);
      setJoinRequests(joinRequests.filter(req => req.id !== requestId));

      // Refresh members list
      const membersRes = await getCommunityMembers(communityId);
      const membersData = membersRes.data?.data || membersRes.data?.members || membersRes.data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);

      // Show success message
      toast.success("Request accepted");
    } catch (error) {
      console.error("Failed to approve request:", error);
      toast.error("Erreur lors de l'approbation de la demande");
    }
  };

  const handleRejectRequest = async (requestId: string, userId: string) => {
    try {
      await rejectJoinRequest(communityId, requestId, userId);
      setJoinRequests(joinRequests.filter(req => req.id !== requestId));
      toast.success("Request rejected");
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast.error("Erreur lors du rejet de la demande");
    }
  };

  const handleJoinLeave = async () => {
    try {
      if (!authUserId) {
        toast.error("You must be signed in to do that");
        return;
      }

      if (isJoined) {
        await leaveCommunity(communityId, authUserId);
        setIsJoined(false);
        toast.success("You left the community");

        const membersRes = await getCommunityMembers(communityId);
        const membersData =
          membersRes.data?.data || membersRes.data?.members || membersRes.data || [];
        setMembers(Array.isArray(membersData) ? membersData : []);
      } else {
        setShowJoinDialog(true);
      }
    } catch (error: any) {
      console.error("Failed to join/leave community:", error);
      const msg = error?.response?.data?.message || "Erreur lors de l'opération";
      toast.error(msg);
    }
  };

  const handleSubmitJoinRequest = async () => {
    try {
      if (!authUserId) {
        toast.error("You must be signed in to do that");
        return;
      }

      await joinCommunity(communityId, authUserId, joinMessage);

      setShowJoinDialog(false);
      setJoinMessage("");
      toast.success("Join request sent");
    } catch (error: any) {
      console.error("Failed to send join request:", error);
      const msg =
        error?.response?.data?.message || "Erreur lors de l'envoi de la demande";
      toast.error(msg);
    }
  };

  const handleAddRule = async () => {
    if (newRuleTitle.trim() && newRuleDescription.trim()) {
      try {
        const response = await createCommunityRule(communityId, {
          title: newRuleTitle,
          description: newRuleDescription,
          order: rules.length,
        });

        const newRule = response.data?.data || response.data;
        setRules([...rules, newRule]);
        setNewRuleTitle("");
        setNewRuleDescription("");
        toast.success("Rule added");
      } catch (error) {
        console.error("Failed to create rule:", error);
        toast.error("Failed to add the rule");
      }
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteCommunityRule(communityId, ruleId);
      setRules(rules.filter(rule => rule.id !== ruleId));
      toast.success("Rule deleted");
    } catch (error) {
      console.error("Failed to delete rule:", error);
      toast.error("Failed to delete the rule");
    }
  };

  const handleEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
  };

  const handleSaveRule = async (ruleId: string, newTitle: string, newDescription: string) => {
    try {
      const response = await updateCommunityRule(communityId, ruleId, {
        title: newTitle,
        description: newDescription,
      });

      const updatedRule = response.data?.data || response.data;
      setRules(rules.map(rule =>
        rule.id === ruleId ? updatedRule : rule
      ));
      setEditingRuleId(null);
      toast.success("Rule updated");
    } catch (error) {
      console.error("Failed to update rule:", error);
      toast.error("Failed to update the rule");
    }
  };

  const handleSaveSettings = async () => {
    if (!community) return;

    try {
      setIsSaving(true);

      let bannerUrl = community.banner_url;
      let avatarUrl = community.avatar_url;

      // Upload cover image if selected
      if (coverImageFile) {
        bannerUrl = await uploadImageToFirebase(coverImageFile, community.id);
      }

      // Upload logo image if selected
      if (logoImageFile) {
        avatarUrl = await uploadImageToFirebase(logoImageFile, community.id);
      }

      // Update community with new data and image URLs
      await updateCommunity(community.id, {
        name: editName,
        bio: editDescription,
        is_private: !isPublic,
        allow_posts: allowPosts,
        require_approval: requireApproval,
        banner_url: bannerUrl,
        avatar_url: avatarUrl,
        type: editCategory,
      });

      // Update local state
      setCommunity({
        ...community,
        name: editName,
        bio: editDescription,
        description: editDescription,
        banner_url: bannerUrl,
        avatar_url: avatarUrl,
        is_private: !isPublic,
        allow_posts: allowPosts,
        require_approval: requireApproval,
        type: editCategory,
      });

      // Clear file inputs
      const coverInput = document.getElementById("cover-upload") as HTMLInputElement;
      const logoInput = document.getElementById("logo-upload") as HTMLInputElement;
      if (coverInput) coverInput.value = "";
      if (logoInput) logoInput.value = "";
      setCoverImageFile(null);
      setLogoImageFile(null);
      setCoverImagePreview("");
      setLogoImagePreview("");

      toast.success("Community updated");
    } catch (error) {
      console.error("Failed to update community:", error);
      toast.error("Failed to update the community");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ecf8f6] flex items-center justify-center">
        <p className="text-gray-600">Chargement de la communauté...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#ecf8f6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Communauté non trouvée</p>
          <Button onClick={onBack} className="bg-[#d6955b] hover:bg-[#c5844a] text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ecf8f6]">
      {/* Header with Banner */}
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

      {/* Community Info */}
      <div className="px-3 sm:px-4 lg:px-8 py-8 pl-[70px] pr-[70px]">
        <div className="mb-4 sm:mb-8">
          <Card className="border-2 shadow-xl">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl border-4 border-white shadow-lg flex-shrink-0">
                      <AvatarImage src={community.avatar_url} alt={community.name} />
                      <AvatarFallback className="bg-gradient-to-br from-[#18534f] to-[#226d68] text-white text-2xl sm:text-3xl font-bold">
                        {community.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2 flex-wrap">
                        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">{community.name}</h1>
                        <Badge variant="secondary" className="bg-[#feeaa1] text-[#18534f] border-[#feeaa1] text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          {community.type || "No category"}
                        </Badge>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-4 line-clamp-2">{community.bio || community.description}</p>
                      <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>
                            <span className="font-semibold text-gray-900">{(community._count?.members || members.length).toLocaleString()}</span>{" "}
                            membres
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#d6955b]" />
                          <span className="font-semibold text-gray-900">Tendance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Join/Leave Button */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleJoinLeave}
                    className={
                      isJoined
                        ? "h-7 sm:h-8 px-2.5 sm:px-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-xs"
                        : "h-7 sm:h-8 px-2.5 sm:px-3 bg-[#d6955b] hover:bg-[#c5844a] text-white text-xs"
                    }
                  >
                    {isJoined ? (
                      <>
                        <UserMinus className="mr-1 h-3 w-3" />
                        Quitter
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-1 h-3 w-3" />
                        Rejoindre
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Join Request Dialog */}
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

        {/* Tabs */}
        <Tabs defaultValue="members" className="pb-12">
          <TabsList className={`w-full h-11 sm:h-12 bg-white border-2 shadow-sm grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="members" className="h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-[#18534f] data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Membres
            </TabsTrigger>
            <TabsTrigger value="about" className="h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-[#18534f] data-[state=active]:text-white">
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              À propos
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-[#18534f] data-[state=active]:text-white">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Admin
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="settings" className="h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-[#18534f] data-[state=active]:text-white">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Paramètres
              </TabsTrigger>
            )}
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-6">
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Membres ({members.length})
                  </h3>
                  <p className="text-sm text-gray-600">
                    Découvrez les membres de cette communauté
                  </p>
                </div>

                <ScrollArea className="h-[500px] pr-4">
                  {members.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600">Aucun membre pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {members.map((member) => {
                        const userName = member.user?.display_name || member.user?.username || member.name || "Utilisateur";
                        const initials = userName.substring(0, 2).toUpperCase();

                        return (
                          <Card key={member.id} className="group hover:shadow-md transition-all duration-300 hover:border-[#226d68]">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-14 w-14 border-2 border-gray-200 group-hover:border-[#226d68] transition-colors">
                                    <AvatarImage src={member.user?.avatar_url || member.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#18534f] to-[#226d68] text-white font-semibold">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900 group-hover:text-[#18534f] transition-colors">
                                        {userName}
                                      </h4>
                                      {member.role === 'ADMIN' && (
                                        <Badge variant="secondary" className="h-5 px-1.5 bg-[#feeaa1] text-[#18534f] text-xs">
                                          Admin
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">{member.user?.username ? `@${member.user.username}` : member.username}</p>
                                    {member.joinedAt && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Membre depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button variant="outline" className="border-2 border-[#226d68] text-[#18534f] hover:bg-[#ecf8f6] hover:border-[#18534f]">
                                  Suivre
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">À propos de {community.name}</h3>
                    <p className="text-gray-600 leading-relaxed">{community.bio || community.description}</p>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-3">Statistiques</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-[#ecf8f6] to-white border-[#226d68]">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-[#18534f]" />
                            <div>
                              <p className="text-2xl font-bold text-[#18534f]">
                                {(community._count?.members || members.length).toLocaleString()}
                              </p>
                              <p className="text-sm text-[#226d68]">Membres</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-[#feeaa1] to-white border-[#d6955b]">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Hash className="h-8 w-8 text-[#18534f]" />
                            <div>
                              <p className="text-2xl font-bold text-[#18534f]">{community.type || "No category"}</p>
                              <p className="text-sm text-[#226d68]">Catégorie</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-[#ecf8f6] to-white border-[#d6955b]">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-[#d6955b]" />
                            <div>
                              <p className="text-2xl font-bold text-[#18534f]">
                                {community.createdAt ? new Date(community.createdAt).toLocaleDateString('fr-FR') : "N/A"}
                              </p>
                              <p className="text-sm text-[#226d68]">Créée le</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-3">Règles de la communauté</h4>
                    <ul className="space-y-2 text-gray-600">
                      {rules.map((rule, index) => (
                        <li key={rule.id} className="flex items-start gap-2">
                          <span className="text-[#18534f] font-bold">{index + 1}.</span>
                          <span>{rule.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          {isAdmin && (
            <TabsContent value="admin" className="mt-6">
              <div className="space-y-6">
                {/* Join Requests Section */}
                <Card className="border-2">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">
                        Demandes d'adhésion ({joinRequests.length})
                      </h3>
                      <p className="text-sm text-gray-600">
                        Gérez les demandes de rejoindre la communauté
                      </p>
                    </div>

                    {joinRequests.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucune demande en attente</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {joinRequests.map((request) => {
                            const userName = request.user?.display_name || request.user?.username || "Utilisateur";
                            const userEmail = request.user?.email || "";
                            const userAvatar = request.user?.avatar_url;
                            const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase();

                            return (
                              <Card key={request.id} className="border-2 border-[#226d68]/20 hover:border-[#226d68] transition-colors">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                      <Avatar className="h-12 w-12 border-2 border-gray-200">
                                        <AvatarImage src={userAvatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-[#18534f] to-[#226d68] text-white font-semibold">
                                          {initials}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-semibold text-gray-900">
                                            {userName}
                                          </h4>
                                          <span className="text-sm text-gray-500">@{request.user?.username}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">
                                          {userEmail}
                                        </p>
                                        <p className="text-xs text-gray-500 mb-2">
                                          Demande envoyée le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                                        </p>
                                        {request.message && (
                                          <p className="text-sm text-gray-600 bg-[#ecf8f6] p-3 rounded-lg">
                                            {request.message}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveRequest(request.id, request.user_id)}
                                        className="bg-[#18534f] hover:bg-[#226d68] text-white"
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Accepter
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRejectRequest(request.id, request.user_id)}
                                        className="border-2 border-red-500 text-red-500 hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Refuser
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Community Rules Management Section */}
                <Card className="border-2">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">
                        Gestion des règles ({rules.length})
                      </h3>
                      <p className="text-sm text-gray-600">
                        Définissez et gérez les règles de votre communauté
                      </p>
                    </div>

                    {/* Add New Rule Form */}
                    <div className="mb-6 p-4 bg-[#ecf8f6] rounded-lg border-2 border-[#226d68]/20">
                      <h4 className="font-semibold mb-3 text-[#18534f]">Ajouter une nouvelle règle</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Titre de la règle
                          </label>
                          <Input
                            value={newRuleTitle}
                            onChange={(e) => setNewRuleTitle(e.target.value)}
                            placeholder="Ex: Respect"
                            className="border-2 border-[#226d68]/30 focus:border-[#18534f]"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Description
                          </label>
                          <Textarea
                            value={newRuleDescription}
                            onChange={(e) => setNewRuleDescription(e.target.value)}
                            placeholder="Describe the rule in detail..."
                            className="border-2 border-[#226d68]/30 focus:border-[#18534f] min-h-[80px]"
                          />
                        </div>
                        <Button
                          onClick={handleAddRule}
                          className="w-full bg-[#d6955b] hover:bg-[#c5844a] text-white"
                          disabled={!newRuleTitle.trim() || !newRuleDescription.trim()}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter la règle
                        </Button>
                      </div>
                    </div>

                    {/* Rules List */}
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {rules.map((rule, index) => (
                          <Card key={rule.id} className="border-2 border-[#226d68]/20 hover:border-[#226d68] transition-colors">
                            <CardContent className="p-4">
                              {editingRuleId === rule.id ? (
                                <EditRuleForm
                                  rule={rule}
                                  onSave={handleSaveRule}
                                  onCancel={() => setEditingRuleId(null)}
                                />
                              ) : (
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#18534f] text-white text-sm font-bold">
                                        {index + 1}
                                      </span>
                                      <h4 className="font-semibold text-gray-900">{rule.title}</h4>
                                    </div>
                                    <p className="text-sm text-gray-600 ml-8">{rule.description}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditRule(rule.id)}
                                      className="border-2 border-[#226d68] text-[#18534f] hover:bg-[#ecf8f6]"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteRule(rule.id)}
                                      className="border-2 border-red-500 text-red-500 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="space-y-4">
              {/* Informations de base */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-[#ecf8f6]">
                      <Hash className="h-5 w-5 text-[#18534f]" />
                    </div>
                    <h3 className="font-semibold text-lg">Informations de base</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-name" className="text-sm text-gray-700">Nom de la communauté</Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your community name"
                        className="h-10 border-2 focus:border-[#226d68]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-description" className="text-sm text-gray-700">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Describe your community..."
                        rows={3}
                        className="border-2 focus:border-[#226d68] resize-none"
                      />
                      <p className="text-xs text-gray-500">{editDescription.length} caractères</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-category" className="text-sm text-gray-700">Catégorie</Label>
                      <Select value={editCategory} onValueChange={setEditCategory}>
                        <SelectTrigger className="h-10 border-2 focus:border-[#226d68]">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="tech">Tech</SelectItem>
                          <SelectItem value="health">Santé</SelectItem>
                          <SelectItem value="education">Éducation</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="entertainment">Divertissement</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="arts">Arts</SelectItem>
                          <SelectItem value="travel">Voyage</SelectItem>
                          <SelectItem value="food">Cuisine</SelectItem>
                          <SelectItem value="lifestyle">Style de vie</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Apparence */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-[#feeaa1]">
                      <Palette className="h-5 w-5 text-[#18534f]" />
                    </div>
                    <h3 className="font-semibold text-lg">Apparence</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Image de couverture */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">Image de couverture</Label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-full h-24 rounded-lg border-2 border-dashed border-[#226d68] bg-gray-50 overflow-hidden">
                            {coverImagePreview ? (
                              <img src={coverImagePreview} alt="Aperçu couverture" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="h-8 w-8 text-[#226d68]" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor="cover-upload"
                            className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-[#226d68] rounded-lg hover:bg-[#ecf8f6] transition-colors text-[#18534f] text-sm"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Modifier</span>
                          </Label>
                          <input
                            id="cover-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleCoverImageChange}
                            className="hidden"
                          />
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG (max. 5MB)</p>
                        </div>
                      </div>
                    </div>

                    {/* Logo */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">Logo de la communauté</Label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#226d68] bg-gray-50 overflow-hidden flex items-center justify-center">
                            {logoImagePreview ? (
                              <img src={logoImagePreview} alt="Aperçu logo" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#18534f] to-[#226d68] flex items-center justify-center text-white text-2xl font-bold">
                                {editName.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor="logo-upload"
                            className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-[#226d68] rounded-lg hover:bg-[#ecf8f6] transition-colors text-[#18534f] text-sm"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Modifier</span>
                          </Label>
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoImageChange}
                            className="hidden"
                          />
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG (max. 2MB)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Confidentialité & Paramètres */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-[#ecf8f6]">
                      <Shield className="h-5 w-5 text-[#18534f]" />
                    </div>
                    <h3 className="font-semibold text-lg">Confidentialité & Paramètres</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex-1">
                        <Label htmlFor="public-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                          Communauté publique
                        </Label>
                        <p className="text-xs text-gray-500 mt-0.5">Visible par tous les utilisateurs</p>
                      </div>
                      <Switch
                        id="public-toggle"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                        className="data-[state=checked]:bg-[#18534f]"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex-1">
                        <Label htmlFor="posts-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                          Autoriser les publications
                        </Label>
                        <p className="text-xs text-gray-500 mt-0.5">Les membres peuvent publier du contenu</p>
                      </div>
                      <Switch
                        id="posts-toggle"
                        checked={allowPosts}
                        onCheckedChange={setAllowPosts}
                        className="data-[state=checked]:bg-[#18534f]"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex-1">
                        <Label htmlFor="approval-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                          Approbation requise
                        </Label>
                        <p className="text-xs text-gray-500 mt-0.5">Valider les publications avant affichage</p>
                      </div>
                      <Switch
                        id="approval-toggle"
                        checked={requireApproval}
                        onCheckedChange={setRequireApproval}
                        className="data-[state=checked]:bg-[#18534f]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Aperçu */}
              {(editName !== community.name || editDescription !== (community.bio || community.description)) && (
                <Card className="border-2 border-[#d6955b] bg-gradient-to-br from-[#feeaa1]/20 to-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-[#feeaa1]">
                        <TrendingUp className="h-5 w-5 text-[#18534f]" />
                      </div>
                      <h3 className="font-semibold text-lg">Aperçu des modifications</h3>
                    </div>

                    <Card className="border-2 border-[#226d68]">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#18534f] to-[#226d68] flex items-center justify-center text-white text-xl font-bold shadow">
                            {editName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{editName}</h4>
                              <Badge variant="secondary" className="bg-[#feeaa1] text-[#18534f] text-xs">
                                <Hash className="h-3 w-3 mr-1" />
                                {editCategory || "No category"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{editDescription}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              )}

              {/* Boutons d'action */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#226d68] p-4 z-50">
                <div className="max-w-7xl mx-auto flex gap-3 px-[70px]">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 border-2 border-[#226d68] text-[#18534f] hover:bg-[#ecf8f6]"
                    onClick={() => {
                      if (community) {
                        setEditName(community.name || "");
                        setEditDescription(community.bio || community.description || "");
                        setEditCategory(community.type || "");
                      }
                      setCoverImagePreview("");
                      setLogoImagePreview("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex-1 h-11 bg-[#d6955b] hover:bg-[#c5844a] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "En cours..." : "Sauvegarder"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Edit Rule Form Component
function EditRuleForm({
  rule,
  onSave,
  onCancel
}: {
  rule: CommunityRule;
  onSave: (id: string, title: string, description: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(rule.title);
  const [description, setDescription] = useState(rule.description);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Titre</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-2 border-[#226d68]/30 focus:border-[#18534f]"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-2 border-[#226d68]/30 focus:border-[#18534f] min-h-[80px]"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSave(rule.id, title, description)}
          className="flex-1 bg-[#18534f] hover:bg-[#226d68] text-white"
          disabled={!title.trim() || !description.trim()}
        >
          <Check className="h-4 w-4 mr-1" />
          Sauvegarder
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-2"
        >
          <X className="h-4 w-4 mr-1" />
          Annuler
        </Button>
      </div>
    </div>
  );
}

// Wrapper component to read route params and provide a fallback back-navigation
export function CommunityPageWrapper({ onBack }: { onBack?: () => void }) {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();

  if (!communityId) {
    return (
      <div className="min-h-screen bg-[#ecf8f6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Communauté non trouvée</p>
          <Button onClick={() => navigate('/community/list')} className="bg-[#d6955b] hover:bg-[#c5844a] text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux communautés
          </Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (onBack) return onBack();
    navigate(-1);
  };

  return <CommunityPage communityId={communityId} onBack={handleBack} />;
}
