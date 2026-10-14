import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { logout, logoutUser } from "../../features/auth/authSlice";
import { PATHS } from "../../routes/paths";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../Components/ui/alert-dialog";
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


import { firebaseSignOut } from "../../config/firebaseConfig";
import { useTranslation } from "react-i18next";

export default function AccountSettingsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentUser, status: userStatus } = useAppSelector((state) => state.user);
  const isLoggingOut = useAppSelector((state) => state.auth.isLoggingOut);
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
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  // Last "are you sure?" step before the request is sent.
  const [confirmAction, setConfirmAction] = useState<"deactivate" | "delete" | null>(null);
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
  // Also reload when has_password is unknown (profile loaded by another screen).
  useEffect(() => {
    if ((!currentUser || currentUser.has_password === undefined) && userStatus !== "loading") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [currentUser, userStatus, dispatch]);

  // Google accounts have no password to confirm with.
  const requiresPassword = currentUser?.has_password !== false;

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
        toast.success(t("account.2faEnabledSuccessfully"));
        setShow2FADialog(false);
        dispatch(reset2FAState());
        setTwoFactorCode("");
      } else {
        toast.error((result as any).payload?.message || t("account.failedToEnable2fa"));
      }
    } else {
      toast.error(t("account.pleaseEnterA6DigitCode"));
    }
  };

  const handleDisable2FA = async () => {
    if (twoFactorCode.length === 6) {
      const result = await dispatch(disableTwoFactorAuth(twoFactorCode));
      if (disableTwoFactorAuth.fulfilled.match(result)) {
        toast.success(t("account.2faDisabledSuccessfully"));
        setShow2FADialog(false);
        dispatch(reset2FAState());
        setTwoFactorCode("");
      } else {
        toast.error((result as any).payload?.message || t("account.failedToDisable2fa"));
      }
    } else {
      toast.error(t("account.pleaseEnterA6DigitCode"));
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError(t("account.allFieldsAreRequired"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t("account.newPasswordMustBeAtLeast"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t("auth.passwordsDontMatch"));
      return;
    }

    try {
      setIsSubmitting(true);

      await api.put("/account/me/password", {
        currentPassword,
        newPassword,
      });

      toast.success(t("account.passwordChangedSuccessfully"));
      setShowPasswordDialog(false);
      resetPasswordForm();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || t("account.failedToChangePassword");
      setPasswordError(String(msg));
      toast.error(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** The session is gone on the server: drop it here and go to the sign-in screen. */
  const leaveAccount = () => {
    firebaseSignOut().catch(() => undefined);
    dispatch(logout());
    navigate(PATHS.AUTH, { replace: true });
  };

  // Form step: validate, then ask for a final confirmation.
  const reviewDeactivate = () => {
    setPasswordError("");
    if (requiresPassword && !deactivatePassword) {
      setPasswordError(t("account.passwordIsRequired"));
      return;
    }
    if (!deactivateReason.trim()) {
      toast.error(t("account.pleaseProvideAReasonForDeactivation"));
      return;
    }
    setConfirmAction("deactivate");
  };

  const reviewDelete = () => {
    setPasswordError("");
    if (requiresPassword && !deletePassword) {
      setPasswordError(t("account.passwordIsRequired"));
      return;
    }
    if (!deleteReason.trim()) {
      toast.error(t("account.pleaseProvideAReasonForDeletion"));
      return;
    }
    if (deleteConfirmText.trim() !== currentUser?.username) {
      toast.error(t("account.typeUsernameToConfirm", { username: currentUser?.username ?? "" }));
      return;
    }
    setConfirmAction("delete");
  };

  const handleDeactivate = async () => {
    try {
      setIsSubmitting(true);

      await api.post("/account/me/deactivate", {
        ...(requiresPassword && { password: deactivatePassword }),
        reason: deactivateReason,
      });

      toast.success(t("account.accountDeactivatedSignedOut"));
      setShowDeactivateDialog(false);
      leaveAccount();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || t("account.failedToDeactivateAccount");
      setPasswordError(String(msg));
      toast.error(String(msg));
    } finally {
      setIsSubmitting(false);
      setConfirmAction(null);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);

      await api.delete("/account/me/delete", {
        data: { ...(requiresPassword && { password: deletePassword }), reason: deleteReason },
      });

      toast.success(t("account.accountDeleted"));
      setShowDeleteDialog(false);
      leaveAccount();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || t("account.failedToDeleteAccount");
      setPasswordError(String(msg));
      toast.error(String(msg));
    } finally {
      setIsSubmitting(false);
      setConfirmAction(null);
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
          <h1 className="text-xl font-bold">{t("account.accountSettings")}</h1>
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
                {t("account.retry")}
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
            {t("account.security")}
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
              <div className="text-start">
                <p className="font-medium">{t("account.changePassword")}</p>
                <p className="text-sm text-muted-foreground">{t("account.updateYourPassword")}</p>
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
              <div className="text-start">
                <p className="font-medium">{t("account.twoFactorAuthentication")}</p>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled ? "2FA is currently enabled" : t("account.addExtraSecurityToYourAccount")}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </Card>

        {/* Account Actions */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">{t("account.accountActions")}</h2>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              dispatch(logoutUser()).then(() => navigate(PATHS.AUTH, { replace: true }));
            }}
            disabled={isSubmitting || isLoggingOut}
          >
            <LogOut className="w-4 h-4 me-2" />
            {t("account.logout")}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-orange-500 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => setShowDeactivateDialog(true)}
            disabled={isSubmitting}
          >
            <AlertCircle className="w-4 h-4 me-2" />
            {t("account.deactivateAccount")}
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSubmitting}
          >
            <Trash2 className="w-4 h-4 me-2" />
            {t("account.deleteAccount")}
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
            <DialogTitle>{t("account.changePassword")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("account.currentPassword")}</label>
              <Input
                type="password"
                placeholder={t("account.enterCurrentPassword")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("account.newPassword")}</label>
              <Input
                type="password"
                placeholder={t("account.enterNewPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("account.confirmNewPassword2")}</label>
              <Input
                type="password"
                placeholder={t("account.confirmNewPassword")}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={isSubmitting}>
              {t("actions.cancel")}
            </Button>
            <Button
              className="bg-[#d6955b] hover:bg-[#c58549]"
              onClick={handleChangePassword}
              disabled={isSubmitting}
            >
              {t("account.updatePassword")}
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
            <DialogTitle>{is2FAEnabled ? t("account.disable2faTitle") : t("account.enable2faTitle")}</DialogTitle>
            <DialogDescription>
              {is2FAEnabled
                ? t("account.enterTheCodeFromYourAuthenticator")
                : t("account.scanTheQrCodeWithYour")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {is2FAEnabled ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("account.verificationCode")}</label>
                <Input
                  placeholder={t("account.enter6DigitCode")}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                />
              </div>
            ) : qrCodeDataUrl ? (
              <div className="flex flex-col items-center space-y-4">
                <img src={qrCodeDataUrl} alt={t("account.2faQrCode")} />
                <p className="text-sm text-muted-foreground">{t("account.orEnterThisCodeManually")}</p>
                <p className="text-lg font-semibold tracking-widest bg-muted p-2 rounded-md">{manualKey}</p>
                <div className="w-full space-y-2 pt-4">
                  <label className="text-sm font-medium">{t("account.verificationCode")}</label>
                  <Input
                    placeholder={t("account.enter6DigitCode")}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">{t("account.setupSteps")}</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>{t("account.downloadAnAuthenticatorAppEG")}</li>
                  <li>{t("account.clickContinueToGenerateAQr")}</li>
                  <li>{t("account.scanTheQrCodeAndEnter")}</li>
                </ol>
              </div>
            )}

            {twoFAStatus === "failed" && twoFAError && (
              <p className="text-xs text-destructive">{twoFAError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              {t("actions.cancel")}
            </Button>

            {is2FAEnabled ? (
              <Button onClick={handleDisable2FA} variant="destructive">
                {t("account.disable")}
              </Button>
            ) : qrCodeDataUrl ? (
              <Button onClick={handleEnable2FA} className="bg-[#d6955b] hover:bg-[#c58549]">
                {t("account.verifyEnable")}
              </Button>
            ) : (
              <Button onClick={handleSetup2FA} className="bg-[#d6955b] hover:bg-[#c58549]">
                {t("account.continue")}
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
            <DialogTitle>{t("account.deactivateAccount")}</DialogTitle>
            <DialogDescription>{t("account.yourAccountWillBeTemporarilyDisabled")}</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm mb-2">{t("account.whenYouDeactivateYourAccount")}</p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside mb-4">
              <li>{t("account.yourProfileWillBeHiddenFrom")}</li>
              <li>{t("account.yourPostsWillNotBeVisible")}</li>
              <li>{t("account.youCanReactivateAnytimeByLogging")}</li>
            </ul>

            {requiresPassword && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("account.confirmPasswordLabel")} <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                placeholder={t("account.enterYourPassword")}
                value={deactivatePassword}
                onChange={(e) => {
                  setDeactivatePassword(e.target.value);
                  setPasswordError("");
                }}
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("account.whyDeactivating")} <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder={t("account.pleaseTellUsWhyYoureDeactivating")}
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">{t("account.thisHelpsUsImproveAnmougar")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)} disabled={isSubmitting}>
              {t("actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={reviewDeactivate} disabled={isSubmitting}>
              {t("account.deactivateAccount")}
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
            setDeleteConfirmText("");
            setPasswordError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("account.deleteAccount")}</DialogTitle>
            <DialogDescription className="text-destructive">{t("account.thisActionCannotBeUndone")}</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">{t("account.warning")}</p>
              <p className="text-sm text-muted-foreground">
                {t("account.thisActionIsPermanentAndCannot")}
              </p>
            </div>

            <p className="text-sm mb-2">{t("account.whenYouDeleteYourAccount")}</p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside mb-4">
              <li>{t("account.allYourDataWillBePermanently")}</li>
              <li>{t("account.yourPostsMessagesAndMediaWill")}</li>
              <li>{t("account.thisCannotBeUndoneOrReversed")}</li>
            </ul>

            {requiresPassword && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("account.confirmPasswordLabel")} <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                placeholder={t("account.enterYourPassword")}
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setPasswordError("");
                }}
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("account.whyDeleting")} <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder={t("account.pleaseTellUsWhyYoureDeleting")}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">{t("account.yourFeedbackIsImportantToUs")}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("account.typeUsernameToConfirm", { username: currentUser?.username ?? "" })}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={currentUser?.username ?? ""}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSubmitting}>
              {t("actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={reviewDelete}
              disabled={isSubmitting || deleteConfirmText.trim() !== currentUser?.username}
            >
              {t("account.deletePermanently")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final confirmation for deactivate / delete */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && !isSubmitting && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "delete" ? t("account.confirmDeleteTitle") : t("account.confirmDeactivateTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "delete"
                ? t("account.confirmDeleteDescription")
                : t("account.confirmDeactivateDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault(); // stay open until the request finishes
                if (confirmAction === "delete") handleDelete();
                else handleDeactivate();
              }}
            >
              {confirmAction === "delete" ? t("account.deletePermanently") : t("account.deactivateAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
