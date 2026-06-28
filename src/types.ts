export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actions?: DeviceAction[];
}

export interface DeviceAction {
  type: "open_app" | "make_call" | "send_sms" | "create_reminder" | "search_web" | "play_youtube" | "search_ecommerce" | "open_camera" | "open_gallery" | "open_settings" | "generate_image";
  payload?: {
    appName?: string;
    phoneNumber?: string;
    contactName?: string;
    message?: string;
    title?: string;
    query?: string;
    platform?: "Amazon" | "Daraz";
    item?: string;
    prompt?: string;
  };
}

export interface PermissionsState {
  camera: boolean;
  microphone: boolean;
  contacts: boolean;
  phone: boolean;
  sms: boolean;
  location: boolean;
}

export interface AssistantConfig {
  name: string;
  language: string;
  voice: string;
  style: string;
}

export type ActivePhoneApp = "home" | "camera" | "whatsapp" | "youtube" | "ecommerce" | "dialer" | "settings" | "history" | "gallery" | "ai_creator";

export interface AutomationStep {
  id: string;
  time: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
}
