import { ArrowLeft, Upload, Image as ImageIcon, Loader2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../Components/Community/communityButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../Components/Community/communityCard";
import { Input } from "../../Components/Community/communityInput";
import { Label } from "../../Components/Community/communityLabel";
import { Textarea } from "../../Components/Community/communityTextArea";
import { toast } from "sonner";
import { createCommunity } from "../../api/axios";
import { storage } from "../../config/firebaseConfig";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const COMMUNITY_TYPES = [
  "tech",
  "health",
  "education",
  "sports",
  "entertainment",
  "business",
  "arts",
  "travel",
  "food",
  "lifestyle",
  "other",
];

export function CreateCommunity() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [type, setType] = useState("other");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !bio.trim()) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl: string | undefined;
      let avatarUrl: string | undefined;

      if (imageFile) {
        const refImg = storageRef(storage, `communities/${uuidv4()}-banner`);
        await uploadBytes(refImg, imageFile);
        imageUrl = await getDownloadURL(refImg);
      }

      if (avatarFile) {
        const refAvatar = storageRef(storage, `communities/${uuidv4()}-avatar`);
        await uploadBytes(refAvatar, avatarFile);
        avatarUrl = await getDownloadURL(refAvatar);
      }

      const response = await createCommunity({
        name,
        bio,
        type,
        image: imageUrl,
        avatar: avatarUrl,
      });

      // ✅ robust ID extraction (works with any backend shape)
      const communityId =
        response?.data?.id ??
        response?.data?.community?.id ??
        response?.data?.data?.id ??
        response?.data?.data?.community?.id;

      if (!communityId) {
        console.log("Create community response:", response?.data);
        toast.error("Community created but ID not returned by API");
        return;
      }

      toast.success("Community created!");
      navigate(`/home/community/${communityId}`, { replace: true });
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to create the community"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#ecf8f6]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#ecf8f6]/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/home/community/list")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#18534f]">
              Créer une communauté
            </h1>
            <p className="text-sm text-gray-600">
              Partagez votre passion avec le monde
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border-2 shadow-xl bg-[#ecf8f6]">
          <CardHeader>
            <CardTitle>Informations de la communauté</CardTitle>
            <CardDescription>
              Remplissez les informations ci-dessous
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Nom *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>

              <div ref={dropdownRef} className="relative">
                <Label>Catégorie *</Label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-12 border-2 rounded-lg flex justify-between px-4"
                >
                  {type}
                  <ChevronDown />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 bg-white border rounded w-full">
                    {COMMUNITY_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t);
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/home/community/list")}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Create community"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
