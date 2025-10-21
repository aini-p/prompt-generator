// src/utils/promptGenerator.ts
import { 
  FullDatabase, 
  GeneratedPrompt,
  PromptPartBase,
  Actor,
  SceneRole
} from './types/prompt';

// UIから渡される「配役」
export type ActorAssignments = Map<string, string>; // Key: role.id ("r1"), Value: actor.id ("actor_Taro")

/**
 * ユーティリティ: 配列の直積（デカルト積）を計算する
 * 入力: [ [A, B], [C, D] ]
 * 出力: [ [A, C], [A, D], [B, C], [B, D] ]
 */
function getCartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  
  const [first, ...rest] = arrays;
  const restProduct = getCartesianProduct(rest);
  
  return first.flatMap(f => {
    return restProduct.map(r => [f, ...r]);
  });
}

/**
 * 役者(Actor)と単一の演出(Direction)から、
 * その役者の最終的なプロンプトを生成する
 */
function generateActorPrompt(
  actor: Actor,
  directionId: string, // 適用する Direction の ID ( "" の場合は基本状態)
  db: FullDatabase
): { name: string, positive: string, negative: string } {

  const direction = db.directions[directionId];
  if (!direction) {
    // 演出が見つからない(ID="")場合は、役者の基本状態のみ
    const baseParts = [
      actor,
      db.costumes[actor.base_costume_id],
      db.poses[actor.base_pose_id],
      db.expressions[actor.base_expression_id],
    ].filter(Boolean);
    
    return {
      name: `${actor.name} (基本)`,
      positive: baseParts.map(p => p.prompt).filter(Boolean).join(', '),
      negative: baseParts.map(p => p.negative_prompt).filter(Boolean).join(', '),
    };
  }

  // 演出(Direction) に基づき、使用するパーツを「決定」
  const finalParts: PromptPartBase[] = [
    actor,
    direction.costume_id ? db.costumes[direction.costume_id] : db.costumes[actor.base_costume_id],
    direction.pose_id ? db.poses[direction.pose_id] : db.poses[actor.base_pose_id],
    direction.expression_id ? db.expressions[direction.expression_id] : db.expressions[actor.base_expression_id],
    direction, // 演出 (Direction) 自体もパーツとして追加
  ].filter(Boolean);

  return {
    name: `${actor.name} (${direction.name})`,
    positive: finalParts.map(p => p.prompt).filter(Boolean).join(', '),
    negative: finalParts.map(p => p.negative_prompt).filter(Boolean).join(', '),
  };
}


/**
 * v10: Scene と 配役(ActorAssignments) に基づき、
 * 複数のプロンプトをバッチ生成する
 */
export function generateBatchPrompts(
  sceneId: string,
  actorAssignments: ActorAssignments,
  db: FullDatabase
): GeneratedPrompt[] {

  const scene = db.scenes[sceneId];
  if (!scene) {
    return [{ cut: 0, name: "Error", positive: `[Error: Scene ${sceneId} not found]`, negative: "" }];
  }

  // --- 1. シーン共通パーツを準備 ---
  const commonParts: PromptPartBase[] = [
    db.backgrounds[scene.background_id],
    db.lighting[scene.lighting_id],
    db.compositions[scene.composition_id],
  ].filter(Boolean);
  
  const commonPositiveBase = [scene.prompt_template, ...commonParts.map(p => p.prompt)].filter(Boolean).join(', ');
  const commonNegativeBase = [scene.negative_template, ...commonParts.map(p => p.negative_prompt)].filter(Boolean).join(', ');

  // --- 2. 組み合わせ(直積)の準備 ---
  
  // 割り当てられた Role (r1, r2, ...) のリスト
  const assignedRoles: SceneRole[] = [];
  // 組み合わせるための「演出IDの配列の配列」
  const directionLists: string[][] = [];

  for (const role of scene.roles) {
    // このRoleにActorが割り当てられているか？
    if (actorAssignments.has(role.id)) {
      assignedRoles.push(role);
      
      // ★ v10: このRoleに割り当てられた演出リストを「Scene定義」から取得
      const roleDir = scene.role_directions.find(rd => rd.role_id === role.id);
      const directions = roleDir?.direction_ids || [];
      
      if (directions.length === 0) {
        // 演出が指定されてない場合、空の演出(ID="")を1つだけ指定（=役者の基本状態）
        directionLists.push([""]); 
      } else {
        directionLists.push(directions);
      }
    }
  }
  
  if (assignedRoles.length === 0) {
    // 役者が誰も割り当てられていない場合 (シーン共通プロンプトのみ)
    return [{
      cut: 1,
      name: `Scene Base: ${scene.name}`,
      positive: commonPositiveBase.replace(/\[[A-Z0-9]+\]/g, ''), // プレイスホルダーを除去
      negative: commonNegativeBase.replace(/\[[A-Z0-9]+\]/g, ''),
    }];
  }
  
  // --- 3. 演出の組み合わせ（直積）を計算 ---
  const allCombinations = getCartesianProduct(directionLists);

  // --- 4. 組み合わせをループしてプロンプトを生成 ---
  const generatedPrompts: GeneratedPrompt[] = [];
  let cutIndex = 1;

  for (const combination of allCombinations) {
    let finalPositive = commonPositiveBase;
    let finalNegative = commonNegativeBase;
    let cutNameParts: string[] = [];
    
    // combination = ["dir_smile", "dir_neutral"] (r1の演出, r2の演出)
    for (let i = 0; i < assignedRoles.length; i++) {
      const role = assignedRoles[i]; // {id: "r1", name: "主人公"}
      const directionId = combination[i]; // "dir_smile"
      const actorId = actorAssignments.get(role.id)!;
      const actor = db.actors[actorId];
      
      if (!actor) continue;

      // 役者 + 演出 のプロンプトを生成
      const actorPrompt = generateActorPrompt(actor, directionId, db);
      
      // ★ プレイスホルダー (例: [R1]) を置換
      const placeholder = `[${role.id.toUpperCase()}]`;
      // ( ) で囲んで挿入
      finalPositive = finalPositive.replace(placeholder, `(${actorPrompt.positive})`);
      finalNegative = finalNegative.replace(placeholder, `(${actorPrompt.negative})`);
      
      cutNameParts.push(actorPrompt.name);
    }
    
    // プレイスホルダーが残っている場合 (Actorが割り当てられていないRole) は削除
    finalPositive = finalPositive.replace(/\[[A-Z0-9]+\]/g, '');
    finalNegative = finalNegative.replace(/\[[A-Z0-9]+\]/g, '');

    generatedPrompts.push({
      cut: cutIndex++,
      name: cutNameParts.join(' & '),
      positive: finalPositive,
      negative: finalNegative,
    });
  }

  return generatedPrompts;
}