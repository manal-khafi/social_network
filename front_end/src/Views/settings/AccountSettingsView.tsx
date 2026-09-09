import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { logout } from "../../features/auth/authSlice";
import {
  ArrowLeft,
  Lock,
  Shield,
  LogOut,
  Trash2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Card } from "../../Components/ui/card";
import { Button } from "../../Components/ui/button";
import { Separator } from "../../Components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../Components/ui/dialog";
import { Input } from "../../Components/ui/input";
import { Textarea } from "../../Components/ui/textarea";
import { toast } from "sonner";

import ProfileEditorSection from "../../Components/Profile/ProfileEditorSection";
import api from "../../api/axios";
import { fetchCurrentUserProfile } from "../../features/user/userSlice";
import {
  getTwoFactorAuthStatus,
  setupTwoFactorAuth,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  reset2FAState,
} from "../../features/twoFactorAuth/twoFactorAuthSlice";

export default function AccountSettingsView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentUser, status: userStatus } = useAppSelector((state) => state.user);
  const {
    isEnabled: is2FAEnabled,
    qrCodeDataUrl,
    manualKey,
    status: twoFAStatus,
    error: twoFAError,
  } = useAppSelector((state) => state.twoFactorAuth);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(getTwoFactorAuthStatus());
  }, [dispatch]);

  // Load the profile if we landed here directly (currentUser only gets populated
  // when you visit your own profile otherwise -> blank page).
  useEffect(() => {
    if (!currentUser && userStatus !== "loading") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [currentUser, userStatus, dispatch]);

  const resetPasswordForm = () => {
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleSetup2FA = () => {
    dispatch(setupTwoFactorAuth());
  };

  const handleEnable2FA = async () => {
    if (twoFactorCode.length === 6) {
      const result = await dispatch(enableTwoFactorAuth(twoFactorCode));
      if (enableTwoFactorAuth.fulfilled.match(result)) {
        toast.success("2FA enabled successfully!");
        setShow2FADialog(false);
        dispatch(reset2FAState());
        setTwoFactorCode("");
      } else {
        toast.error((result as any).payload?.message || "Failed to enable 2FA");
      }
    } else {
      toast.error("Please enter a 6-digit code.");
    }
  };

  const handleDisable2FA = async () => {
    if (twoFactorCode.length === 6) {
      const result = await dispatch(disableTwoFactorAuth(twoFactorCode));
      if (disableTwoFactorAuth.fulfilled.match(result)) {
        toast.success("2FA disabled successfully!");
        setShow2FADialog(false);
        dispatch(reset2FAState());
        setTwoFactorCode("");
      } else {
        toast.error((result as any).payload?.message || "Failed to disable 2FA");
      }
    } else {
      toast.error("Please enter a 6-digit code.");
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("All fields are required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);

      await api.put("/account/me/password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      resetPasswordForm();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to change password";
      setPasswordError(String(msg));
      toast.error(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    setPasswordError("");

    if (!deactivatePassword) {
      setPasswordError("Password is required");
      return;
    }
    if (!deactivateReason.trim()) {
      toast.error("Please provide a reason for deactivation");
      return;
    }

    try {
      setIsSubmitting(true);

      await api.post("/account/me/deactivate", {
        password: deactivatePassword,
        reason: deactivateReason,
      });

      toast.success("Account deactivated");
      dispatch(logout());
      navigate("/login");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to deactivate account";
      setPasswordError(String(msg));
      toast.error(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setPasswordError("");

    if (!deletePassword) {
      setPasswordError("Password is required");
      return;
    }
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deletion");
      return;
    }

    try {
      setIsSubmitting(true);

      await api.delete("/account/me/delete", {
        data: { password: deletePassword, reason: deleteReason },
      });

      toast.success("Account deleted");
      dispatch(logout());
      navigate("/login");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to delete account";
      setPasswordError(String(msg));
      toast.error(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Account Settings</h1>
        </div>
      </div>

      {!currentUser ? (
        <div className="p-4 max-w-2xl mx-auto space-y-4">
          {userStatus === "failed" ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Couldn't load your account.{" "}
              <button
                className="text-primary underline"
                onClick={() => dispatch(fetchCurrentUserProfile())}
              >
                Retry
              </button>
            </Card>
          ) : (
            <>
              <div className="h-40 rounded-xl bg-muted animate-pulse" />
              <div className="h-32 rounded-xl bg-muted animate-pulse" />
              <div className="h-32 rounded-xl bg-muted animate-pulse" />
            </>
          )}
        </div>
      ) : (

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* reuse the Edit Profile UI here */}
        <ProfileEditorSection showCover={false} showSaveButton />

        {/* Security */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </h2>

          <button
            onClick={() => {
              setPasswordError("");
              setShowPasswordDialog(true);
            }}
            className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your password</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <Separator />

          <button
            onClick={() => {
              setTwoFactorCode("");
              setShow2FADialog(true);
            }}
            className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled ? "2FA is currently enabled" : "Add extra security to your account"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
            disabled={isSubmitting}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-orange-500 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => setShowDeactivateDialog(true)}
            disabled={isSubmitting}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Deactivate Account
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSubmitting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </Card>
      </div>
      )}

      {/* Change Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          setShowPasswordDialog(open);
          if (!open) resetPasswordForm();
        }}
      >
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
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className="bg-[#d6955b] hover:bg-[#c58549]"
              onClick={handleChangePassword}
              disabled={isSubmitting}
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog
        open={show2FADialog}
        onOpenChange={(open) => {
          setShow2FADialog(open);
          if (!open) {
            setTwoFactorCode("");
            dispatch(reset2FAState());
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{is2FAEnabled ? "Disable" : "Enable"} Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {is2FAEnabled
                ? "Enter the code from your authenticator app to disable 2FA."
                : "Scan the QR code with your authenticator app."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {is2FAEnabled ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Code</label>
                <Input
                  placeholder="Enter 6-digit code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                />
              </div>
            ) : qrCodeDataUrl ? (
              <div className="flex flex-col items-center space-y-4">
                <img src={qrCodeDataUrl} alt="2FA QR Code" />
                <p className="text-sm text-muted-foreground">Or enter this code manually:</p>
                <p className="text-lg font-semibold tracking-widest bg-muted p-2 rounded-md">{manualKey}</p>
                <div className="w-full space-y-2 pt-4">
                  <label className="text-sm font-medium">Verification Code</label>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Setup Steps:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Download an authenticator app (e.g., Google Authenticator).</li>
                  <li>Click "Continue" to generate a QR code.</li>
                  <li>Scan the QR code and enter the verification code.</li>
                </ol>
              </div>
            )}

            {twoFAStatus === "failed" && twoFAError && (
              <p className="text-xs text-destructive">{twoFAError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>

            {is2FAEnabled ? (
              <Button onClick={handleDisable2FA} variant="destructive">
                Disable
              </Button>
            ) : qrCodeDataUrl ? (
              <Button onClick={handleEnable2FA} className="bg-[#d6955b] hover:bg-[#c58549]">
                Verify & Enable
              </Button>
            ) : (
              <Button onClick={handleSetup2FA} className="bg-[#d6955b] hover:bg-[#c58549]">
                Continue
              </Button>
            )}
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
            <DialogDescription>Your account will be temporarily disabled</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm mb-2">When you deactivate your account:</p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside mb-4">
              <li>Your profile will be hidden from other users</li>
              <li>Your posts will not be visible</li>
              <li>You can reactivate anytime by logging in</li>
            </ul>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={deactivatePassword}
                onChange={(e) => {
                  setDeactivatePassword(e.target.value);
                  setPasswordError("");
                }}
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Why are you deactivating? <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Please tell us why you're deactivating your account..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">This helps us improve ANMOUGAR</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={isSubmitting}>
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
            <DialogDescription className="text-destructive">This action cannot be undone</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">⚠️ Warning</p>
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
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Why are you deleting? <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Please tell us why you're deleting your account..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">Your feedback is important to us</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
