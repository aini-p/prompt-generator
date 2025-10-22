// src/types/prompt.ts

// --- ベースオブジェクト ---
export interface PromptPartBase {
  id: string;
  name: string;
  tags: string[];
  prompt: string;
  negative_prompt: string;
}

// --- Level 1: ライブラリ (基本パーツ) ---
export type Costume = PromptPartBase;
export type Pose = PromptPartBase;
export type Expression = PromptPartBase;
export type Background = PromptPartBase;
export type Lighting = PromptPartBase;
export type Composition = PromptPartBase;

export interface Actor extends PromptPartBase {
  base_costume_id: string;
  base_pose_id: string;
  base_expression_id: string;
  // ★ 追加: ファイル名用
  work_title: string;
  character_name: string;
}

export interface Direction extends PromptPartBase {
  costume_id?: string;
  pose_id?: string;
  expression_id?: string;
}

// --- Level 3: Scene (シーン・テンプレート) ---

export interface SceneRole {
  id: string; // "r1", "r2"
  name_in_scene: string; 
}

export interface RoleDirection {
  role_id: string; 
  direction_ids: string[];
}

export interface Scene {
  id: string;
  name: string;
  tags: string[];
  prompt_template: string;
  negative_template: string;
  background_id: string;
  lighting_id: string;
  composition_id: string;
  roles: SceneRole[];
  role_directions: RoleDirection[];
  // ★ 追加: 画像生成モード用
  reference_image_path: string; // URL or ローカルパス (手動実行のためパス形式は問わない)
  image_mode: "txt2img" | "img2img" | "img2img_polish";
}

// --- ★ 追加: Stable Diffusion パラメータ ---
export interface StableDiffusionParams {
  steps: number;
  sampler_name: string;
  cfg_scale: number;
  seed: number; // -1 でランダム
  width: number;
  height: number;
  denoising_strength: number; // img2img 用
}

// --- DB全体の構造 ---
export interface FullDatabase {
  actors: Record<string, Actor>;
  costumes: Record<string, Costume>;
  poses: Record<string, Pose>;
  expressions: Record<string, Expression>;
  directions: Record<string, Direction>;
  backgrounds: Record<string, Background>;
  lighting: Record<string, Lighting>;
  compositions: Record<string, Composition>;
  scenes: Record<string, Scene>;
  // ★ 追加: SDパラメータ (DBの一部として保存)
  sdParams: StableDiffusionParams; 
}

// (STORAGE_KEYS に sdParams を追加)
export const STORAGE_KEYS: Record<keyof FullDatabase, string> = {
  actors: 'promptBuilder_actors',
  costumes: 'promptBuilder_costumes',
  poses: 'promptBuilder_poses',
  expressions: 'promptBuilder_expressions',
  directions: 'promptBuilder_directions',
  backgrounds: 'promptBuilder_backgrounds',
  lighting: 'promptBuilder_lighting',
  compositions: 'promptBuilder_compositions',
  scenes: 'promptBuilder_scenes',
  sdParams: 'promptBuilder_sdParams', // ★ 追加
};

// --- プロンプト生成結果の型 (バッチ生成用) ---
export interface GeneratedPrompt {
  cut: number;
  name: string;
  positive: string;
  negative: string;
  // ★ 追加: ファイル名生成用 (最初の役者の情報)
  firstActorInfo?: { work_title: string; character_name: string };
}

// --- ★ 追加: tasks.json の各要素の型 ---
export interface ImageGenerationTask {
  prompt: string;
  negative_prompt: string;
  steps: number;
  sampler_name: string;
  cfg_scale: number;
  seed: number;
  width: number;
  height: number;
  mode: "txt2img" | "img2img" | "img2img_polish";
  filename_prefix: string;
  source_image_path: string;
  denoising_strength: number | string; // JSONでは数値だが、空文字を許容するためstringも
}