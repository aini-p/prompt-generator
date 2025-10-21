// src/utils/promptGenerator.ts
import { CharacterDefinition, ClothingDefinition, BackgroundDefinition, CharacterBase } from '../types/prompt';
//import { characterDB } from '../data/mocks';

// 選択されたIDと、含めるかどうかのフラグ
export interface SelectedParts {
  characterId: string;
  clothingId: string;
  backgroundId: string;
}

export interface IncludeFlags {
  character: boolean;
  clothing: boolean;
  background: boolean;
}

/**
 * バリエーションを解決し、最終的なキャラクターオブジェクトを返す
 * ★ 変更: characterDB を引数で受け取る
 */
export function resolveCharacter(id: string, allCharacters: Record<string, CharacterDefinition>): CharacterBase {
  const charDef = allCharacters[id]; // ★ 変更: 引数の allCharacters を使用
  if (!charDef) throw new Error(`Character not found: ${id}`);

  if ('baseId' in charDef) {
    // バリエーションの場合
    const base = allCharacters[charDef.baseId] as CharacterBase; // ★ 変更: 引数の allCharacters を使用
    if (!base) throw new Error(`Base character not found: ${charDef.baseId}`);

    // (マージロジックは変更なし)
    const resolved: CharacterBase = JSON.parse(JSON.stringify(base)); 
    resolved.id = charDef.id; 
    resolved.name = charDef.name;
    
    if (charDef.overrides.hair) {
        resolved.hair = { ...resolved.hair, ...charDef.overrides.hair };
    }
    if (charDef.overrides.eyes) {
        resolved.eyes = { ...resolved.eyes, ...charDef.overrides.eyes };
    }
    if (charDef.overrides.expression) {
        resolved.expression = charDef.overrides.expression;
    }
    
    return resolved;
  } else {
    // ベースオブジェクトの場合
    return charDef as CharacterBase;
  }
}

/**
 * 最終的なプロンプトを生成する
 */
export function generatePrompt(
  parts: SelectedParts,
  flags: IncludeFlags,
  // ★ 変更: allCharacters も受け取る
  allCharacters: Record<string, CharacterDefinition>, 
  allClothing: Record<string, ClothingDefinition>,
  allBackgrounds: Record<string, BackgroundDefinition>
): string {
  
  const prompts: string[] = [];

  // --- 1. キャラクター ---
  if (flags.character && parts.characterId) {
    // ★ 変更: allCharacters を resolveCharacter に渡す
    const char = resolveCharacter(parts.characterId, allCharacters); 
    prompts.push(char.gender);
    prompts.push(char.age);
    // ... (以下、変更なし) ...
    prompts.push(`${char.hair.color} ${char.hair.style}`);
    prompts.push(`${char.eyes.color} eyes`);
    prompts.push(char.expression);
  }

  // --- 2. 衣装 ---
  if (flags.clothing && parts.clothingId) {
    const cloth = allClothing[parts.clothingId];
    if (cloth) {
      prompts.push("wearing");
      prompts.push(cloth.top);
      prompts.push(cloth.bottom);
      if (cloth.accessory) prompts.push(cloth.accessory);
    }
  }

  // --- 3. 背景 ---
  if (flags.background && parts.backgroundId) {
    const bg = allBackgrounds[parts.backgroundId];
    if (bg) {
      prompts.push(bg.location);
      prompts.push(bg.time);
      prompts.push(bg.weather);
    }
  }

  return prompts.join(', ');
}