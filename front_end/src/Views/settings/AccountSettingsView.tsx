import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { updateProfile, togglePrivacy } from '../../features/user/userSlice';
import { logout } from '../../features/auth/authSlice';
import { ArrowLeft, Camera, Mail, Phone, Lock, Shield, LogOut, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';

export default function AccountSettingsView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    username: currentUser?.username || '',
    bio: currentUser?.bio || '',
    website: '',
    email: currentUser?.email || '',
    phone: ''
  });
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Deactivate/Delete form state
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };
  
  const handleSave = () => {
    if (currentUser) {
      dispatch(updateProfile({
        fullName: formData.fullName,
        username: formData.username,
        bio: formData.bio,
      }));
      setHasUnsavedChanges(false);
      toast.success('Profile updated successfully');
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate image upload
      toast.success('Profile picture updated');
    }
  };
  
  const handleDeactivate = () => {
    // Reset error
    setPasswordError('');
    
    // Validate password (simulated - in real app would check against actual password)
    if (deactivatePassword !== 'password') { // Mock password check
      setPasswordError('Incorrect password');
      return;
    }
    
    if (!deactivateReason.trim()) {
      toast.error('Please provide a reason for deactivation');
      return;
    }
    
    toast.success('Account deactivated');
    dispatch(logout());
    navigate('/login');
  };
  
  const handleDelete = () => {
    // Reset error
    setPasswordError('');
    
    // Validate password (simulated - in real app would check against actual password)
    if (deletePassword !== 'password') { // Mock password check
      setPasswordError('Incorrect password');
      return;
    }
    
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }
    
    toast.success('Account deleted');
    dispatch(logout());
    navigate('/login');
  };
  
  if (!currentUser) return null;
  
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
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="text-2xl">{currentUser.username[0].toUpperCase()}</AvatarFallback>
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
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="@username"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself"
              className="min-h-[100px] resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://yourwebsite.com"
              type="url"
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
                  <p className="font-medium">{formData.phone || 'Not added'}</p>
                  <p className="text-sm text-muted-foreground">Phone number</p>
                </div>
              </div>
              {!formData.phone && (
                <Button variant="outline" size="sm">
                  Add Phone
                </Button>
              )}
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
                <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
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
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
          </button>
          
          <Separator />
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Active Sessions</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>• Current device (Web Browser)</span>
                <span>Active now</span>
              </div>
              <div className="flex justify-between">
                <span>• iPhone 13 Pro</span>
                <span>2 hours ago</span>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Privacy Settings */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Privacy Settings</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Private Account</p>
              <p className="text-sm text-muted-foreground">
                Only approved followers can see your posts
              </p>
            </div>
            <Switch
              checked={!currentUser.isPublic}
              onCheckedChange={() => dispatch(togglePrivacy())}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Activity Status</p>
              <p className="text-sm text-muted-foreground">
                Let others see when you're active
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Allow Story Sharing</p>
              <p className="text-sm text-muted-foreground">
                Let others share your stories
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </Card>
        
        {/* Account Actions */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Account Actions</h2>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              dispatch(logout());
              navigate('/login');
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
              <Input type="password" placeholder="Enter current password" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input type="password" placeholder="Confirm new password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#d6955b] hover:bg-[#c58549]"
              onClick={() => {
                toast.success('Password changed successfully');
                setShowPasswordDialog(false);
              }}
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
              Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to log in.
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
      <Dialog open={showDeactivateDialog} onOpenChange={(open) => {
        setShowDeactivateDialog(open);
        if (!open) {
          setDeactivatePassword('');
          setDeactivateReason('');
          setPasswordError('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Account</DialogTitle>
            <DialogDescription>
              Your account will be temporarily disabled
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm mb-2">
              When you deactivate your account:
            </p>
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
              <label className="text-sm font-medium">Confirm Password <span className="text-destructive">*</span></label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={deactivatePassword}
                onChange={(e) => {
                  setDeactivatePassword(e.target.value);
                  setPasswordError('');
                }}
                className={passwordError ? 'border-destructive' : ''}
              />
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Why are you deactivating? <span className="text-destructive">*</span></label>
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
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivate}>
              Deactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open);
        if (!open) {
          setDeletePassword('');
          setDeleteReason('');
          setPasswordError('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription className="text-destructive">
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">⚠️ Warning</p>
              <p className="text-sm text-muted-foreground">
                This action is permanent and cannot be reversed
              </p>
            </div>

            <p className="text-sm mb-2">
              When you delete your account:
            </p>
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
              <label className="text-sm font-medium">Confirm Password <span className="text-destructive">*</span></label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setPasswordError('');
                }}
                className={passwordError ? 'border-destructive' : ''}
              />
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Why are you deleting? <span className="text-destructive">*</span></label>
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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}