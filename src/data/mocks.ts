// src/data/mocks.ts
import { FullDatabase, StableDiffusionParams } from './types/prompt';

// ★ デフォルトSDパラメータ
const defaultSdParams: StableDiffusionParams = {
  steps: 20,
  sampler_name: "Euler a",
  cfg_scale: 7,
  seed: -1,
  width: 512,
  height: 512,
  denoising_strength: 0.6,
};

export const initialMockDatabase: FullDatabase = {
  actors: {
    "actor_Taro": {
      id: "actor_Taro", name: "Taro (青髪)", tags: ["male"],
      prompt: "1boy, taro, blue hair, tall, handsome", negative_prompt: "ugly, old",
      base_costume_id: "costume_Uniform", base_pose_id: "pose_Standing", base_expression_id: "expr_Neutral",
      // ★ 追加
      work_title: "SchoolDays", 
      character_name: "TaroYamada",
    },
    "actor_Hanako": {
      id: "actor_Hanako", name: "Hanako (ピンク髪)", tags: ["female"],
      prompt: "1girl, hanako, pink hair, medium height, cute", negative_prompt: "ugly, old",
      base_costume_id: "costume_Casual", base_pose_id: "pose_Standing", base_expression_id: "expr_Smiling",
      // ★ 追加
      work_title: "SchoolDays", 
      character_name: "HanakoSuzuki",
    },
  },
  costumes: { "costume_Uniform": { id: "costume_Uniform", name: "School Uniform", tags: [], prompt: "wearing school uniform", negative_prompt: "torn" } , "costume_Casual": { id: "costume_Casual", name: "Casual Wear", tags: [], prompt: "wearing t-shirt and jeans", negative_prompt: "" }},
  poses: { "pose_Standing": { id: "pose_Standing", name: "Standing", tags: [], prompt: "standing", negative_prompt: "" }, "pose_Waving": { id: "pose_Waving", name: "Waving Hand", tags: [], prompt: "waving hand", negative_prompt: "" } },
  expressions: { "expr_Neutral": { id: "expr_Neutral", name: "Neutral", tags: [], prompt: "neutral expression", negative_prompt: "smiling" }, "expr_Smiling": { id: "expr_Smiling", name: "Smiling", tags: [], prompt: "smiling, open mouth", negative_prompt: "" } },
  backgrounds: { "bg_Park": { id: "bg_Park", name: "Park", tags: [], prompt: "in a park, green grass, bench", negative_prompt: "crowd, people" } },
  lighting: { "light_Day": { id: "light_Day", name: "Daytime", tags: [], prompt: "daytime, bright sunlight", negative_prompt: "dark, night" } },
  compositions: { "comp_Medium": { id: "comp_Medium", name: "Medium Shot", tags: [], prompt: "medium shot", negative_prompt: "cowboy shot" } },
  directions: {
    "dir_StandNeutral": { id: "dir_StandNeutral", name: "演出: 立つ (基本)", tags: [], prompt: "", negative_prompt: ""},
    "dir_Smile": { id: "dir_Smile", name: "演出: 微笑む", tags: [], expression_id: "expr_Smiling", prompt: "looking at camera", negative_prompt: ""},
    "dir_Wave": { id: "dir_Wave", name: "演出: 手を振る", tags: [], pose_id: "pose_Waving", prompt: "cheerful", negative_prompt: ""},
  },

  // --- Level 3: Scene (Template) ---
  scenes: {
    "scene_ParkMeeting": {
      id: "scene_ParkMeeting", name: "公園のベンチ (2人用)", tags: ["park"],
      prompt_template: "masterpiece, best quality, ([R1]) and ([R2]) sitting on a park bench, (2 people:1.2)",
      negative_template: "worst quality, low quality, watermark, signature, 3 people, crowd, ([R1]), ([R2])",
      background_id: "bg_Park", lighting_id: "light_Day", composition_id: "comp_Medium",
      roles: [ { id: "r1", name_in_scene: "主人公" }, { id: "r2", name_in_scene: "相手役" } ],
      role_directions: [
        { role_id: "r1", direction_ids: ["dir_Smile", "dir_Wave"] }, 
        { role_id: "r2", direction_ids: ["dir_StandNeutral"] }
      ],
      // ★ 追加
      reference_image_path: "", 
      image_mode: "txt2img",
    },
    "scene_SoloPortrait": {
      id: "scene_SoloPortrait", name: "公園のソロポートレート (1人用)", tags: ["park"],
      prompt_template: "masterpiece, best quality, solo focus, ([R1])",
      negative_template: "worst quality, low quality, watermark, signature, 2 people",
      background_id: "bg_Park", lighting_id: "light_Day", composition_id: "comp_Medium",
      roles: [ { id: "r1", name_in_scene: "モデル" } ],
      role_directions: [ { role_id: "r1", direction_ids: ["dir_Smile", "dir_Wave"] } ],
      // ★ 追加
      reference_image_path: "C:\\images\\portrait_ref.png", // 例: ローカルパス
      image_mode: "img2img",
    }
  },
  
  // ★ 追加: DBの一部としてSDパラメータを保存
  sdParams: defaultSdParams,
};