// src/data/mocks.ts
import { CharacterDefinition, ClothingDefinition, BackgroundDefinition } from '../types/prompt';

// --- キャラクターデータ ---
// ↓↓↓ この "export" がありますか？ ↓↓↓
export const characterDB: Record<string, CharacterDefinition> = {
  "char_base_001": {
    id: "char_base_001",
    name: "ベースキャラA (茶髪・青目)",
    type: "Character",
    tags: ["female", "standard"],
    gender: "1girl",
    age: "20s",
    hair: { style: "long", color: "brown" },
    eyes: { color: "blue" },
    expression: "neutral"
  },
  "char_var_002": {
    id: "char_var_002",
    name: "バリエーションA (金髪ポニテ)",
    type: "Character",
    tags: ["female", "cheerful", "variation"],
    baseId: "char_base_001", // char_base_001 を継承
    overrides: { // 変更点だけを記述
      hair: { style: "ponytail", color: "blonde" },
      expression: "smiling"
    }
  },
  "char_base_003": {
    id: "char_base_003",
    name: "ベースキャラB (黒髪・短髪)",
    type: "Character",
    tags: ["male", "standard"],
    gender: "1boy",
    age: "late teens",
    hair: { style: "short", color: "black" },
    eyes: { color: "brown" },
    expression: "serious"
  }
};

// --- 衣装データ ---
// ↓↓↓ この "export" も確認してください ↓↓↓
export const clothingDB: Record<string, ClothingDefinition> = {
  "cloth_001": {
    id: "cloth_001",
    name: "カジュアル私服",
    type: "Clothing",
    tags: ["casual", "modern"],
    style: "casual",
    top: "white t-shirt",
    bottom: "blue jeans",
    accessory: "silver necklace"
  },
  "cloth_002": {
    id: "cloth_002",
    name: "ファンタジー(剣士)",
    type: "Clothing",
    tags: ["fantasy", "fighter"],
    style: "fantasy armor",
    top: "leather chestplate",
    bottom: "chainmail pants",
    accessory: "long sword"
  }
};

// --- 背景データ ---
// ↓↓↓ この "export" も確認してください ↓↓↓
export const backgroundDB: Record<string, BackgroundDefinition> = {
  "bg_001": {
    id: "bg_001",
    name: "昼の公園",
    type: "Background",
    tags: ["outdoor", "day"],
    location: "in a park",
    time: "daytime",
    weather: "sunny"
  },
  "bg_002": {
    id: "bg_002",
    name: "夜の都市",
    type: "Background",
    tags: ["city", "night"],
    location: "cityscape at night",
    time: "night",
    weather: "clear sky"
  }
};