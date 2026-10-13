import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setTheme as setReduxTheme, setLanguage } from '../../features/settings/settingsSlice';
import { setFontSize } from '../../features/textSize/textSizeSlice';
import {
  setHighContrast,
  setReducedMotion,
  setScreenReader,
  setLargerTouchTargets,
} from '../../features/accessibility/accessibilitySlice';
import { setLayoutDensity } from '../../features/layoutDensity/layoutDensitySlice';
import type { LayoutDensity } from '../../utils/persistLayoutDensity';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Laptop, 
  Type, 
  Layout, 
  Globe, 
  Eye 
} from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { Switch } from '../../Components/ui/switch';
import { Separator } from '../../Components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../../Components/ui/radio-group';
import { Label } from '../../Components/ui/label';
import { toast } from 'sonner';

export default function AppearanceView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme, setTheme } = useTheme();
  
  const { theme: reduxTheme, language } = useAppSelector((state) => state.settings);
  const fontSize = useAppSelector((state) => state.textSize.fontSize);
  const { 
    highContrast, 
    reducedMotion, 
    screenReader, 
    largerTouchTargets 
  } = useAppSelector((state) => state.accessibility);
  const { density } = useAppSelector((state) => state.layoutDensity);

  useEffect(() => {
    if (reduxTheme && theme !== reduxTheme) {
      setTheme(reduxTheme);
    }
  }, [reduxTheme, theme, setTheme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    dispatch(setReduxTheme(newTheme as 'light' | 'dark' | 'system'));
    toast.success(`${t('theme')} ${t('changedTo')} ${t(newTheme)}`);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFontSize(Number(e.target.value)));
  };

  const handleDensityChange = (newDensity: LayoutDensity) => {
    dispatch(setLayoutDensity(newDensity));
    toast.success(`${t('layoutDensity')} ${t('set_to')} ${t(newDensity)}`);
  }

  const handleLanguageChange = (lang: { code: any; name: string; native: string; }) => {
    dispatch(setLanguage(lang.code as any));
    toast.success(`${t('language')} ${t('changedTo')} ${lang.name}`);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t('appearance')}</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Theme */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">{t('theme')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('theme_description')}
          </p>

          <RadioGroup value={theme} onValueChange={handleThemeChange}>
            <div className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg border-2 border-transparent data-[state=checked]:border-primary">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex-1 cursor-pointer flex items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{t('light')}</p>
                  <p className="text-sm text-muted-foreground">{t('light_description')}</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg border-2 border-transparent data-[state=checked]:border-primary">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex-1 cursor-pointer flex items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{t('dark')}</p>
                  <p className="text-sm text-muted-foreground">{t('dark_description')}</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg border-2 border-transparent data-[state=checked]:border-primary">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex-1 cursor-pointer flex items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{t('system')}</p>
                  <p className="text-sm text-muted-foreground">{t('system_description')}</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Text Size */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Type className="w-5 h-5" />
            {t('textSize')}
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">Aa</span>
              <input
                type="range"
                min="14"
                max="20"
                step="1"
                value={fontSize}
                onChange={handleFontSizeChange}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-2xl">Aa</span>
            </div>
            <p 
              className="text-muted-foreground text-center transition-all"
              style={{ fontSize: `${fontSize}px` }}
            >
              {t('textSize_preview')}
            </p>
          </div>
        </Card>

        {/* Layout Density */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Layout className="w-5 h-5" />
            {t('layoutDensity')}
          </h2>

          <RadioGroup value={density} onValueChange={(v) => handleDensityChange(v as LayoutDensity)}>
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="compact" id="compact" />
              <Label htmlFor="compact" className="flex-1 cursor-pointer">
                <p className="font-medium">{t('compact')}</p>
                <p className="text-sm text-muted-foreground">{t('compact_description')}</p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="comfortable" id="comfortable" />
              <Label htmlFor="comfortable" className="flex-1 cursor-pointer">
                <p className="font-medium">{t('comfortable')}</p>
                <p className="text-sm text-muted-foreground">{t('comfortable_description')}</p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="spacious" id="spacious" />
              <Label htmlFor="spacious" className="flex-1 cursor-pointer">
                <p className="font-medium">{t('spacious')}</p>
                <p className="text-sm text-muted-foreground">{t('spacious_description')}</p>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Language */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('language')}
          </h2>

          <div className="space-y-2">
            {[
              { code: 'en', name: 'English', native: 'English' },
              { code: 'fr', name: 'French', native: 'Français' },
              { code: 'es', name: 'Spanish', native: 'Español' },
              { code: 'ar', name: 'Arabic', native: 'العربية' },
              { code: 'de', name: 'German', native: 'Deutsch' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full text-start p-4 rounded-lg transition-colors ${
                  language === lang.code
                    ? 'bg-primary/10 text-primary font-medium border-2 border-primary'
                    : 'hover:bg-muted border-2 border-transparent'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{lang.native}</span>
                  <span className="text-sm text-muted-foreground">{lang.name}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Accessibility */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {t('accessibility')}
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('highContrast')}</p>
              <p className="text-sm text-muted-foreground">
                {t('highContrast_description')}
              </p>
            </div>
            <Switch 
              checked={highContrast}
              onCheckedChange={(v) => {
                dispatch(setHighContrast(v));
                toast.success(`${t('highContrast')} ${v ? t('enabled') : t('disabled')}`);
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('reducedMotion')}</p>
              <p className="text-sm text-muted-foreground">
                {t('reducedMotion_description')}
              </p>
            </div>
            <Switch 
              checked={reducedMotion}
              onCheckedChange={(v) => {
                dispatch(setReducedMotion(v));
                toast.success(`${t('reducedMotion')} ${v ? t('enabled') : t('disabled')}`);
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('screenReader')}</p>
              <p className="text-sm text-muted-foreground">
                {t('screenReader_description')}
              </p>
            </div>
            <Switch 
              checked={screenReader}
              onCheckedChange={(v) => {
                dispatch(setScreenReader(v));
                toast.success(`${t('screenReader')} ${t('support')} ${v ? t('enabled') : t('disabled')}`);
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('largerTouchTargets')}</p>
              <p className="text-sm text-muted-foreground">
                {t('largerTouchTargets_description')}
              </p>
            </div>
            <Switch 
              checked={largerTouchTargets}
              onCheckedChange={(v) => {
                dispatch(setLargerTouchTargets(v));
                toast.success(`${t('largerTouchTargets')} ${v ? t('enabled') : t('disabled')}`);
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
