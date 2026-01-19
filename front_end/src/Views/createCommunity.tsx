import { ArrowLeft, Upload, Image as ImageIcon, Loader2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Componenets/Community/communityButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Componenets/Community/communityCard";
import { Input } from "../Componenets/Community/communityInput";
import { Label } from "../Componenets/Community/communityLabel";
import { Textarea } from "../Componenets/Community/communityTextArea";
import { toast } from "react-toastify";
import { createCommunity } from "../api/axios";import { storage } from "../config/firebaseConfig";
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
  const [imagePreview, setImagePreview] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        const timestamp = new Date().getTime();
        const fileName = `${name}-banner-${timestamp}-${uuidv4()}`;
        const imageRef = storageRef(storage, `YassineKaoubia/${fileName}`);
        
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      if (avatarFile) {
        const timestamp = new Date().getTime();
        const fileName = `${name}-avatar-${timestamp}-${uuidv4()}`;
        const avatarRef = storageRef(storage, `YassineKaoubia/${fileName}`);
        
        await uploadBytes(avatarRef, avatarFile);
        avatarUrl = await getDownloadURL(avatarRef);
      }
      
      const response = await createCommunity({ 
        name, 
        bio,
        type,
        image: imageUrl || undefined,
        avatar: avatarUrl || undefined
      });
      
      if (response?.data) {
        toast.success("Communauté créée avec succès!");
        setName("");
        setBio("");
        setType("other");
        setImageFile(null);
        setImagePreview("");
        setAvatarFile(null);
        setAvatarPreview("");
        const communityId = response.data.id;
        setTimeout(() => navigate(`/community/${communityId}`), 1500);
      }
    } catch (error: any) {
      console.error("Erreur lors de la création de la communauté:", error);
      toast.error(error?.response?.data?.message || "Erreur lors de la création de la communauté");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#ecf8f6]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#ecf8f6]/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/community")} className="hover:bg-[#226d68]/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#18534f]">
                Créer une communauté
              </h1>
              <p className="text-sm text-gray-600 mt-1">Partagez votre passion avec le monde</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-2 shadow-xl bg-[#ecf8f6]">
          <CardHeader>
            <CardTitle className="text-2xl">Informations de la communauté</CardTitle>
            <CardDescription>
              Remplissez les informations ci-dessous pour créer votre communauté
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 relative">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="text-base font-semibold">
                  Avatar de la communauté
                </Label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-[#226d68] flex items-center justify-center bg-gray-50 overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-[#226d68]" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="avatar-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#226d68] rounded-lg hover:bg-[#ecf8f6] hover:border-[#18534f] transition-colors text-[#18534f]"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="font-medium">Télécharger un avatar</span>
                    </Label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG ou GIF (max. 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-base font-semibold">
                  Image de la communauté (Bannière)
                </Label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-[#226d68] flex items-center justify-center bg-gray-50 overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-[#226d68]" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#226d68] rounded-lg hover:bg-[#ecf8f6] hover:border-[#18534f] transition-colors text-[#18534f]"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="font-medium">Télécharger une image</span>
                    </Label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG ou GIF (max. 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">
                  Nom de la communauté *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: DakarTech, AfricaArt..."
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  required
                  className="h-12 text-base border-2 focus:border-[#226d68]"
                />
                <p className="text-sm text-gray-500">Choisissez un nom unique et mémorable</p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-base font-semibold">
                  Description *
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Décrivez votre communauté, ses objectifs et ce qui la rend unique..."
                  value={bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                  required
                  rows={6}
                  className="text-base border-2 focus:border-[#226d68] resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Décrivez votre communauté</p>
                  <p className="text-sm text-gray-500">{bio.length} / 500</p>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-base font-semibold">
                  Catégorie de la communauté *
                </Label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-12 px-4 border-2 border-[#226d68] rounded-lg focus:outline-none focus:border-[#18534f] bg-[#ecf8f6] text-base text-[#18534f] flex items-center justify-between cursor-pointer hover:border-[#18534f] transition-colors"
                  >
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-[#226d68] rounded-lg shadow-lg z-50 overflow-hidden">
                      {COMMUNITY_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setType(t);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-[#ecf8f6] transition-colors capitalize ${
                            type === t ? 'bg-[#226d68]/20 text-[#18534f] font-semibold' : 'text-[#18534f]'
                          }`}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">Choisissez la catégorie qui correspond le mieux à votre communauté</p>
              </div>

              {/* Preview Card */}
              {name && bio && (
                <div className="space-y-2 pt-4">
                  <Label className="text-base font-semibold">Aperçu</Label>
                  <Card className="border-2 border-[#226d68] bg-[#ecf8f6]">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#18534f]">{name}</CardTitle>
                      <CardDescription>{bio}</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/community")}
                  disabled={isLoading}
                  className="flex-1 h-12 text-base border-2 border-[#226d68] text-[#18534f] hover:bg-[#ecf8f6] focus:outline-none focus:ring-2 focus:ring-[#226d68] focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 hover:shadow-md"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() || !bio.trim() || isLoading}
                  className={`flex-1 h-12 text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    isLoading
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg scale-105"
                      : "bg-[#c5844a] hover:bg-[#d6955b] text-white hover:shadow-lg"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    "Créer la communauté"
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