import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Sun,
  Moon,
  Laptop,
  Type,
  Layout,
  Globe,
  Eye,
} from "lucide-react";
import { Card } from "../../Components/ui/card";
import { Switch } from "../../Components/ui/switch";
import { Separator } from "../../Components/ui/separator";
import { RadioGroup, RadioGroupItem } from "../../Components/ui/radio-group";
import { Label } from "../../Components/ui/label";
import { toast } from "sonner";
import {
  getAppearanceSettings,
  updateAppearanceSettings,
  type AppearanceSettings,
} from "../../api/settingsApi";

export default function AppearanceView() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [appearance, setAppearance] = useState<AppearanceSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getAppearanceSettings();
        setAppearance(data);
        // Sync theme with system
        if (data.theme && theme !== data.theme) {
          setTheme(data.theme);
        }
      } catch (error) {
        toast.error("Failed to load appearance settings");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [theme, setTheme]);

  const updateSettings = async (updates: Partial<AppearanceSettings>) => {
    try {
      const updated = await updateAppearanceSettings(updates);
      setAppearance(updated);
      toast.success("Appearance settings updated");
    } catch (error) {
      toast.error("Failed to update appearance settings");
      console.error(error);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    updateSettings({ fontSize: newSize });
  };

  const handleDensityChange = (
    newDensity: AppearanceSettings["layoutDensity"],
  ) => {
    updateSettings({ layoutDensity: newDensity });
  };

  const handleLanguageChange = (lang: string) => {
    updateSettings({ language: lang });
  };

  const toggleAccessibility = (
    key: keyof AppearanceSettings["accessibility"],
  ) => {
    if (appearance) {
      updateSettings({
        accessibility: {
          ...appearance.accessibility,
          [key]: !appearance.accessibility[key],
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!appearance) return null;

  const languages = [
    { code: "en", name: "English", native: "English" },
    { code: "fr", name: "French", native: "Français" },
    { code: "es", name: "Spanish", native: "Español" },
    { code: "ar", name: "Arabic", native: "العربية" },
    { code: "de", name: "German", native: "Deutsch" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Appearance</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Theme */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Theme</h2>
          <p className="text-sm text-muted-foreground">
            Customize how ANMOUGAR looks on your device
          </p>

          <RadioGroup
            value={appearance.theme}
            onValueChange={handleThemeChange}
          >
            <div className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg border-2 border-transparent data-[state=checked]:border-primary">
              <RadioGroupItem value="light" id="light" />
              <Label
                htmlFor="light"
                className="flex-1 cursor-pointer flex items-center gap-3"
              >
                <div className="p-3 bg-muted rounded-full">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Light</p>
                  <p className="text-sm text-muted-foreground">
                    Bright and clear appearance
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg border-2 border-transparent data-[state=checked]:border-primary">
              <RadioGroupItem value="dark" id="dark" />
              <Label
                htmlFor="dark"
                className="flex-1 cursor-pointer flex items-center gap-3"
              >
                <div className="p-3 bg-muted rounded-full">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Dark</p>
                  <p className="text-sm text-muted-foreground">
                    Easy on the eyes in low light
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg border-2 border-transparent data-[state=checked]:border-primary">
              <RadioGroupItem value="system" id="system" />
              <Label
                htmlFor="system"
                className="flex-1 cursor-pointer flex items-center gap-3"
              >
                <div className="p-3 bg-muted rounded-full">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">System</p>
                  <p className="text-sm text-muted-foreground">
                    Match your device settings
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Text Size */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Type className="w-5 h-5" />
            Text Size
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">Aa</span>
              <input
                type="range"
                min="14"
                max="20"
                step="1"
                value={appearance.fontSize}
                onChange={handleFontSizeChange}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-2xl">Aa</span>
            </div>
            <p
              className="text-muted-foreground text-center transition-all"
              style={{ fontSize: `${appearance.fontSize}px` }}
            >
              This is how text will appear at size {appearance.fontSize}px
            </p>
          </div>
        </Card>

        {/* Layout Density */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Layout Density
          </h2>

          <RadioGroup
            value={appearance.layoutDensity}
            onValueChange={handleDensityChange}
          >
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="compact" id="compact" />
              <Label htmlFor="compact" className="flex-1 cursor-pointer">
                <p className="font-medium">Compact</p>
                <p className="text-sm text-muted-foreground">
                  More content, less spacing
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="comfortable" id="comfortable" />
              <Label htmlFor="comfortable" className="flex-1 cursor-pointer">
                <p className="font-medium">Comfortable</p>
                <p className="text-sm text-muted-foreground">
                  Balanced spacing (recommended)
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="spacious" id="spacious" />
              <Label htmlFor="spacious" className="flex-1 cursor-pointer">
                <p className="font-medium">Spacious</p>
                <p className="text-sm text-muted-foreground">
                  More breathing room
                </p>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Language */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language
          </h2>

          <div className="space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left p-4 rounded-lg transition-colors ${
                  appearance.language === lang.code
                    ? "bg-primary/10 text-primary font-medium border-2 border-primary"
                    : "hover:bg-muted border-2 border-transparent"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{lang.native}</span>
                  <span className="text-sm text-muted-foreground">
                    {lang.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Accessibility */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Accessibility
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">High Contrast</p>
              <p className="text-sm text-muted-foreground">
                Increase color contrast for better visibility
              </p>
            </div>
            <Switch
              checked={appearance.accessibility.highContrast}
              onCheckedChange={() => toggleAccessibility("highContrast")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reduced Motion</p>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              checked={appearance.accessibility.reducedMotion}
              onCheckedChange={() => toggleAccessibility("reducedMotion")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Screen Reader Support</p>
              <p className="text-sm text-muted-foreground">
                Optimize for screen readers
              </p>
            </div>
            <Switch
              checked={appearance.accessibility.screenReader}
              onCheckedChange={() => toggleAccessibility("screenReader")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Larger Touch Targets</p>
              <p className="text-sm text-muted-foreground">
                Make buttons and links easier to tap
              </p>
            </div>
            <Switch
              checked={appearance.accessibility.largerTouchTargets}
              onCheckedChange={() => toggleAccessibility("largerTouchTargets")}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
