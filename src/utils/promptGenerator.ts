// src/utils/promptGenerator.ts
import { 
  FullDatabase, 
  GeneratedPrompt,
  PromptPartBase,
  Actor,
  Scene, // ★ 追加
  StableDiffusionParams, // ★ 追加
  ImageGenerationTask // ★ 追加
} from './types/prompt';

export type ActorAssignments = Map<string, string>; // Key: role.id ("r1"), Value: actor.id ("actor_Taro")

// (getCartesianProduct, generateActorPrompt は v10 と同じ)
function getCartesianProduct<T>(arrays: T[][]): T[][] { /* ... */ }
function generateActorPrompt(actor: Actor, directionId: string, db: FullDatabase): { name: string, positive: string, negative: string } { /* ... */ }


/**
 * v10/v11: Scene と 配役(ActorAssignments) に基づき、
 * 複数のプロンプト(Positive/Negative)をバッチ生成する
 * ★ 変更: firstActorInfo を追加
 */
export function generateBatchPrompts(
  sceneId: string,
  actorAssignments: ActorAssignments,
  db: FullDatabase
): GeneratedPrompt[] {

  const scene = db.scenes[sceneId];
  if (!scene) { /* ... エラー処理 ... */ }

  // --- 1. シーン共通パーツと共通プロンプト ---
  const commonParts: PromptPartBase[] = [ /* ... */ ].filter(Boolean);
  const commonPositiveBase = [scene.prompt_template, ...commonParts.map(p => p.prompt)].filter(Boolean).join(', ');
  const commonNegativeBase = [scene.negative_template, ...commonParts.map(p => p.negative_prompt)].filter(Boolean).join(', ');

  // --- 2. 組み合わせ(直積)の準備 ---
  const assignedRoles: SceneRole[] = [];
  const directionLists: string[][] = [];
  let firstActor: Actor | null = null; // ★ ファイル名用に最初の役者を取得

  for (const role of scene.roles) {
    const actorId = actorAssignments.get(role.id);
    if (actorId) {
      assignedRoles.push(role);
      const actor = db.actors[actorId];
      if (actor && !firstActor) { // ★ 最初の割り当て役者を保存
          firstActor = actor;
      }
      
      const roleDir = scene.role_directions.find(rd => rd.role_id === role.id);
      const directions = roleDir?.direction_ids || [];
      directionLists.push(directions.length === 0 ? [""] : directions);
    }
  }
  
  if (assignedRoles.length === 0) { /* ... 役者なしの場合の処理 ... */ }
  
  // --- 3. 演出の組み合わせ（直積）を計算 ---
  const allCombinations = getCartesianProduct(directionLists);

  // --- 4. 組み合わせをループしてプロンプトを生成 ---
  const generatedPrompts: GeneratedPrompt[] = [];
  let cutIndex = 1;

  for (const combination of allCombinations) {
    let finalPositive = commonPositiveBase;
    let finalNegative = commonNegativeBase;
    let cutNameParts: string[] = [];
    
    for (let i = 0; i < assignedRoles.length; i++) {
      const role = assignedRoles[i]; 
      const directionId = combination[i];
      const actorId = actorAssignments.get(role.id)!;
      const actor = db.actors[actorId];
      
      if (!actor) continue;
      const actorPrompt = generateActorPrompt(actor, directionId, db);
      const placeholder = `[${role.id.toUpperCase()}]`;
      finalPositive = finalPositive.replace(placeholder, `(${actorPrompt.positive})`);
      finalNegative = finalNegative.replace(placeholder, `(${actorPrompt.negative})`);
      cutNameParts.push(actorPrompt.name);
    }
    
    finalPositive = finalPositive.replace(/\[[A-Z0-9]+\]/g, '');
    finalNegative = finalNegative.replace(/\[[A-Z0-9]+\]/g, '');

    generatedPrompts.push({
      cut: cutIndex++,
      name: cutNameParts.join(' & '),
      positive: finalPositive,
      negative: finalNegative,
      // ★ firstActorInfo を追加
      firstActorInfo: firstActor ? { 
        work_title: firstActor.work_title, 
        character_name: firstActor.character_name 
      } : undefined,
    });
  }

  return generatedPrompts;
}


/**
 * ★ v11: 生成されたプロンプト配列とSD設定から、
 * StableDiffusionClient 用の tasks.json データ配列を生成する
 */
export function createImageGenerationTasks(
  generatedPrompts: GeneratedPrompt[],
  sdParams: StableDiffusionParams,
  scene: Scene | null // 現在選択中の Scene オブジェクト
): ImageGenerationTask[] {
  
  if (!scene) return [];

  const tasks: ImageGenerationTask[] = [];

  for (const promptData of generatedPrompts) {
    // --- filename_prefix の生成 ---
    let filename_prefix = `output_${promptData.cut}`; // デフォルト値
    if (promptData.firstActorInfo) {
      // アンダースコアで連結 (スペースなどは置換した方が安全だが、モックでは省略)
      filename_prefix = `${promptData.firstActorInfo.work_title}_${promptData.firstActorInfo.character_name}_cut${promptData.cut}`;
    }

    // --- mode と source_image_path の決定 ---
    let mode = scene.image_mode;
    let source_image_path = scene.reference_image_path;
    // 参考画像パスが空なら強制的に txt2img
    if (!source_image_path) {
      mode = "txt2img";
      source_image_path = ""; // source_image_path も空にする
    }
    
    // --- denoising_strength の設定 ---
    // txt2img 以外の場合のみ設定、それ以外は空文字か無視される値
    const denoising_strength = (mode !== "txt2img") ? sdParams.denoising_strength : "";

    // --- タスクオブジェクトの構築 ---
    const task: ImageGenerationTask = {
      prompt: promptData.positive,
      negative_prompt: promptData.negative,
      steps: sdParams.steps,
      sampler_name: sdParams.sampler_name,
      cfg_scale: sdParams.cfg_scale,
      seed: sdParams.seed,
      width: sdParams.width,
      height: sdParams.height,
      mode: mode,
      filename_prefix: filename_prefix,
      source_image_path: source_image_path,
      denoising_strength: denoising_strength,
    };
    tasks.push(task);
  }

  return tasks;
}