import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks";
import { logout } from "../../features/auth/authSlice";
import {
  ArrowLeft,
  Camera,
  Mail,
  Phone,
  Lock,
  Shield,
  LogOut,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card } from "../../Components/ui/card";
import { Input } from "../../Components/ui/input";
import { Textarea } from "../../Components/ui/textarea";
import { Button } from "../../Components/ui/button";
import { Switch } from "../../Components/ui/switch";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../Components/ui/avatar";
import { Separator } from "../../Components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../Components/ui/dialog";
import { toast } from "sonner";
import {
  getAccount,
  updateAccount,
  changePassword,
  toggleActive,
  deleteAccount,
  type AccountSettings,
} from "../../api/settingsApi";

export default function AccountSettingsView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accountData, setAccountData] = useState<AccountSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    display_name: "",
    username: "",
    bio: "",
    email: "",
    gender: "",
    date_of_birth: "",
    account_name: "",
    adresse: "",
  });

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Deactivate/Delete form state
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Fetch account data on mount
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const data = await getAccount();
        setAccountData(data);
        setFormData({
          display_name: data.display_name || "",
          username: data.username || "",
          bio: data.bio || "",
          email: data.email || "",
          gender: data.gender || "",
          date_of_birth: data.date_of_birth || "",
          account_name: data.account_name || "",
          adresse: data.adresse || "",
        });
      } catch (error) {
        toast.error("Failed to load account settings");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateAccount(formData);
      setHasUnsavedChanges(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement actual image upload
      toast.success("Profile picture updated");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to change password");
      console.error(error);
    }
  };

  const handleDeactivate = async () => {
    setPasswordError("");

    if (!deactivateReason.trim()) {
      toast.error("Please provide a reason for deactivation");
      return;
    }

    try {
      await toggleActive();
      toast.success("Account deactivated");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      toast.error("Failed to deactivate account");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    setPasswordError("");

    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deletion");
      return;
    }

    try {
      await deleteAccount(deletePassword, deleteReason);
      toast.success("Account deleted");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!accountData) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Account Settings</h1>
        </div>
        {hasUnsavedChanges && (
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-[#d6955b] hover:bg-[#c58549]"
          >
            Save Changes
          </Button>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Profile Picture */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Profile Picture</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={accountData.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl">
                  {accountData.username[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Upload a new profile picture. Recommended size: 400x400px
              </p>
            </div>
          </div>
        </Card>

        {/* Basic Information */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={formData.display_name}
              onChange={(e) =>
                handleInputChange("display_name", e.target.value)
              }
              placeholder="Enter your display name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="@username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about yourself"
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Input
              value={formData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              placeholder="Gender"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date of Birth</label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) =>
                handleInputChange("date_of_birth", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input
              value={formData.adresse}
              onChange={(e) => handleInputChange("adresse", e.target.value)}
              placeholder="Your address"
            />
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Contact Information</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formData.email}</p>
                  <p className="text-sm text-muted-foreground">Email address</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">Verified</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Not added</p>
                  <p className="text-sm text-muted-foreground">Phone number</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Add Phone
              </Button>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </h2>

          <button
            onClick={() => setShowPasswordDialog(true)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">
                  Update your password
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <Separator />

          <button
            onClick={() => setShow2FADialog(true)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add extra security to your account
                </p>
              </div>
            </div>
          </button>
        </Card>

        {/* Account Actions */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Account Actions</h2>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              dispatch(logout());
              navigate("/login");
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-orange-500 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => setShowDeactivateDialog(true)}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Deactivate Account
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Confirm New Password
              </label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#d6955b] hover:bg-[#c58549]"
              onClick={handlePasswordChange}
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Add an extra layer of security to your account
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm">
              Two-factor authentication adds an additional layer of security to
              your account by requiring more than just a password to log in.
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Setup Steps:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Download an authenticator app</li>
                <li>Scan the QR code</li>
                <li>Enter the verification code</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button className="bg-[#d6955b] hover:bg-[#c58549]">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Account Dialog */}
      <Dialog
        open={showDeactivateDialog}
        onOpenChange={(open) => {
          setShowDeactivateDialog(open);
          if (!open) {
            setDeactivatePassword("");
            setDeactivateReason("");
            setPasswordError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Account</DialogTitle>
            <DialogDescription>
              Your account will be temporarily disabled
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm mb-2">When you deactivate your account:</p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside mb-4">
              <li>Your profile will be hidden from other users</li>
              <li>Your posts will not be visible</li>
              <li>You can reactivate anytime by logging in</li>
            </ul>

            {hasUnsavedChanges && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                <p className="text-sm text-orange-800">
                  ⚠️ You have unsaved changes that will be lost
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Why are you deactivating?{" "}
                <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Please tell us why you're deactivating your account..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This helps us improve ANMOUGAR
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivate}>
              Deactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeletePassword("");
            setDeleteReason("");
            setPasswordError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription className="text-destructive">
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">
                ⚠️ Warning
              </p>
              <p className="text-sm text-muted-foreground">
                This action is permanent and cannot be reversed
              </p>
            </div>

            <p className="text-sm mb-2">When you delete your account:</p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside mb-4">
              <li>All your data will be permanently deleted</li>
              <li>Your posts, messages, and media will be removed</li>
              <li>This cannot be undone or reversed</li>
            </ul>

            {hasUnsavedChanges && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                <p className="text-sm text-orange-800">
                  ⚠️ You have unsaved changes that will be lost
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setPasswordError("");
                }}
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Why are you deleting?{" "}
                <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Please tell us why you're deleting your account..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your feedback is important to us
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
