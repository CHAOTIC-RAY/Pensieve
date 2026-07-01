import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain,
  X,
  Database,
  Key,
  Server,
  Settings2,
  MonitorSmartphone,
  Cloud,
  Aperture,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Palette,
  BookOpen,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  EyeOff,
  Film,
  Trash2,
  Zap,
  RefreshCw,
  User,
  Heart,
  Pin,
  MessageSquare,
  Send,
  Sparkles,
  Paperclip,
  LogOut,
  Trophy,
} from "lucide-react";
import { useAchievements } from "../hooks/useAchievements";
import AchievementCard from "./AchievementCard";
import {
  isLocalAiEnabled,
  getSelectedLocalModelId,
  setLocalAiEnabled as setLocalAiEnabledUtil,
  setSelectedLocalModelId as setSelectedLocalModelIdUtil,
  getSelectedVisionModelId,
  setSelectedVisionModelId as setSelectedVisionModelIdUtil,
  generateLocalAiResponse,
  generateLocalVisionResponse,
  getAiStrategy,
  setAiStrategy,
  AiStrategy,
} from "../services/localAiBackendLitert";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { bootstrapLocalAiOnLaunch } from "../services/localAiBootstrap";
import {
  UserSettings,
  THEME_PRESETS,
  FONT_COMBOS,
  PRESET_COLORS,
  saveSettings,
  loadGoogleFont,
} from "../services/themeStudio";
import { MindItem } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "intelligence" | "sync" | "db" | "ui" | "profile";
  localAiEnabled: boolean;
  setLocalAiEnabledState: (val: boolean) => void;
  localModelId: string;
  setLocalModelIdState: (val: string) => void;
  localVisionModelId: string;
  setLocalVisionModelIdState: (val: string) => void;
  bootstrapState: any;
  availableModels: any[];
  sidebarPosition: "left" | "right";
  setSidebarPosition: (pos: "left" | "right") => void;
  // Theme Studio props
  userSettings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  items: MindItem[];
  aiStrategy: AiStrategy;
  setAiStrategyState: (val: AiStrategy) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  localAiEnabled,
  setLocalAiEnabledState,
  localModelId,
  setLocalModelIdState,
  localVisionModelId,
  setLocalVisionModelIdState,
  bootstrapState,
  availableModels,
  sidebarPosition,
  setSidebarPosition,
  userSettings,
  onUpdateSettings,
  items,
  aiStrategy,
  setAiStrategyState,
  initialTab,
}: SettingsModalProps) {
  const { achievements } = useAchievements(items);
  const [activeTab, setActiveTab] = useState<
    "intelligence" | "sync" | "db" | "ui" | "profile"
  >(initialTab || "ui");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [localLmUrl, setLocalLmUrl] = useState("http://localhost:1234/v1");

  // User Profile States
  const [profileName, setProfileName] = useState("Ray Dark");
  const [profileEmail, setProfileEmail] = useState("2003Ray.Dark@gmail.com");
  const [profileGradient, setProfileGradient] = useState(
    "from-orange-200 to-rose-200",
  );

  // Custom Firebase States
  const [firebaseApiKey, setFirebaseApiKey] = useState("");
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState("");
  const [firebaseProjectId, setFirebaseProjectId] = useState("");
  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState("");
  const [firebaseMessagingSenderId, setFirebaseMessagingSenderId] =
    useState("");
  const [firebaseAppId, setFirebaseAppId] = useState("");
  const [firebaseDatabaseId, setFirebaseDatabaseId] = useState("");

  // LM Studio & BYOK States
  const [apiProvider, setApiProvider] = useState<
    "lmstudio" | "openai" | "gemini" | "anthropic"
  >("lmstudio");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [selectedModel, setSelectedModel] = useState("zai-org/glm-4.6v-flash");
  const [customModelName, setCustomModelName] = useState("");
  const [speculativeDecoding, setSpeculativeDecoding] = useState(false);

  // Firebase Auth states
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const wasOpen = useRef(false);
  const prevInitialTab = useRef(initialTab);
  useEffect(() => {
    if (isOpen && (!wasOpen.current || prevInitialTab.current !== initialTab)) {
      setActiveTab(initialTab || "ui");
    }
    wasOpen.current = isOpen;
    prevInitialTab.current = initialTab;
  }, [isOpen, initialTab]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleStrategyChange = (strategy: AiStrategy) => {
    setAiStrategy(strategy);
    setAiStrategyState(strategy);
    setLocalAiEnabledState(strategy === "local");
    if (strategy === "local") {
      bootstrapLocalAiOnLaunch(true);
    }
  };

  // Local AI Playground states
  const [playgroundPrompt, setPlaygroundPrompt] = useState("");
  const [playgroundHistory, setPlaygroundHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Hi! I'm your on-device local AI running completely client-side via WebGPU. Ask me anything, or try uploading an image to test my capabilities!",
    },
  ]);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundImageName, setPlaygroundImageName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (isOpen) {
      // Load user profile
      setProfileName(localStorage.getItem("mymind_profile_name") || "Ray Dark");
      setProfileEmail(
        localStorage.getItem("mymind_profile_email") ||
          "2003Ray.Dark@gmail.com",
      );
      setProfileGradient(
        localStorage.getItem("mymind_profile_avatar_gradient") ||
          "from-orange-200 to-rose-200",
      );

      // Load general connection keys
      setSupabaseUrl(localStorage.getItem("mymind_supabase_url") || "");
      setSupabaseKey(localStorage.getItem("mymind_supabase_key") || "");
      setOpenAiKey(localStorage.getItem("mymind_openai_key") || "");
      setGeminiKey(localStorage.getItem("mymind_gemini_key") || "");
      setLocalLmUrl(
        localStorage.getItem("mymind_local_lm_url") ||
          "http://localhost:1234/v1",
      );

      // Load custom Firebase keys
      setFirebaseApiKey(localStorage.getItem("mymind_firebase_apiKey") || "");
      setFirebaseAuthDomain(
        localStorage.getItem("mymind_firebase_authDomain") || "",
      );
      setFirebaseProjectId(
        localStorage.getItem("mymind_firebase_projectId") || "",
      );
      setFirebaseStorageBucket(
        localStorage.getItem("mymind_firebase_storageBucket") || "",
      );
      setFirebaseMessagingSenderId(
        localStorage.getItem("mymind_firebase_messagingSenderId") || "",
      );
      setFirebaseAppId(localStorage.getItem("mymind_firebase_appId") || "");
      setFirebaseDatabaseId(
        localStorage.getItem("mymind_firebase_firestoreDatabaseId") || "",
      );

      // Load specific LM Studio & BYOK settings
      const storedProvider =
        (localStorage.getItem("mymind_api_provider") as any) || "lmstudio";
      const storedBaseUrl = localStorage.getItem("mymind_api_base_url") || "";
      const storedToken = localStorage.getItem("mymind_api_token") || "";
      const storedModel =
        localStorage.getItem("mymind_selected_model") ||
        "zai-org/glm-4.6v-flash";
      const storedCustomModel =
        localStorage.getItem("mymind_custom_model_name") || "";
      const storedSpeculative =
        localStorage.getItem("mymind_speculative_decoding") === "true";

      setApiProvider(storedProvider);
      setApiBaseUrl(storedBaseUrl);
      setApiToken(storedToken);
      setSelectedModel(storedModel);
      setCustomModelName(storedCustomModel);
      setSpeculativeDecoding(storedSpeculative);
    }
  }, [isOpen]);

  const handleSupabaseUrlChange = (val: string) => {
    setSupabaseUrl(val);
    localStorage.setItem("mymind_supabase_url", val);
  };

  const handleSupabaseKeyChange = (val: string) => {
    setSupabaseKey(val);
    localStorage.setItem("mymind_supabase_key", val);
  };

  const handleOpenAiKeyChange = (val: string) => {
    setOpenAiKey(val);
    localStorage.setItem("mymind_openai_key", val);
  };

  const handleGeminiKeyChange = (val: string) => {
    setGeminiKey(val);
    localStorage.setItem("mymind_gemini_key", val);
  };

  const handleLocalLmUrlChange = (val: string) => {
    setLocalLmUrl(val);
    localStorage.setItem("mymind_local_lm_url", val);
  };

  const handleProfileNameChange = (val: string) => {
    setProfileName(val);
    localStorage.setItem("mymind_profile_name", val);
    window.dispatchEvent(new Event("app-settings-updated"));
  };

  const handleProfileEmailChange = (val: string) => {
    setProfileEmail(val);
    localStorage.setItem("mymind_profile_email", val);
    window.dispatchEvent(new Event("app-settings-updated"));
  };

  const handleProfileGradientChange = (val: string) => {
    setProfileGradient(val);
    localStorage.setItem("mymind_profile_avatar_gradient", val);
    window.dispatchEvent(new Event("app-settings-updated"));
  };

  const handleFirebaseApiKeyChange = (val: string) => {
    setFirebaseApiKey(val);
    localStorage.setItem("mymind_firebase_apiKey", val);
  };

  const handleFirebaseAuthDomainChange = (val: string) => {
    setFirebaseAuthDomain(val);
    localStorage.setItem("mymind_firebase_authDomain", val);
  };

  const handleFirebaseProjectIdChange = (val: string) => {
    setFirebaseProjectId(val);
    localStorage.setItem("mymind_firebase_projectId", val);
  };

  const handleFirebaseStorageBucketChange = (val: string) => {
    setFirebaseStorageBucket(val);
    localStorage.setItem("mymind_firebase_storageBucket", val);
  };

  const handleFirebaseMessagingSenderIdChange = (val: string) => {
    setFirebaseMessagingSenderId(val);
    localStorage.setItem("mymind_firebase_messagingSenderId", val);
  };

  const handleFirebaseAppIdChange = (val: string) => {
    setFirebaseAppId(val);
    localStorage.setItem("mymind_firebase_appId", val);
  };

  const handleFirebaseDatabaseIdChange = (val: string) => {
    setFirebaseDatabaseId(val);
    localStorage.setItem("mymind_firebase_firestoreDatabaseId", val);
  };

  const handleClearFirebaseCustom = () => {
    setFirebaseApiKey("");
    setFirebaseAuthDomain("");
    setFirebaseProjectId("");
    setFirebaseStorageBucket("");
    setFirebaseMessagingSenderId("");
    setFirebaseAppId("");
    setFirebaseDatabaseId("");
    localStorage.removeItem("mymind_firebase_apiKey");
    localStorage.removeItem("mymind_firebase_authDomain");
    localStorage.removeItem("mymind_firebase_projectId");
    localStorage.removeItem("mymind_firebase_storageBucket");
    localStorage.removeItem("mymind_firebase_messagingSenderId");
    localStorage.removeItem("mymind_firebase_appId");
    localStorage.removeItem("mymind_firebase_firestoreDatabaseId");
    triggerToast("Cleared custom Firebase. Using default backend database.");
  };

  const handleApiProviderChange = (
    val: "lmstudio" | "openai" | "gemini" | "anthropic",
  ) => {
    setApiProvider(val);
    let defaultModel = "";
    if (val === "lmstudio") defaultModel = "zai-org/glm-4.6v-flash";
    else if (val === "openai") defaultModel = "gpt-4o-mini";
    else if (val === "gemini") defaultModel = "gemini-2.5-flash";
    else if (val === "anthropic") defaultModel = "claude-3-5-sonnet-latest";

    setSelectedModel(defaultModel);
  };

  const handleApiBaseUrlChange = (val: string) => {
    setApiBaseUrl(val);
  };

  const handleApiTokenChange = (val: string) => {
    setApiToken(val);
  };

  const handleSelectedModelChange = (val: string) => {
    setSelectedModel(val);
  };

  const handleCustomModelNameChange = (val: string) => {
    setCustomModelName(val);
  };

  const handleSpeculativeDecodingChange = (val: boolean) => {
    setSpeculativeDecoding(val);
  };

  // API Test state
  const [apiTestStatus, setApiTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [apiTestMessage, setApiTestMessage] = useState("");

  const handleTestAndSaveApi = async () => {
    setApiTestStatus("testing");
    setApiTestMessage("Testing connection...");
    try {
      const response = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: apiProvider,
          apiKey: apiToken,
          baseUrl: apiBaseUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Connection failed");
      }
      setApiTestStatus("success");
      setApiTestMessage("Connection successful! Settings saved.");

      // Save all current settings to localStorage
      localStorage.setItem("mymind_api_provider", apiProvider);
      localStorage.setItem("mymind_api_base_url", apiBaseUrl);
      localStorage.setItem("mymind_api_token", apiToken);
      localStorage.setItem("mymind_selected_model", selectedModel);
      localStorage.setItem("mymind_custom_model_name", customModelName);
      localStorage.setItem(
        "mymind_speculative_decoding",
        speculativeDecoding ? "true" : "false",
      );

      setTimeout(() => {
        setApiTestStatus("idle");
        setApiTestMessage("");
      }, 3000);
    } catch (err: any) {
      setApiTestStatus("error");
      setApiTestMessage(err.message || "Connection failed");
    }
  };

  // Horizontal scroll refs
  const fontRowRef = useRef<HTMLDivElement>(null);
  const presetRowRef = useRef<HTMLDivElement>(null);

  // Toast confirmation state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile collapsible sections
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>(
    {
      ai: false,
      sync: false,
      apis: false,
      db: false,
      ui: true,
    },
  );

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleMobileSection = (section: string) => {
    setMobileExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Preset check: Has user customized color/radius/blur after applying a preset?
  const isCustomizedAfterPreset = () => {
    if (!userSettings.activePreset) return false;
    const preset = THEME_PRESETS.find(
      (p) => p.name === userSettings.activePreset,
    );
    if (!preset) return false;

    return (
      userSettings.themeColor.toLowerCase() !== preset.color.toLowerCase() ||
      userSettings.borderRadius !== preset.borderRadius ||
      userSettings.blurStrength !== preset.blurStrength ||
      userSettings.uiStyle !== preset.uiStyle ||
      userSettings.fontCombo !== preset.fontCombo
    );
  };

  const handleApplyPreset = (preset: (typeof THEME_PRESETS)[0]) => {
    const updated: UserSettings = {
      ...userSettings,
      activePreset: preset.name,
      themeColor: preset.color,
      fontCombo: preset.fontCombo,
      uiStyle: preset.uiStyle,
      borderRadius: preset.borderRadius,
      blurStrength: preset.blurStrength,
      themeMode: preset.themeMode,
    };
    onUpdateSettings(updated);
    triggerToast(`Applied ${preset.name} Preset`);
  };

  const handleUpdateSingleSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    const updated: UserSettings = {
      ...userSettings,
      [key]: value,
    };

    // If we changed color or font combo, we might have deviated from active preset
    if (
      key === "themeColor" ||
      key === "borderRadius" ||
      key === "blurStrength" ||
      key === "uiStyle" ||
      key === "fontCombo"
    ) {
      // Keep activePreset so we can show "Customized" palette badge
    }
    onUpdateSettings(updated);
  };

  // Custom Background Uploader & Compressor
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optional Compression: max 1920px wide, 80% quality JPEG
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1920;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
          handleUpdateSingleSetting("backgroundImage", compressedBase64);
          triggerToast("Background wallpaper uploaded successfully");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleClearBg = () => {
    handleUpdateSingleSetting("backgroundImage", "");
    triggerToast("Background wallpaper removed");
  };

  const scrollFontRow = (direction: "left" | "right") => {
    if (fontRowRef.current) {
      const scrollAmt = direction === "left" ? -250 : 250;
      fontRowRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  const scrollPresetRow = (direction: "left" | "right") => {
    if (presetRowRef.current) {
      const scrollAmt = direction === "left" ? -250 : 250;
      presetRowRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  const renderUserProfileContent = () => {
    const totalItems = items.length;
    const favoritesCount = items.filter((i) => i.isFavorite).length;
    const topOfMindCount = items.filter((i) => i.isTopMind).length;
    const notesCount = items.filter((i) => i.type === "note").length;
    const linksCount = items.filter(
      (i) => i.type === "link" || i.type === "article",
    ).length;
    const imagesCount = items.filter((i) => i.type === "image").length;
    const colorsCount = items.filter((i) => i.type === "color").length;

    // Get Initials for Avatar
    const getInitials = (name: string) => {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 0 || parts[0] === "") return "?";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const initials = getInitials(profileName);

    const handleSignOut = async () => {
      try {
        await signOut(auth);
        onClose();
      } catch (err) {
        console.error("Sign out error:", err);
      }
    };

    const gradients = [
      {
        id: "from-orange-200 to-rose-200",
        name: "Sunset Rose",
        class: "bg-gradient-to-tr from-orange-200 to-rose-200 text-neutral-800",
      },
      {
        id: "from-indigo-500 via-purple-500 to-pink-500",
        name: "Cosmic Violet",
        class:
          "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white",
      },
      {
        id: "from-emerald-400 to-cyan-500",
        name: "Emerald Aurora",
        class:
          "bg-gradient-to-tr from-emerald-400 to-cyan-500 text-neutral-900",
      },
      {
        id: "from-blue-600 to-indigo-600",
        name: "Electric Blue",
        class: "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white",
      },
      {
        id: "from-neutral-700 to-neutral-900",
        name: "Classic Charcoal",
        class: "bg-gradient-to-tr from-neutral-700 to-neutral-900 text-white",
      },
      {
        id: "from-amber-400 to-red-500",
        name: "Sunset Amber",
        class: "bg-gradient-to-tr from-amber-400 to-red-500 text-white",
      },
    ];

    const currentGradientClass =
      gradients.find((g) => g.id === profileGradient)?.class ||
      "bg-gradient-to-tr from-orange-200 to-rose-200 text-neutral-800";

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-text-heading">
            User Profile
          </h3>
          <p className="text-xs text-foreground/70 mt-1 max-w-sm leading-relaxed">
            Manage your personal workspace identity, avatar style, and review
            your local mind telemetry.
          </p>
        </div>

        {/* Profile Card & Avatar Preview */}
        <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center font-display text-xl font-bold tracking-tight shadow-md shrink-0 ${currentGradientClass}`}
            >
              {initials}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-bold text-text-heading">
                {profileName}
              </h4>
              <p className="text-xs text-foreground/50 font-mono">
                {profileEmail}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 items-center justify-center sm:justify-start">
                <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/15 font-semibold">
                  Private Workspace
                </span>
                <span className="text-[10px] font-mono bg-foreground/5 text-foreground/60 px-2 py-0.5 rounded-full border border-border-subtle font-semibold">
                  Synchronized
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-colors text-xs font-bold active:scale-95 duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Input Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-foreground/60">
              Profile Display Name
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => handleProfileNameChange(e.target.value)}
              placeholder="E.g. Ray Dark"
              className="w-full bg-input-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-foreground/60">
              Registered Email
            </label>
            <input
              type="email"
              value={profileEmail}
              onChange={(e) => handleProfileEmailChange(e.target.value)}
              placeholder="E.g. 2003Ray.Dark@gmail.com"
              className="w-full bg-input-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
            />
          </div>
        </div>

        {/* Avatar Colors/Gradients */}
        <div className="space-y-2.5 pt-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-foreground/60">
            Avatar Gradient Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gradients.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleProfileGradientChange(g.id)}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition text-left cursor-pointer hover:bg-foreground/[0.02] ${
                  profileGradient === g.id
                    ? "border-primary bg-foreground/[0.01] shadow-sm"
                    : "border-border-subtle bg-transparent"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full shrink-0 shadow-inner ${g.class}`}
                />
                <span className="text-[11px] font-semibold text-text-heading truncate">
                  {g.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mind Telemetry Stats */}
        <div className="space-y-3 pt-4 border-t border-border-subtle">
          <h4 className="text-xs font-mono uppercase tracking-wider text-foreground/65 flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-foreground/50" />
            Workspace Analytics & Telemetry
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-foreground/[0.02] border border-border-subtle rounded-xl text-center space-y-0.5">
              <span className="text-lg font-bold text-text-heading">
                {totalItems}
              </span>
              <span className="text-[9px] font-mono text-foreground/50 block uppercase tracking-wider">
                Total Items
              </span>
            </div>
            <div className="p-3 bg-foreground/[0.02] border border-border-subtle rounded-xl text-center space-y-0.5">
              <span className="text-lg font-bold text-rose-500 flex items-center justify-center gap-1">
                <Heart className="w-4 h-4 fill-rose-500" /> {favoritesCount}
              </span>
              <span className="text-[9px] font-mono text-foreground/50 block uppercase tracking-wider">
                Favorites
              </span>
            </div>
            <div className="p-3 bg-foreground/[0.02] border border-border-subtle rounded-xl text-center space-y-0.5">
              <span className="text-lg font-bold text-amber-500 flex items-center justify-center gap-1">
                <Pin className="w-3.5 h-3.5 fill-amber-500" /> {topOfMindCount}
              </span>
              <span className="text-[9px] font-mono text-foreground/50 block uppercase tracking-wider">
                Focused
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="px-3 py-2 bg-foreground/[0.01] border border-border-subtle/40 rounded-lg text-center">
              <span className="text-xs font-semibold text-foreground/75 block">
                {notesCount}
              </span>
              <span className="text-[8px] font-mono text-foreground/45 uppercase tracking-wider">
                Sticky Notes
              </span>
            </div>
            <div className="px-3 py-2 bg-foreground/[0.01] border border-border-subtle/40 rounded-lg text-center">
              <span className="text-xs font-semibold text-foreground/75 block">
                {linksCount}
              </span>
              <span className="text-[8px] font-mono text-foreground/45 uppercase tracking-wider">
                Bookmarks
              </span>
            </div>
            <div className="px-3 py-2 bg-foreground/[0.01] border border-border-subtle/40 rounded-lg text-center">
              <span className="text-xs font-semibold text-foreground/75 block">
                {imagesCount}
              </span>
              <span className="text-[8px] font-mono text-foreground/45 uppercase tracking-wider">
                Images
              </span>
            </div>
            <div className="px-3 py-2 bg-foreground/[0.01] border border-border-subtle/40 rounded-lg text-center">
              <span className="text-xs font-semibold text-foreground/75 block">
                {colorsCount}
              </span>
              <span className="text-[8px] font-mono text-foreground/45 uppercase tracking-wider">
                Swatches
              </span>
            </div>
          </div>
        </div>

        {/* Milestones / Achievements Section */}
        <div className="space-y-4 pt-6 border-t border-border-subtle">
          <h4 className="text-xs font-mono uppercase tracking-wider text-foreground/65 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Milestones &amp; Collectibles ({achievements.filter(a => a.unlockedAt).length} / {achievements.length})
          </h4>
          <p className="text-[11px] text-foreground/50 leading-relaxed">
            Your milestones unlocked through thinking, organizing, and using serendipity.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            {achievements.map((ach) => {
              const Icon = ach.icon || Trophy;
              const isUnlocked = !!ach.unlockedAt;
              return (
                <div 
                  key={ach.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
                    isUnlocked 
                      ? "bg-amber-500/5 border-amber-500/25 shadow-sm" 
                      : "bg-foreground/[0.01] border-border-subtle opacity-60"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked ? "bg-amber-500 text-white" : "bg-foreground/5 text-foreground/30"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="text-xs font-bold text-text-heading truncate">{ach.title}</span>
                      {ach.rarity && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 ${
                          ach.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-600' :
                          ach.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-600' :
                          ach.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-600' :
                          'bg-foreground/10 text-foreground/60'
                        }`}>
                          {ach.rarity}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-foreground/50 truncate leading-relaxed">
                      {ach.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handleSendPlaygroundMessage = async () => {
    if (!playgroundPrompt.trim() && !playgroundImageName) return;

    const userMsg = playgroundPrompt;
    const currentImg = playgroundImageName;
    setPlaygroundPrompt("");
    setPlaygroundImageName(null);

    // Add user message to history
    const newUserMsgText = currentImg
      ? `[Attached Image: ${currentImg}] ${userMsg}`
      : userMsg;

    setPlaygroundHistory((prev) => [
      ...prev,
      { role: "user", content: newUserMsgText },
    ]);
    setPlaygroundLoading(true);

    try {
      if (aiStrategy === "api_key") {
        let base64Image: string | null = null;
        if (currentImg) {
          // Mock a real base64 for vision if an image is "attached" in the playground
          base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        }

        // Run Cloud Inference
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: apiProvider,
            apiKey: apiToken,
            baseUrl: apiBaseUrl,
            model: selectedModel === "custom" ? customModelName : selectedModel,
            messages: [
              ...playgroundHistory.map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: userMsg }
            ],
            image: base64Image,
            items: items.slice(0, 5).map(it => ({ title: it.title, content: it.content, type: it.type })),
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "AI Inference failed");

        setPlaygroundHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        setPlaygroundLoading(false);
      } else if (currentImg) {
        // Handle Local Vision
        if (localModelId.toLowerCase().includes('vision')) {
          const mockBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
          const reply = await generateLocalVisionResponse(userMsg || "What is in this image?", mockBase64);
          setPlaygroundHistory((prev) => [
            ...prev,
            { role: "assistant", content: reply },
          ]);
          setPlaygroundLoading(false);
        } else {
          // Local Text only
          setTimeout(() => {
            setPlaygroundHistory((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `I noticed you attached an image (${currentImg})! Our current local model runs in optimized text-only mode to save VRAM.\n\nTo enable fully featured **Local Vision**, select **Phi-3.5 Vision** in the model dropdown above.`,
              },
            ]);
            setPlaygroundLoading(false);
          }, 1000);
        }
      } else {
        // Run real local text inference!
        const context = items
          .slice(0, 15) // take top 15 items for context
          .map(it => `[${it.type.toUpperCase()}] ${it.title}: ${it.content?.slice(0, 100)}...`)
          .join('\n');

        const reply = await generateLocalAiResponse(userMsg, undefined, context);
        setPlaygroundHistory((prev) => [
          ...prev,
          { role: "assistant", content: reply },
        ]);
        setPlaygroundLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setPlaygroundHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error running local inference: ${err.message || err}. Make sure the GPU engine is fully warmed up and state says "ready" above.`,
        },
      ]);
      setPlaygroundLoading(false);
    }
  };

  const handleTriggerMockImageUpload = () => {
    const fileNames = [
      "mind_screenshot.png",
      "photo_inspiration.jpg",
      "design_mockup.webp",
      "receipt_invoice.pdf",
    ];
    const randomName = fileNames[Math.floor(Math.random() * fileNames.length)];
    setPlaygroundImageName(randomName);
  };

  const renderStrategySelector = () => (
    <section className="space-y-3">
      <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/60">
        Global AI Reasoning Strategy
      </label>
      <div className="grid grid-cols-2 p-1 bg-foreground/5 rounded-2xl border border-border-subtle">
        <button
          onClick={() => handleStrategyChange("local")}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            aiStrategy === "local"
              ? "bg-card-bg text-text-heading shadow-md border border-border-subtle/40"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          <Brain className="w-4 h-4" />
          Local Engine
        </button>
        <button
          onClick={() => handleStrategyChange("api_key")}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            aiStrategy === "api_key"
              ? "bg-card-bg text-text-heading shadow-md border border-border-subtle/40"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          <Cloud className="w-4 h-4" />
          Cloud API
        </button>
      </div>
      <p className="text-[10px] text-foreground/50 leading-relaxed px-1">
        {aiStrategy === "local"
          ? "Using on-device WebGPU shaders for private, offline intelligence. Your data never leaves this browser."
          : "Routing requests to high-performance cloud models via secure API keys for deeper reasoning and vision."}
      </p>
    </section>
  );

  const renderLocalAIContent = () => (
    <section
      className={`space-y-4 pt-4 transition-all ${aiStrategy !== "local" ? "opacity-40 pointer-events-none grayscale" : ""}`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text-heading flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          Local Engine Configuration
        </h4>
        {aiStrategy === "local" && (
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
            Active
          </span>
        )}
      </div>

      <div className="space-y-4 bg-foreground/[0.02] border border-border-subtle/80 p-5 rounded-2xl">
        <div className="space-y-2">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60">
            Local LLM Model
          </label>
          <select
            value={localModelId}
            onChange={async (e) => {
              const newModelId = e.target.value;
              setLocalModelIdState(newModelId);
              setSelectedLocalModelIdUtil(newModelId);
              bootstrapLocalAiOnLaunch(true);
            }}
            className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
          >
            {availableModels.map((model) => (
              <option key={model.model_id} value={model.model_id}>
                {model.name} ({model.power_tier} power)
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60">
            Local Vision Model
          </label>
          <select
            value={localVisionModelId}
            onChange={async (e) => {
              setLocalVisionModelIdState(e.target.value);
              setSelectedVisionModelIdUtil(e.target.value);
            }}
            className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
          >
            {availableModels.filter(m => m.model_id.includes('vision') || m.name.toLowerCase().includes('vision')).map((model) => (
              <option key={model.model_id} value={model.model_id}>
                {model.name} ({model.power_tier} power)
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60">
            GPU Engine Status
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold capitalize text-foreground/80">
              {bootstrapState.phase === "idle"
                ? "Standby"
                : bootstrapState.phase}
            </span>
          </div>
          {bootstrapState.phase === "downloading" && (
            <div className="space-y-2 mt-2">
              <div className="w-full bg-foreground/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${bootstrapState.progress * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-foreground/50 font-mono">
                {bootstrapState.message}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const renderApisContent = () => (
    <section
      className={`space-y-4 pt-4 transition-all ${aiStrategy !== "api_key" ? "opacity-40 pointer-events-none grayscale" : ""}`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text-heading flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          Cloud API Configuration
        </h4>
        {aiStrategy === "api_key" && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
            Active
          </span>
        )}
      </div>

      <div className="space-y-4 bg-foreground/[0.02] border border-border-subtle/80 p-5 rounded-2xl">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60">
            API Provider
          </label>
          <select
            value={apiProvider}
            onChange={(e) => handleApiProviderChange(e.target.value as any)}
            className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-foreground font-medium focus:outline-none focus:border-primary/40 transition-colors"
          >
            <option value="lmstudio">LM Studio (Local Server)</option>
            <option value="openai">OpenAI (Bring Your Own Key)</option>
            <option value="gemini">
              Google Gemini (Bring Your Own Key)
            </option>
            <option value="anthropic">
              Anthropic Claude (Bring Your Own Key)
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60">
            API Base URL
          </label>
          <input
            type="text"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder={
              apiProvider === "lmstudio"
                ? "http://localhost:1234/v1"
                : apiProvider === "openai"
                  ? "https://api.openai.com/v1"
                  : "Default for provider"
            }
            className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60">
            API Key / Token
          </label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => handleApiTokenChange(e.target.value)}
            placeholder={
              apiProvider === "openai"
                ? "sk-..."
                : apiProvider === "gemini"
                  ? "AIzaSy..."
                  : "sk-ant-..."
            }
            className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60">
            Model Selection
          </label>
          <select
            value={selectedModel}
            onChange={(e) => handleSelectedModelChange(e.target.value)}
            className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-foreground font-medium focus:outline-none focus:border-primary/40 transition-colors"
          >
            {apiProvider === "lmstudio" && (
              <>
                <option value="zai-org/glm-4.6v-flash">
                  zai-org/glm-4.6v-flash 👁️ (Vision + Text)
                </option>
                <option value="meta-llama/Llama-3.2-11B-Vision-Instruct">
                  meta-llama/Llama-3.2-11B-Vision-Instruct 👁️ (Vision +
                  Text)
                </option>
                <option value="meta-llama-3-8b-instruct">
                  meta-llama-3-8b-instruct ✍️ (Text Only)
                </option>
                <option value="custom">-- Custom Model ID --</option>
              </>
            )}
            {apiProvider === "openai" && (
              <>
                <option value="gpt-4o-mini">
                  gpt-4o-mini 👁️ (Vision + Text)
                </option>
                <option value="gpt-4o">gpt-4o 👁️ (Vision + Text)</option>
                <option value="custom">-- Custom Model ID --</option>
              </>
            )}
            {apiProvider === "gemini" && (
              <>
                <option value="gemini-2.5-flash">
                  gemini-2.5-flash 👁️ (Vision + Text)
                </option>
                <option value="gemini-2.5-pro">
                  gemini-2.5-pro 👁️ (Vision + Text)
                </option>
                <option value="custom">-- Custom Model ID --</option>
              </>
            )}
            {apiProvider === "anthropic" && (
              <>
                <option value="claude-3-5-sonnet-latest">
                  claude-3-5-sonnet-latest 👁️ (Vision + Text)
                </option>
                <option value="claude-3-5-haiku-latest">
                  claude-3-5-haiku-latest ✍️ (Text Only)
                </option>
                <option value="custom">-- Custom Model ID --</option>
              </>
            )}
          </select>
        </div>

        {selectedModel === "custom" && (
          <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60">
              Custom Model ID
            </label>
            <input
              type="text"
              value={customModelName}
              onChange={(e) => setCustomModelName(e.target.value)}
              placeholder="e.g. meta-llama/Llama-3.1-8B-Instruct"
              className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleTestAndSaveApi}
            disabled={apiTestStatus === "testing"}
            className="px-4 py-2 bg-primary text-primary-foreground text-[11px] font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {apiTestStatus === "testing"
              ? "Testing Connection..."
              : "Test & Save API Config"}
          </button>
        </div>
      </div>
    </section>
  );

  const renderCloudSyncContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-text-heading flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sky-400" />
            Cloud Synchronization & Backup
          </h3>
          <span className="text-[10px] text-foreground/40 font-mono pl-6">v1.2.4 (Active Node Connection)</span>
        </div>
        {firebaseUser && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Cloud Active
          </div>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-border-subtle space-y-5">
        <div className="space-y-2">
          <p className="text-xs text-foreground/70 leading-relaxed font-medium">
            Seamless multi-device synchronization for your digital mind.
          </p>
          <p className="text-[10px] text-foreground/50 leading-relaxed">
            Your data is automatically encrypted using AES-256 before leaving your browser and stored in your private, secure cloud instance. Collaboration and real-time editing are enabled by default.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card-bg border border-border-subtle/50 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold text-text-heading">
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              Auto-Sync Operational
            </div>
            <p className="text-[10px] text-foreground/50">Heartbeat check successful. Changes sync in real-time.</p>
          </div>
          <div className="p-4 rounded-xl bg-card-bg border border-border-subtle/50 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold text-text-heading">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Vault Encryption
            </div>
            <p className="text-[10px] text-foreground/50">Keys managed locally. No third-party access to your data.</p>
          </div>
        </div>

        {!firebaseUser ? (
          <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-text-heading">Identity Required</p>
                <p className="text-[10px] text-foreground/60 leading-normal">
                  Sign in or create an account to start syncing your items, tags, and settings across all your devices.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab("profile")}
              className="w-full py-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Go to Profile to Sign In
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-4 bg-card-bg rounded-xl border border-border-subtle shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-tighter">Sync Health</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-500">Perfectly Synchronized</span>
                  <span className="text-[10px] text-foreground/40">•</span>
                  <span className="text-[10px] text-foreground/40">Last check: Just now</span>
                </div>
              </div>
              <button className="p-2.5 bg-foreground/5 hover:bg-foreground/10 rounded-xl transition-all cursor-pointer group active:scale-95">
                <RefreshCw className="w-4 h-4 text-primary group-active:rotate-180 transition-transform duration-500" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 px-1">
              <div className="h-1 flex-1 bg-foreground/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
              <span className="text-[10px] font-mono text-foreground/40 shrink-0">100% Synced</span>
            </div>

            <p className="text-[10px] text-center text-foreground/50 italic pt-1">
              All records (approximately {items.length} units) are safely persistent in your cloud vault.
            </p>
          </div>
        )}
      </div>

      <section className="space-y-4 pt-6 border-t border-border-subtle">
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-foreground/50 flex items-center gap-2">
          Sync Configuration
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle/50 hover:bg-foreground/[0.01] hover:border-primary/20 transition-all cursor-pointer select-none group">
            <input type="checkbox" checked={true} readOnly className="mt-0.5 w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary/20 transition-all cursor-pointer" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-text-heading group-hover:text-primary transition-colors">Media Synchronization</span>
              <span className="text-[10px] text-foreground/50">Sync images, attachments, and binary blobs.</span>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle/50 hover:bg-foreground/[0.01] hover:border-primary/20 transition-all cursor-pointer select-none group">
            <input type="checkbox" checked={true} readOnly className="mt-0.5 w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary/20 transition-all cursor-pointer" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-text-heading group-hover:text-primary transition-colors">Ghost Mode Sync</span>
              <span className="text-[10px] text-foreground/50">Background delta syncing when app is closed.</span>
            </div>
          </label>
        </div>
      </section>
    </div>
  );

  const renderIntelligenceContent = () => {
    const MODEL_DETAILS: Record<
      string,
      {
        name: string;
        contextWindow: string;
        maxOutput: string;
        supportsImages: boolean;
        supportsCaching: boolean;
        supportsStateful: boolean;
      }
    > = {
      "zai-org/glm-4.6v-flash": {
        name: "Glm 4.6v Flash 👁️ [Vision + Text] - zai-org/glm-4.6v-flash",
        contextWindow: "131,072 tokens",
        maxOutput: "131,072 tokens",
        supportsImages: true,
        supportsCaching: true,
        supportsStateful: true,
      },
      "meta-llama/Llama-3.2-11B-Vision-Instruct": {
        name: "Llama 3.2 11B Vision 👁️ [Vision + Text] - meta-llama/Llama-3.2-11B-Vision-Instruct",
        contextWindow: "131,072 tokens",
        maxOutput: "8,192 tokens",
        supportsImages: true,
        supportsCaching: true,
        supportsStateful: true,
      },
      "meta-llama-3-8b-instruct": {
        name: "Llama 3 8B Instruct ✍️ [Text Only] - meta-llama/Meta-Llama-3-8B-Instruct",
        contextWindow: "8,192 tokens",
        maxOutput: "8,192 tokens",
        supportsImages: false,
        supportsCaching: true,
        supportsStateful: true,
      },
      "mistral-7b-instruct": {
        name: "Mistral 7B Instruct ✍️ [Text Only] - mistralai/Mistral-7B-Instruct-v0.3",
        contextWindow: "32,768 tokens",
        maxOutput: "32,768 tokens",
        supportsImages: false,
        supportsCaching: false,
        supportsStateful: true,
      },
      "gpt-4o-mini": {
        name: "GPT-4o Mini 👁️ [Vision + Text] - gpt-4o-mini",
        contextWindow: "128,000 tokens",
        maxOutput: "16,384 tokens",
        supportsImages: true,
        supportsCaching: true,
        supportsStateful: false,
      },
      "gpt-4o": {
        name: "GPT-4o 👁️ [Vision + Text] - gpt-4o",
        contextWindow: "128,000 tokens",
        maxOutput: "16,384 tokens",
        supportsImages: true,
        supportsCaching: true,
        supportsStateful: false,
      },
      "gemini-2.5-flash": {
        name: "Gemini 2.5 Flash 👁️ [Vision + Text] - gemini-2.5-flash",
        contextWindow: "1,048,576 tokens",
        maxOutput: "8,192 tokens",
        supportsImages: true,
        supportsCaching: true,
        supportsStateful: true,
      },
      "gemini-2.5-pro": {
        name: "Gemini 2.5 Pro 👁️ [Vision + Text] - gemini-2.5-pro",
        contextWindow: "2,097,152 tokens",
        maxOutput: "8,192 tokens",
        supportsImages: true,
        supportsCaching: true,
        supportsStateful: true,
      },
      "claude-3-5-haiku-latest": {
        name: "Claude 3.5 Haiku ✍️ [Text Only] - claude-3-5-haiku-latest",
        contextWindow: "200,000 tokens",
        maxOutput: "8,192 tokens",
        supportsImages: false,
        supportsCaching: true,
        supportsStateful: false,
      },
      "claude-3-5-sonnet-latest": {
        name: "Claude 3.5 Sonnet 👁️ [Vision + Text] - claude-3-5-sonnet-latest",
        contextWindow: "200,000 tokens",
        maxOutput: "8,192 tokens",
        supportsImages: true,
        supportsCaching: true,
        supportsStateful: false,
      },
      "Phi-3.5-vision-instruct-q4f16_1-MLC": {
        name: "Phi-3.5 Vision (balanced) 👁️ [Vision + Text] - Local WebGPU",
        contextWindow: "4,096 tokens",
        maxOutput: "4,096 tokens",
        supportsImages: true,
        supportsCaching: true,
        supportsStateful: true,
      },
      "Phi-3.5-vision-instruct-q4f32_1-MLC": {
        name: "Phi-3.5 Vision (higher quality) 👁️ [Vision + Text] - Local WebGPU",
        contextWindow: "4,096 tokens",
        maxOutput: "4,096 tokens",
        supportsImages: true,
        supportsCaching: true,
        supportsStateful: true,
      },
    };

    const currentModelDetails =
      selectedModel === "custom"
        ? {
            name: customModelName
              ? `${customModelName} (Custom)`
              : "Custom Model ID",
            contextWindow: "Dynamic (Depends on loaded weights)",
            maxOutput: "Dynamic (Depends on loaded weights)",
            supportsImages: true,
            supportsCaching: true,
            supportsStateful: true,
          }
        : MODEL_DETAILS[selectedModel] || {
            name: selectedModel,
            contextWindow: "Varies",
            maxOutput: "Varies",
            supportsImages: true,
            supportsCaching: true,
            supportsStateful: true,
          };

    return (
      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {renderStrategySelector()}
        {renderLocalAIContent()}
        {renderApisContent()}
        {renderPlaygroundContent()}
      </div>
    );
  };

  const renderPlaygroundContent = () => (
    <section className="space-y-4 pt-6 border-t border-border-subtle">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text-heading flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Intelligence Playground
        </h4>
        <button
          onClick={() =>
            setPlaygroundHistory([
              {
                role: "assistant",
                content: "Playground reset. How can I help you today?",
              },
            ])
          }
          className="text-[10px] font-mono text-foreground/50 hover:text-foreground cursor-pointer"
        >
          Reset Session
        </button>
      </div>

      <div className="border border-border-subtle rounded-2xl overflow-hidden bg-foreground/[0.01] flex flex-col h-[450px]">
        <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          {playgroundHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <span className="text-[9px] font-mono text-foreground/40 mb-1.5 uppercase tracking-tighter">
                {msg.role === "user" ? "Neural Input" : "Synthetic Response"}
              </span>
              <div
                className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                    : "bg-foreground/[0.03] text-foreground border border-border-subtle/70 rounded-tl-none whitespace-pre-wrap"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {playgroundLoading && (
            <div className="flex flex-col items-start animate-in fade-in duration-300">
              <span className="text-[9px] font-mono text-foreground/40 mb-1.5 uppercase tracking-tighter">
                AI Thinking
              </span>
              <div className="p-3.5 bg-foreground/[0.03] border border-border-subtle/70 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-card-bg/50 border-t border-border-subtle">
          {playgroundImageName && (
            <div className="flex items-center gap-2 mb-2 p-1.5 bg-primary/5 border border-primary/10 rounded-lg animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-text-heading truncate">
                  {playgroundImageName}
                </p>
                <p className="text-[8px] text-foreground/50 uppercase tracking-tighter">
                  Vision Asset Attached
                </p>
              </div>
              <button
                onClick={() => setPlaygroundImageName(null)}
                className="p-1 hover:bg-foreground/10 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-foreground/60" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerMockImageUpload}
              className="p-2 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
              title="Attach Image (Vision Mode)"
            >
              <ImageIcon className="w-4.5 h-4.5" />
            </button>
            <input
              type="text"
              value={playgroundPrompt}
              onChange={(e) => setPlaygroundPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendPlaygroundMessage()}
              placeholder={
                aiStrategy === "local"
                  ? "Ask the local engine anything..."
                  : "Send a message to Cloud AI..."
              }
              className="flex-1 bg-input-bg/50 border-none focus:ring-0 text-xs text-foreground py-2 outline-none"
            />
            <button
              onClick={handleSendPlaygroundMessage}
              disabled={playgroundLoading || (!playgroundPrompt.trim() && !playgroundImageName)}
              className="p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-30 transition shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  const renderDatabasesContent = () => {
    const isFirebaseCustomized = !!(firebaseProjectId && firebaseApiKey);

    return (
      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 text-foreground scrollbar-thin scrollbar-thumb-foreground/10">
        <div>
          <h3 className="text-sm font-semibold text-text-heading">
            Database &amp; Storage Connections
          </h3>
          <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
            Configure external cloud databases to sync and persist your
            thoughts. By default, your mind is backed up to a secure built-in
            Firebase Firestore instance.
          </p>
        </div>

        {/* Custom Firebase Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-heading select-none">
              <Cloud className="w-4 h-4 text-orange-400" />
              Custom Firebase Integration
            </div>
            {isFirebaseCustomized && (
              <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-full animate-pulse">
                Custom Active
              </span>
            )}
          </div>

          <div className="space-y-4 bg-foreground/[0.02] border border-border-subtle/80 p-5 rounded-2xl">
            <p className="text-[11px] text-foreground/60 leading-normal mb-1">
              Connect your own Firebase Firestore database. Your on-screen
              updates will be securely synced in real-time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase tracking-wider text-foreground/60">
                  Project ID *
                </label>
                <input
                  type="text"
                  value={firebaseProjectId}
                  onChange={(e) =>
                    handleFirebaseProjectIdChange(e.target.value)
                  }
                  placeholder="your-firebase-project-id"
                  className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase tracking-wider text-foreground/60">
                  API Key *
                </label>
                <input
                  type="password"
                  value={firebaseApiKey}
                  onChange={(e) => handleFirebaseApiKeyChange(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase tracking-wider text-foreground/60">
                  Auth Domain (optional)
                </label>
                <input
                  type="text"
                  value={firebaseAuthDomain}
                  onChange={(e) =>
                    handleFirebaseAuthDomainChange(e.target.value)
                  }
                  placeholder="your-app.firebaseapp.com"
                  className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase tracking-wider text-foreground/60">
                  Storage Bucket (optional)
                </label>
                <input
                  type="text"
                  value={firebaseStorageBucket}
                  onChange={(e) =>
                    handleFirebaseStorageBucketChange(e.target.value)
                  }
                  placeholder="your-app.firebasestorage.app"
                  className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-1">
                <label className="block text-[9px] font-mono uppercase tracking-wider text-foreground/60">
                  Messaging Sender ID
                </label>
                <input
                  type="text"
                  value={firebaseMessagingSenderId}
                  onChange={(e) =>
                    handleFirebaseMessagingSenderIdChange(e.target.value)
                  }
                  placeholder="591622610805"
                  className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="block text-[9px] font-mono uppercase tracking-wider text-foreground/60">
                  App ID
                </label>
                <input
                  type="text"
                  value={firebaseAppId}
                  onChange={(e) => handleFirebaseAppIdChange(e.target.value)}
                  placeholder="1:591622610805:web:..."
                  className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="block text-[9px] font-mono uppercase tracking-wider text-foreground/60">
                  Database ID
                </label>
                <input
                  type="text"
                  value={firebaseDatabaseId}
                  onChange={(e) =>
                    handleFirebaseDatabaseIdChange(e.target.value)
                  }
                  placeholder="(default)"
                  className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>

            {isFirebaseCustomized && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleClearFirebaseCustom}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-500 font-semibold border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset to Default Firebase Instance
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Database Section */}
        <section className="space-y-4 pt-6 border-t border-border-subtle">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-heading select-none">
            <Database className="w-4 h-4 text-emerald-400" />
            Custom Supabase Connection
          </div>
          <div className="space-y-3 bg-foreground/[0.02] border border-border-subtle/80 p-5 rounded-2xl">
            <p className="text-[11px] text-foreground/60 leading-normal mb-1">
              Connect to your Supabase PostgreSQL instance to leverage edge
              relational database syncing.
            </p>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60 mb-1">
                Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => handleSupabaseUrlChange(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground/60 mb-1">
                Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => handleSupabaseKeyChange(e.target.value)}
                placeholder="eyJhbGci..."
                className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Reload Notice Button */}
        <section className="pt-4 border-t border-border-subtle select-none">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            Database connections require an app reload to take effect. Click
            here to reload now.
          </button>
        </section>
      </div>
    );
  };

  const renderUIAppearanceContent = () => {
    const isCustomized = isCustomizedAfterPreset();

    return (
      <div className="space-y-8 text-foreground">
        {/* 1. Light/Dark Mode Toggle (Prominent, Full-Width) */}
        <section className="space-y-2">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/60">
            Appearance Mode
          </label>
          <div className="grid grid-cols-2 p-1 bg-foreground/5 rounded-2xl border border-border-subtle">
            <button
              onClick={() => handleUpdateSingleSetting("themeMode", "light")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                userSettings.themeMode === "light"
                  ? "bg-card-bg text-text-heading shadow-md border border-border-subtle/40"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => handleUpdateSingleSetting("themeMode", "dark")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                userSettings.themeMode === "dark"
                  ? "bg-card-bg text-text-heading shadow-md border border-border-subtle/40"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </section>

        {/* 2. Quick Presets Row */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/60">
              One-Click Quick Presets
            </label>
            {userSettings.activePreset && (
              <span className="text-[10px] font-semibold font-mono px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-1">
                {userSettings.activePreset}
                {isCustomized && (
                  <span className="text-[8px] uppercase tracking-wider text-amber-500 font-bold flex items-center gap-0.5">
                    • Modified <Palette className="w-2.5 h-2.5 inline" />
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="relative group">
            {/* Arrows appearing on hover or with light opacity on desktop */}
            <button
              type="button"
              onClick={() => scrollPresetRow("left")}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-card-bg/90 border border-border-subtle text-foreground hover:bg-card-bg shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hidden sm:flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollPresetRow("right")}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-card-bg/90 border border-border-subtle text-foreground hover:bg-card-bg shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hidden sm:flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div
              ref={presetRowRef}
              className="flex gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth mask-fade-edges"
            >
              {THEME_PRESETS.map((preset) => {
                const isSelected =
                  userSettings.activePreset === preset.name && !isCustomized;

                return (
                  <button
                    key={preset.name}
                    onClick={() => handleApplyPreset(preset)}
                    className={`relative flex-shrink-0 w-[84px] h-[104px] rounded-2xl border p-2 flex flex-col justify-between text-left transition-all hover:scale-102 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 bg-card-bg shadow-md"
                        : "border-border-subtle bg-card-bg/40 hover:bg-card-bg hover:border-foreground/20"
                    }`}
                  >
                    {/* Mockup UI layout preview inside 64x80 box */}
                    <div
                      className="w-full h-12 rounded-lg relative overflow-hidden border border-foreground/5 shadow-inner"
                      style={{
                        backgroundColor:
                          preset.themeMode === "dark" ? "#141416" : "#F3F2EE",
                        borderRadius:
                          Math.min(preset.borderRadius / 3, 10) + "px",
                      }}
                    >
                      {/* Mock Header */}
                      <div className="absolute top-0 inset-x-0 h-3 bg-foreground/[0.04] border-b border-foreground/[0.03] flex items-center px-1 justify-between">
                        <div className="w-5 h-1 bg-foreground/10 rounded-full" />
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: preset.color }}
                        />
                      </div>
                      {/* Mock Cards Bento */}
                      <div className="p-1 pt-4.5 grid grid-cols-2 gap-1 h-full">
                        <div
                          className="h-5 rounded-md flex flex-col justify-between p-0.5"
                          style={{
                            backgroundColor:
                              preset.themeMode === "dark"
                                ? "#1e1e21"
                                : "#ffffff",
                            borderRadius:
                              Math.min(preset.borderRadius / 4, 6) + "px",
                            border: "1px solid rgba(0,0,0,0.03)",
                          }}
                        >
                          <div className="w-4 h-0.5 bg-foreground/20 rounded" />
                          <div
                            className="w-3 h-0.5 rounded"
                            style={{ backgroundColor: preset.color }}
                          />
                        </div>
                        <div
                          className="h-5 rounded-md flex flex-col justify-between p-0.5"
                          style={{
                            backgroundColor:
                              preset.themeMode === "dark"
                                ? "#1e1e21"
                                : "#ffffff",
                            borderRadius:
                              Math.min(preset.borderRadius / 4, 6) + "px",
                            border: "1px solid rgba(0,0,0,0.03)",
                          }}
                        >
                          <div className="w-5 h-0.5 bg-foreground/15 rounded" />
                          <div className="w-2.5 h-0.5 bg-foreground/10 rounded" />
                        </div>
                      </div>
                    </div>

                    {/* Preset Label */}
                    <div className="mt-1">
                      <p className="text-[10px] font-bold text-text-heading truncate leading-none">
                        {preset.name}
                      </p>
                      <span className="text-[8px] text-foreground/50 font-mono capitalize leading-none block mt-0.5">
                        {preset.uiStyle}
                      </span>
                    </div>

                    {/* Soft dot showing preset primary color */}
                    <span
                      className="absolute bottom-2 right-2 w-2 h-2 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Accent Color Swatches + Custom Native Picker */}
        <section className="space-y-3">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/60">
            Accent Brand Color
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {PRESET_COLORS.map((color) => {
              const isSelected =
                userSettings.themeColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  onClick={() => handleUpdateSingleSetting("themeColor", color)}
                  className={`relative w-10 h-10 rounded-full border shadow-sm transition-all flex-shrink-0 hover:scale-105 ${
                    isSelected
                      ? "border-white scale-102 ring-4 ring-primary/30"
                      : "border-border-subtle hover:border-foreground/30"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {isSelected && (
                    <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-white shadow-inner" />
                  )}
                </button>
              );
            })}

            {/* Custom native color picker styled as a gradient swatch circle */}
            <div className="relative flex-shrink-0 w-10 h-10 rounded-full border border-border-subtle bg-gradient-to-tr from-rose-400 via-violet-400 to-emerald-400 shadow-sm overflow-hidden group hover:scale-105 transition-all">
              <input
                type="color"
                value={userSettings.themeColor}
                onChange={(e) =>
                  handleUpdateSingleSetting("themeColor", e.target.value)
                }
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Choose custom accent color"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <Palette className="w-4 h-4 text-white drop-shadow-md" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Typography / FontComboSelector */}
        <section className="space-y-3 relative group">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/60">
              Typography Font Pairings
            </label>
            <span className="text-[10px] font-semibold text-primary font-mono">
              {FONT_COMBOS.find((c) => c.id === userSettings.fontCombo)?.name ||
                "Default"}
            </span>
          </div>

          <div className="relative">
            {/* Arrows appearing on hover */}
            <button
              onClick={() => scrollFontRow("left")}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-card-bg/85 border border-border-subtle text-foreground hover:bg-card-bg shadow-md transition opacity-0 group-hover:opacity-100 hidden sm:block"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollFontRow("right")}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-card-bg/85 border border-border-subtle text-foreground hover:bg-card-bg shadow-md transition opacity-0 group-hover:opacity-100 hidden sm:block"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div
              ref={fontRowRef}
              className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth mask-fade-edges"
            >
              {FONT_COMBOS.map((combo) => {
                const isSelected = userSettings.fontCombo === combo.id;
                return (
                  <button
                    key={combo.id}
                    onClick={() => {
                      loadGoogleFont(combo.id);
                      handleUpdateSingleSetting("fontCombo", combo.id);
                    }}
                    className={`flex-shrink-0 w-[164px] h-[104px] rounded-2xl border p-3 flex flex-col justify-between text-left transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/35 bg-card-bg shadow-md"
                        : "border-border-subtle bg-card-bg/40 hover:bg-card-bg hover:border-foreground/20"
                    }`}
                  >
                    <div>
                      <p className="text-[10px] font-bold text-text-heading truncate leading-none mb-1">
                        {combo.name}
                      </p>
                      <p className="text-[8px] text-foreground/50 font-mono truncate leading-none">
                        {combo.description}
                      </p>
                    </div>

                    <div className="my-1.5 flex items-baseline justify-between">
                      {/* Big Aa indicator */}
                      <span
                        className="text-2xl font-bold leading-none tracking-tight"
                        style={{ fontFamily: combo.displayFont }}
                      >
                        Aa
                      </span>
                      <span className="text-[8px] font-mono text-foreground/40 bg-foreground/[0.04] px-1 py-0.5 rounded">
                        {combo.source}
                      </span>
                    </div>

                    <p
                      className="text-[9px] text-foreground/70 truncate w-full"
                      style={{ fontFamily: combo.bodyFont }}
                    >
                      The quick brown fox
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Glass Blur Slider */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/60">
              Glass Backdrop Blur Strength
            </label>
            <span className="text-xs font-mono font-bold text-text-heading">
              {userSettings.blurStrength}px
            </span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={userSettings.blurStrength}
              onChange={(e) =>
                handleUpdateSingleSetting(
                  "blurStrength",
                  parseInt(e.target.value),
                )
              }
              className="flex-1 accent-primary bg-foreground/10 h-1 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </section>

        {/* 6. UI Style Selector */}
        <section className="space-y-3">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/60">
            Interface Design Layout Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "modern", label: "Modern Rounded" },
              { id: "minimal", label: "Flat Minimal" },
              { id: "glass", label: "Frosted Glass" },
              { id: "liquid-glass", label: "Liquid Gloss" },
              { id: "neumorphism", label: "3D Neumorph" },
              { id: "brutalist", label: "Brutalist Flat" },
              { id: "editorial", label: "Editorial Serif" },
              { id: "nothing", label: "LCD Matrix" },
            ].map((style) => {
              const isSelected = userSettings.uiStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => handleUpdateSingleSetting("uiStyle", style.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center truncate capitalize transition-all ${
                    isSelected
                      ? "bg-primary border-transparent text-white shadow-md"
                      : "bg-card-bg/50 text-foreground border-border-subtle hover:bg-card-bg hover:border-foreground/20"
                  }`}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 7. Accessibility / Effects Grid */}
        <section className="space-y-3">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/60">
            Accessibility & Motion Controls
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Reduce Motion */}
            <div className="bg-card-bg/50 border border-border-subtle rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-text-heading flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-foreground/70" />
                  Reduce Motion
                </p>
                <p className="text-[10px] text-foreground/50">Disables anims</p>
              </div>
              <button
                onClick={() =>
                  handleUpdateSingleSetting(
                    "reduceMotion",
                    !userSettings.reduceMotion,
                  )
                }
                className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                  userSettings.reduceMotion ? "bg-primary" : "bg-foreground/20"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-modal-bg transition-transform ${
                    userSettings.reduceMotion
                      ? "translate-x-5"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Hide Images */}
            <div className="bg-card-bg/50 border border-border-subtle rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-text-heading flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-foreground/70" />
                  Hide Images
                </p>
                <p className="text-[10px] text-foreground/50">Text-only mode</p>
              </div>
              <button
                onClick={() =>
                  handleUpdateSingleSetting(
                    "hideImages",
                    !userSettings.hideImages,
                  )
                }
                className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                  userSettings.hideImages ? "bg-primary" : "bg-foreground/20"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-modal-bg transition-transform ${
                    userSettings.hideImages ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Immersive Mode */}
            <div className="bg-card-bg/50 border border-border-subtle rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-text-heading flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-foreground/70" />
                  Immersive Mode
                </p>
                <p className="text-[10px] text-foreground/50">
                  Fullscreen layout
                </p>
              </div>
              <button
                onClick={() =>
                  handleUpdateSingleSetting(
                    "immersiveMode",
                    !userSettings.immersiveMode,
                  )
                }
                className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                  userSettings.immersiveMode ? "bg-primary" : "bg-foreground/20"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-modal-bg transition-transform ${
                    userSettings.immersiveMode
                      ? "translate-x-5"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 8. Custom Background Image Upload */}
        <section className="space-y-3">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/60">
            Custom Wallpaper Background
          </label>

          <div className="bg-card-bg/50 border border-border-subtle rounded-2xl p-4 space-y-4">
            {userSettings.backgroundImage ? (
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border-subtle shadow-md shrink-0 bg-neutral-900">
                  <img
                    src={userSettings.backgroundImage}
                    alt="Custom Wallpaper"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleClearBg}
                    className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/90 text-white flex items-center justify-center transition-colors"
                    title="Remove background wallpaper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-heading">
                    Custom Wallpaper Active
                  </p>
                  <p className="text-[10px] text-foreground/50 mt-0.5 leading-relaxed">
                    Wallpaper is applied and fully active. Turn off to restore
                    theme color background.
                  </p>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border-subtle hover:border-foreground/30 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-text-heading">
                  Upload Custom Background
                </p>
                <p className="text-[10px] text-foreground/50 mt-1">
                  Supports drag & drop or click. Autocompressed for quick
                  loading.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBgUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-6">
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-text-heading text-modal-bg py-2.5 px-5 rounded-full shadow-lg text-xs font-medium tracking-tight flex items-center gap-2"
              >
                <Palette className="w-3.5 h-3.5 text-primary" />
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:block absolute inset-0 z-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Mobile View: Full screen dedicated panel with collapsible accordion sections */}
          <div className="md:hidden fixed inset-0 z-50 bg-modal-bg flex flex-col w-full h-full overflow-y-auto pb-24 text-foreground">
            {/* Mobile Header */}
            <div className="sticky top-0 bg-modal-bg/90 backdrop-blur-md px-6 py-4 border-b border-border-subtle flex items-center justify-center z-10 shrink-0">
              <h2 className="text-base font-bold text-text-heading flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-text-heading" />
                Preferences
              </h2>
            </div>

            {/* Accordion Categories */}
            <div className="p-4 space-y-3">
              {/* 1. Appearance / Theme Studio (Main section) */}
              <div className="border border-border-subtle rounded-2xl overflow-hidden bg-card-bg/50 backdrop-blur-sm">
                <button
                  onClick={() => toggleMobileSection("ui")}
                  className="w-full px-5 py-4 flex items-center justify-between bg-card-bg hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 text-text-heading font-semibold text-sm">
                    <MonitorSmartphone className="w-4.5 h-4.5 text-foreground/80" />
                    Theme Studio Layout
                  </div>
                  {mobileExpanded.ui ? (
                    <ChevronUp className="w-4 h-4 text-foreground/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground/60" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {mobileExpanded.ui && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border-subtle bg-modal-bg/30"
                    >
                      <div className="p-5">{renderUIAppearanceContent()}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Local AI */}
              <div className="border border-border-subtle rounded-2xl overflow-hidden bg-card-bg/50 backdrop-blur-sm">
                <button
                  onClick={() => toggleMobileSection("ai")}
                  className="w-full px-5 py-4 flex items-center justify-between bg-card-bg hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 text-text-heading font-semibold text-sm">
                    <Brain className="w-4.5 h-4.5 text-foreground/80" />
                    Local AI Shaders
                  </div>
                  {mobileExpanded.ai ? (
                    <ChevronUp className="w-4 h-4 text-foreground/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground/60" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {mobileExpanded.ai && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border-subtle bg-modal-bg/30"
                    >
                      <div className="p-5">{renderLocalAIContent()}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Cloud Sync */}
              <div className="border border-border-subtle rounded-2xl overflow-hidden bg-card-bg/50 backdrop-blur-sm">
                <button
                  onClick={() => toggleMobileSection("sync")}
                  className="w-full px-5 py-4 flex items-center justify-between bg-card-bg hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 text-text-heading font-semibold text-sm">
                    <Cloud className="w-4.5 h-4.5 text-foreground/80" />
                    Cloud Sync Dashboard
                  </div>
                  {mobileExpanded.sync ? (
                    <ChevronUp className="w-4 h-4 text-foreground/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground/60" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {mobileExpanded.sync && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border-subtle bg-modal-bg/30"
                    >
                      <div className="p-5">{renderCloudSyncContent()}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. API Keys */}
              <div className="border border-border-subtle rounded-2xl overflow-hidden bg-card-bg/50 backdrop-blur-sm">
                <button
                  onClick={() => toggleMobileSection("apis")}
                  className="w-full px-5 py-4 flex items-center justify-between bg-card-bg hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 text-text-heading font-semibold text-sm">
                    <Key className="w-4.5 h-4.5 text-foreground/80" />
                    API Keys &amp; Models
                  </div>
                  {mobileExpanded.apis ? (
                    <ChevronUp className="w-4 h-4 text-foreground/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground/60" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {mobileExpanded.apis && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border-subtle bg-modal-bg/30"
                    >
                      <div className="p-5">{renderApisContent()}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 5. Database Connections */}
              <div className="border border-border-subtle rounded-2xl overflow-hidden bg-card-bg/50 backdrop-blur-sm">
                <button
                  onClick={() => toggleMobileSection("db")}
                  className="w-full px-5 py-4 flex items-center justify-between bg-card-bg hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 text-text-heading font-semibold text-sm">
                    <Database className="w-4.5 h-4.5 text-foreground/80" />
                    Database Connections
                  </div>
                  {mobileExpanded.db ? (
                    <ChevronUp className="w-4 h-4 text-foreground/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground/60" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {mobileExpanded.db && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border-subtle bg-modal-bg/30"
                    >
                      <div className="p-5">{renderDatabasesContent()}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Desktop View: Rich multi-column modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="hidden md:flex relative z-10 w-[90vw] max-w-4xl h-[80vh] max-h-[720px] min-h-[480px] bg-modal-bg rounded-3xl shadow-2xl overflow-hidden flex-col border border-border-subtle text-foreground transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between shrink-0 bg-modal-sidebar select-none">
              <h2 className="text-lg font-semibold text-text-heading flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-foreground" />
                Preferences
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Close preferences"
                className="p-2 hover:bg-foreground/10 active:scale-95 rounded-xl transition-all text-foreground cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-row flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-52 bg-modal-sidebar p-4 flex flex-col gap-2 shrink-0 border-r border-border-subtle">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                    activeTab === "profile"
                      ? "bg-card-bg text-text-heading shadow-sm border border-border-subtle/30"
                      : "text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  <User className="w-4 h-4 text-rose-400" />
                  User Profile
                </button>
                <button
                  onClick={() => setActiveTab("ui")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                    activeTab === "ui"
                      ? "bg-card-bg text-text-heading shadow-sm border border-border-subtle/30"
                      : "text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  <MonitorSmartphone className="w-4 h-4 text-primary" />
                  Theme Studio
                </button>
                <button
                  onClick={() => setActiveTab("intelligence")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                    activeTab === "intelligence"
                      ? "bg-card-bg text-text-heading shadow-sm border border-border-subtle/30"
                      : "text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  <Brain className="w-4 h-4 text-indigo-400" />
                  Intelligence
                </button>
                <button
                  onClick={() => setActiveTab("sync")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                    activeTab === "sync"
                      ? "bg-card-bg text-text-heading shadow-sm border border-border-subtle/30"
                      : "text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  <Cloud className="w-4 h-4 text-sky-400" />
                  Cloud Sync
                </button>
                <button
                  onClick={() => setActiveTab("db")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                    activeTab === "db"
                      ? "bg-card-bg text-text-heading shadow-sm border border-border-subtle/30"
                      : "text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  <Database className="w-4 h-4 text-orange-400" />
                  Databases
                </button>

                <div className="mt-auto pt-4 border-t border-border-subtle hidden md:block">
                  <span className="text-[10px] text-foreground/40 font-mono block">
                    Sidebar Position:
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <button
                      onClick={() => setSidebarPosition("left")}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition ${
                        sidebarPosition === "left"
                          ? "bg-primary text-white border-transparent shadow-[0_2px_8px_rgba(var(--primary-rgb),0.3)]"
                          : "bg-card-bg/40 text-foreground border-border-subtle hover:bg-foreground/5"
                      }`}
                    >
                      Left
                    </button>
                    <button
                      onClick={() => setSidebarPosition("right")}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition ${
                        sidebarPosition === "right"
                          ? "bg-primary text-white border-transparent shadow-[0_2px_8px_rgba(var(--primary-rgb),0.3)]"
                          : "bg-card-bg/40 text-foreground border-border-subtle hover:bg-foreground/5"
                      }`}
                    >
                      Right
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {activeTab === "profile" && renderUserProfileContent()}
                {activeTab === "intelligence" && renderIntelligenceContent()}
                {activeTab === "sync" && renderCloudSyncContent()}
                {activeTab === "db" && renderDatabasesContent()}
                {activeTab === "ui" && renderUIAppearanceContent()}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
