// Editing state shared between StoryComposer and its sub-components.

/** camera: capture / pick media; text: coloured-background story; media: editing a photo / video. */
export type Mode = "camera" | "text" | "media";

export interface StoryMedia {
  url: string;
  type: "image" | "video";
  thumbnailUrl?: string;
  durationSec?: number;
}

export interface TextDraft {
  open: boolean;
  value: string;
  color: string;
  font: string;
  bg: boolean;
  editingId: string | null;
}

export type StickerKind = "link" | "poll" | "question";

export interface StickerDraft {
  kind: StickerKind;
  url: string;
  label: string;
  question: string;
  options: string[];
  prompt: string;
}
