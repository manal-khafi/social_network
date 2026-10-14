import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { getCommunityById, getCommunityMembers, updateCommunity, getCommunityRequests, approveJoinRequest, rejectJoinRequest, getCommunityRules, createCommunityRule, updateCommunityRule, deleteCommunityRule, checkMembershipStatus, joinCommunity, leaveCommunity } from "../../api/axios";
import { storage } from "../../config/firebaseConfig";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { useAppSelector } from "../../hooks";
import { toast } from "sonner";
import type { Community, CommunityRule, JoinRequest, Member } from "./types";

/**
 * All data, form state and actions of the community page: loads the community,
 * its members, join requests and rules, and exposes the handlers the tab
 * components call. Form state lives here (not in the tabs) so unsaved edits
 * survive switching between tabs.
 */
export function useCommunityPage(communityId: string | number) {
  const authUser = useAppSelector((s) => s.auth.user);
  const authUserId = authUser?.id;


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

  return {
    community, members, loading, isJoined, isAdmin,
    showJoinDialog, setShowJoinDialog, joinMessage, setJoinMessage, handleJoinLeave, handleSubmitJoinRequest,
    joinRequests, handleApproveRequest, handleRejectRequest,
    rules, newRuleTitle, setNewRuleTitle, newRuleDescription, setNewRuleDescription, editingRuleId, setEditingRuleId, handleAddRule, handleDeleteRule, handleEditRule, handleSaveRule,
    editName, setEditName, editDescription, setEditDescription, editCategory, setEditCategory, coverImagePreview, setCoverImagePreview, logoImagePreview, setLogoImagePreview, isPublic, setIsPublic, allowPosts, setAllowPosts, requireApproval, setRequireApproval, isSaving, setCoverImageFile, setLogoImageFile, handleCoverImageChange, handleLogoImageChange, handleSaveSettings,
  };
}
