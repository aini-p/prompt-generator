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
}

export interface Direction extends PromptPartBase {
  costume_id?: string;
  pose_id?: string;
  expression_id?: string;
}

// --- Level 3: Scene (シーン・テンプレート) ---

export interface SceneRole {
  id: string; // プレイスホルダーID (例: "r1", "r2")
  name_in_scene: string; // 編集可能な表示名 (例: "主人公")
}

// ★ v10: シーンが持つ、配役ごとの演出リスト
export interface RoleDirection {
  role_id: string; // "r1"
  direction_ids: string[]; // ["dir_Smiling", "dir_Waving"]
}

export interface Scene {
  id: string;
  name: string;
  tags: string[];
  // ★ 台本 (プレイスホルダー [R1], [R2] を含む)
  prompt_template: string;
  negative_template: string;
  // シーン共通の要素
  background_id: string;
  lighting_id: string;
  composition_id: string;
  // ★ 配役 (Roles)
  roles: SceneRole[];
  // ★ 演出リスト (v8のUIを定義に移動)
  role_directions: RoleDirection[];
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
}

// (STORAGE_KEYS は変更なし)
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
};

// --- プロンプト生成結果の型 ---
export interface GeneratedPrompt {
  cut: number;
  name: string;
  positive: string;
  negative: string;
}