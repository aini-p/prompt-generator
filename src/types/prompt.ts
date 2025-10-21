// src/types/prompt.ts

/**
 * すべてのパーツが持つ基本情報
 */
export interface PromptPartBase {
  id: string;         // 一意のID
  name: string;       // UIに表示する名前
  tags: string[];     // 検索用のタグ
  type: 'Character' | 'Clothing' | 'Background'; // パーツの種類
}

// --- キャラクター ---
export interface CharacterData {
  gender: string;
  age: string;
  hair: {
    style: string;
    color: string;
  };
  eyes: {
    color: string;
  };
  expression: string;
}

// キャラクターのベースオブジェクト
export interface CharacterBase extends PromptPartBase, CharacterData {
  type: 'Character';
}

// キャラクターのバリエーション (継承・オーバーライド)
export interface CharacterVariation extends PromptPartBase {
  type: 'Character';
  baseId: string; // 継承元のID
  overrides: Partial<CharacterData>; // 上書きするデータ
}

export type CharacterDefinition = CharacterBase | CharacterVariation;

// --- 衣装 ---
export interface ClothingData {
  style: string;
  top: string;
  bottom: string;
  accessory?: string; // オプション
}

export interface ClothingDefinition extends PromptPartBase, ClothingData {
  type: 'Clothing';
}

// --- 背景 ---
export interface BackgroundData {
  location: string;
  time: string;
  weather: string;
}

export interface BackgroundDefinition extends PromptPartBase, BackgroundData {
  type: 'Background';
}