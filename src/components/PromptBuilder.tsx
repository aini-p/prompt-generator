// src/components/PromptBuilder.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { initialMockDatabase } from '../data/mocks';
// ★ createImageGenerationTasks をインポート
import { generateBatchPrompts, ActorAssignments, createImageGenerationTasks } from '../utils/promptGenerator';
import {
  FullDatabase, STORAGE_KEYS, Scene, Actor, Direction, PromptPartBase, GeneratedPrompt,
  StableDiffusionParams, ImageGenerationTask // ★ インポート
} from '../types/prompt';

// --- フォームをすべてインポート ---
import { AddActorForm } from './AddActorForm';
import { AddSceneForm } from './AddSceneForm';
import { AddDirectionForm } from './AddDirectionForm';
import { AddSimplePartForm } from './AddSimplePartForm';

// --- DBを読み込むヘルパー関数 ---
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage`, error);
    return fallback;
  }
}

// ★ 汎用モーダルフォームの型
type ModalState =
  | { type: "ACTOR", data: Actor | null }
  | { type: "SCENE", data: Scene | null }
  | { type: "DIRECTION", data: Direction | null }
  | { type: "COSTUME", data: PromptPartBase | null }
  | { type: "POSE", data: PromptPartBase | null }
  | { type: "EXPRESSION", data: PromptPartBase | null }
  | { type: "BACKGROUND", data: PromptPartBase | null }
  | { type: "LIGHTING", data: PromptPartBase | null }
  | { type: "COMPOSITION", data: PromptPartBase | null };

// ★ DBのキーの型
type DatabaseKey = keyof FullDatabase;

export const PromptBuilder: React.FC = () => {

  // --- 状態 (State) 管理 ---
  const [db, setDb] = useState<FullDatabase>(() => {
    const loadedDb: any = {};
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      // sdParams も読み込む
      loadedDb[key] = loadFromStorage(storageKey, (initialMockDatabase as any)[key]);
    }
    return loadedDb as FullDatabase;
  });

  const [selectedSceneId, setSelectedSceneId] = useState<string>(() => {
    return Object.keys(db.scenes)[0] || '';
  });

  const [actorAssignments, setActorAssignments] = useState<ActorAssignments>(new Map());
  const [finalPrompts, setFinalPrompts] = useState<GeneratedPrompt[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);

  // ★ 追加: SDパラメータ用 State
  const [sdParams, setSdParams] = useState<StableDiffusionParams>(db.sdParams);

  // --- メモ化 ---
  const allScenes = useMemo(() => Object.values(db.scenes), [db.scenes]);
  const allActors = useMemo(() => Object.values(db.actors), [db.actors]);
  const selectedScene = useMemo(
    () => db.scenes[selectedSceneId] || null,
    [selectedSceneId, db.scenes]
  );

  // (useEffect フックは変更なし)
  useEffect(() => { setActorAssignments(new Map()); setFinalPrompts([]); }, [selectedSceneId]);
  useEffect(() => {
    if (allScenes.length > 0 && !db.scenes[selectedSceneId]) {
      setSelectedSceneId(allScenes[0].id);
    } else if (allScenes.length === 0) { setSelectedSceneId(''); }
   }, [db.scenes, selectedSceneId, allScenes]);

  // --- ハンドラ: データ管理 (Save/Export/Import) ---
  const handleSaveToLocal = () => {
    try {
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        // ★ sdParams も保存
        localStorage.setItem(storageKey, JSON.stringify((db as any)[key]));
      }
      // ★ sdParams の state も保存
      localStorage.setItem(STORAGE_KEYS.sdParams, JSON.stringify(sdParams));
      alert('現在の全設定をブラウザに保存しました！');
    } catch (error) { console.error(error); alert('保存に失敗'); }
  };

  const handleExport = () => {
    // ★ sdParams も含めてエクスポート
    const dataToExport = { ...db, sdParams: sdParams };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-builder-full-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a); // 後片付け
    URL.revokeObjectURL(url); // 後片付け
    alert('現在の全データをJSONファイルとしてエクスポートしました。');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (e) => {
       try {
         const text = e.target?.result as string;
         const importedData = JSON.parse(text) as Partial<FullDatabase>;
         // ★ sdParams も含めて全キーをチェック
         const allKeysPresent = Object.keys(STORAGE_KEYS).every(key => (importedData as any)[key] !== undefined);

         if (allKeysPresent) {
           const fullImportedData = importedData as FullDatabase;
           // ★ DB state を更新
           setDb(fullImportedData);
           // ★ SD params state も更新
           setSdParams(fullImportedData.sdParams);

           // localStorage も更新
           for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
             localStorage.setItem(storageKey, JSON.stringify((fullImportedData as any)[key]));
           }

           alert('インポート成功！ページがリフレッシュされます。');
           window.location.reload();
         } else {
           throw new Error('ファイルの形式が正しくありません。(必要なキーが不足)');
         }
       } catch (error) {
         console.error("Failed to import file", error);
         alert(`インポート失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
       }
     };
     reader.readAsText(file);
     event.target.value = '';
   };


  // --- ハンドラ: 汎用 CRUD ---
  const handleSavePart = (dbKey: DatabaseKey, part: PromptPartBase | Actor | Scene | Direction) => {
    // ★ sdParams は別で保存するので除外
    if (dbKey === 'sdParams') {
        setSdParams(part as StableDiffusionParams);
    } else {
        setDb(prevDb => ({
          ...prevDb,
          [dbKey]: {
            ...prevDb[dbKey],
            [part.id]: part
          }
        }));
    }
    setModal(null); // フォームを閉じる
    if (dbKey === 'scenes') setSelectedSceneId(part.id);
  };

  const handleDeletePart = (dbKey: DatabaseKey, partId: string) => {
    // ★ sdParams は削除できない
    if (dbKey === 'sdParams') return;

    const partName = (db as any)[dbKey][partId]?.name || 'アイテム';
    if (!window.confirm(`「${partName}」(${dbKey}) を本当に削除しますか？`)) return;

    setDb(prevDb => {
      const newPartDb = { ...prevDb[dbKey] };
      delete newPartDb[partId];
      const newFullDb = { ...prevDb, [dbKey]: newPartDb };

      if (dbKey === 'actors') {
        // 削除された役者を配役から外す
        setActorAssignments(prev => {
          const newMap = new Map(prev);
          newMap.forEach((val, key) => { if (val === partId) newMap.delete(key); });
          return newMap;
        });
      }
      // (Directions削除時のロジックはv10で不要に)
      return newFullDb;
    });
  };

  const LibraryList: React.FC<{
    dbKey: DatabaseKey;
    modalType: ModalState['type'];
  }> = ({ dbKey, modalType }) => (
    <div style={libraryListStyle}>
      <button onClick={() => setModal({ type: modalType, data: null })} style={{...tinyButtonStyle, width: '100%', backgroundColor: '#eee'}}>
        ＋ 新規追加
      </button>
      {Object.values(db[dbKey]).map(part => (
        <div key={part.id} style={libraryItemStyle}>
          <span>{part.name}</span>
          <div>
            <button onClick={() => setModal({ type: modalType, data: part as any })} style={tinyButtonStyle}>✏️</button>
            <button onClick={() => handleDeletePart(dbKey, part.id)} style={tinyButtonStyle}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );

  // --- ハンドラ: プロンプト生成 ---
  const handleRoleAssignment = (roleId: string, actorId: string) => {
    setActorAssignments(prevMap => new Map(prevMap).set(roleId, actorId));
    setFinalPrompts([]);
  };

  const handleGenerate = () => {
    if (!selectedScene) { alert("シーン選択"); return; }
    if (!selectedScene.roles.every(r => actorAssignments.has(r.id))) { alert("配役未設定"); return; }

    const prompts: GeneratedPrompt[] = generateBatchPrompts(selectedSceneId, actorAssignments, db);
    setFinalPrompts(prompts);
  };

  // ★ 追加: SDパラメータ変更ハンドラ
  const handleSdParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSdParams(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
    // SDパラメータが変わったら生成結果はリセット
    setFinalPrompts([]);
  };

  // ★ 追加: 画像生成実行 (JSONダウンロード) ハンドラ
  const handleExecuteGeneration = () => {
    if (finalPrompts.length === 0) {
      alert('先に「プロンプト プレビュー生成」ボタンを押してプロンプトを生成してください。');
      return;
    }

    // tasks.json データを生成
    const tasks: ImageGenerationTask[] = createImageGenerationTasks(
      finalPrompts,
      sdParams,
      selectedScene
    );

    // JSON文字列に変換してダウンロード
    const jsonString = JSON.stringify(tasks, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_${selectedScene?.name || 'scene'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('画像生成タスクファイル (tasks.json) をダウンロードしました。\n' +
          'StableDiffusionClient ディレクトリで以下のコマンドを実行してください:\n\n' +
          'start_all.bat --taskSourceType json --localTaskFile "ダウンロードしたファイルのパス"');
  };


  return (
    <>
      <div style={{ display: 'flex', fontFamily: 'sans-serif', height: '100vh' }}>

        {/* --- 左側：設定・編集エリア --- */}
        <div style={{ width: '450px', padding: '10px', borderRight: '1px solid #ccc', overflowY: 'auto' }}>

          <div style={sectionStyle}>
            <h3>データ管理</h3>
            <div style={buttonGridStyle(3)}>
              <button onClick={handleSaveToLocal} style={{...buttonStyle, backgroundColor: '#007bff'}}>💾 保存</button>
              <button onClick={handleExport} style={{...buttonStyle, backgroundColor: '#17a2b8'}}>📤 エクスポート</button>
              <label style={{...buttonStyle, backgroundColor: '#28a745', textAlign: 'center'}}>
                📥 インポート
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </label>
            </div>
          </div>

          {/* --- v11 プロンプト生成 UI --- */}
          <div style={sectionStyle}>
            <h3>プロンプト生成</h3>
            <strong>1. シーンを選択</strong>
            <select
              value={selectedSceneId}
              onChange={(e) => setSelectedSceneId(e.target.value)}
              style={{ width: '100%', fontSize: '16px', marginBottom: '10px' }}
            >
              {allScenes.length === 0 && <option value="" disabled>シーンがありません</option>}
              {allScenes.map(scene => <option key={scene.id} value={scene.id}>{scene.name}</option>)}
            </select>

            {selectedScene && (
              <>
                <strong>2. 配役 (Role) を割り当て</strong>
                {selectedScene.roles.map(role => {
                  const assignedActorId = actorAssignments.get(role.id);
                  return (
                    <div key={role.id} style={{border: '1px solid #ddd', padding: '8px', margin: '5px 0', borderRadius: '4px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <label style={{fontWeight: 'bold'}}>{role.name_in_scene} (<code>[{role.id.toUpperCase()}]</code>):</label>
                        <select
                          value={assignedActorId || ''}
                          onChange={(e) => handleRoleAssignment(role.id, e.target.value)}
                          style={{width: '60%', fontSize: '14px'}}
                        >
                          <option value="" disabled>-- 役者を選択 --</option>
                          {allActors.map(actor => <option key={actor.id} value={actor.id}>{actor.name}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <button
              onClick={handleGenerate}
              style={{...buttonStyle, width: '100%', marginTop: '15px', fontSize: '18px', backgroundColor: '#ffc107'}}
              disabled={!selectedScene}
            >
              🔄 プロンプト プレビュー生成
            </button>

            {/* ★ 追加: 画像生成実行ボタン */}
            <button
              onClick={handleExecuteGeneration}
              style={{...buttonStyle, width: '100%', marginTop: '10px', fontSize: '18px', backgroundColor: '#28a745'}}
              disabled={!selectedScene || finalPrompts.length === 0} // プロンプト生成後に押せる
            >
              🚀 画像生成実行 (JSON出力)
            </button>
          </div>

          {/* --- ライブラリ編集 (アコーディオン UI) --- */}
          <div style={sectionStyle}>
            <h3>ライブラリ編集</h3>
            {/* ★ 追加: SDパラメータ編集 */}
            <details>
              <summary>Stable Diffusion パラメータ</summary>
              <div style={libraryListStyle}> {/* 再利用 */}
                 <div style={sdParamRowStyle}>
                   <label>Steps:</label>
                   <input type="number" name="steps" value={sdParams.steps} onChange={handleSdParamChange} style={sdInputStyle}/>
                 </div>
                 <div style={sdParamRowStyle}>
                   <label>Sampler:</label>
                   <input type="text" name="sampler_name" value={sdParams.sampler_name} onChange={handleSdParamChange} style={sdInputStyle}/>
                 </div>
                 <div style={sdParamRowStyle}>
                   <label>CFG Scale:</label>
                   <input type="number" step="0.5" name="cfg_scale" value={sdParams.cfg_scale} onChange={handleSdParamChange} style={sdInputStyle}/>
                 </div>
                 <div style={sdParamRowStyle}>
                   <label>Seed (-1=Random):</label>
                   <input type="number" name="seed" value={sdParams.seed} onChange={handleSdParamChange} style={sdInputStyle}/>
                 </div>
                 <div style={sdParamRowStyle}>
                   <label>Width:</label>
                   <input type="number" step="64" name="width" value={sdParams.width} onChange={handleSdParamChange} style={sdInputStyle}/>
                 </div>
                 <div style={sdParamRowStyle}>
                   <label>Height:</label>
                   <input type="number" step="64" name="height" value={sdParams.height} onChange={handleSdParamChange} style={sdInputStyle}/>
                 </div>
                 <div style={sdParamRowStyle}>
                   <label>Denoising (img2img):</label>
                   <input type="number" step="0.05" min="0" max="1" name="denoising_strength" value={sdParams.denoising_strength} onChange={handleSdParamChange} style={sdInputStyle}/>
                 </div>
              </div>
            </details>
            {/* (他のアコーディオンは v9 と同じ) */}
            <details><summary>Scenes (シーン)</summary><LibraryList dbKey="scenes" modalType="SCENE" /></details>
            <details><summary>Actors (役者)</summary><LibraryList dbKey="actors" modalType="ACTOR" /></details>
            <details><summary>Directions (演出)</summary><LibraryList dbKey="directions" modalType="DIRECTION" /></details>
            <details><summary>Costumes (衣装)</summary><LibraryList dbKey="costumes" modalType="COSTUME" /></details>
            <details><summary>Poses (ポーズ)</summary><LibraryList dbKey="poses" modalType="POSE" /></details>
            <details><summary>Expressions (表情)</summary><LibraryList dbKey="expressions" modalType="EXPRESSION" /></details>
            <details><summary>Backgrounds (背景)</summary><LibraryList dbKey="backgrounds" modalType="BACKGROUND" /></details>
            <details><summary>Lighting (照明)</summary><LibraryList dbKey="lighting" modalType="LIGHTING" /></details>
            <details><summary>Compositions (構図)</summary><LibraryList dbKey="compositions" modalType="COMPOSITION" /></details>
          </div>

        </div>

        {/* --- 右側：結果表示エリア --- */}
        <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
          <h2>生成されたプロンプト (プレビュー)</h2>
          {finalPrompts.length === 0 && (
            <p>「プロンプト プレビュー生成」ボタンを押してください</p>
          )}
          {finalPrompts.map((p, index) => (
            <div key={index} style={{marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px'}}>
              <h4 style={{margin: 0, padding: '5px 8px', backgroundColor: '#f4f4f4'}}>{p.name}</h4>
              <div style={{padding: '5px 8px'}}>
                <strong>Positive:</strong>
                <textarea readOnly value={p.positive} style={promptAreaStyle} rows={3} />
                <strong>Negative:</strong>
                <textarea readOnly value={p.negative} style={promptAreaStyle} rows={2} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- 汎用モーダルフォーム --- */}
      {modal?.type === "ACTOR" && (
        <AddActorForm initialData={modal.data} db={db}
          onSave={(part) => handleSavePart("actors", part)}
          onCancel={() => setModal(null)} />
      )}
      {modal?.type === "SCENE" && (
        <AddSceneForm initialData={modal.data} db={db}
          onSave={(part) => handleSavePart("scenes", part)}
          onCancel={() => setModal(null)} />
      )}
      {modal?.type === "DIRECTION" && (
        <AddDirectionForm initialData={modal.data} db={db}
          onSave={(part) => handleSavePart("directions", part)}
          onCancel={() => setModal(null)} />
      )}
      {modal?.type === "COSTUME" && ( <AddSimplePartForm initialData={modal.data} objectType="Costume" onSave={(part) => handleSavePart("costumes", part)} onCancel={() => setModal(null)} /> )}
      {modal?.type === "POSE" && ( <AddSimplePartForm initialData={modal.data} objectType="Pose" onSave={(part) => handleSavePart("poses", part)} onCancel={() => setModal(null)} /> )}
      {modal?.type === "EXPRESSION" && ( <AddSimplePartForm initialData={modal.data} objectType="Expression" onSave={(part) => handleSavePart("expressions", part)} onCancel={() => setModal(null)} /> )}
      {modal?.type === "BACKGROUND" && ( <AddSimplePartForm initialData={modal.data} objectType="Background" onSave={(part) => handleSavePart("backgrounds", part)} onCancel={() => setModal(null)} /> )}
      {modal?.type === "LIGHTING" && ( <AddSimplePartForm initialData={modal.data} objectType="Lighting" onSave={(part) => handleSavePart("lighting", part)} onCancel={() => setModal(null)} /> )}
      {modal?.type === "COMPOSITION" && ( <AddSimplePartForm initialData={modal.data} objectType="Composition" onSave={(part) => handleSavePart("compositions", part)} onCancel={() => setModal(null)} /> )}
    </>
  );
};

// --- スタイル定義 ---
const buttonStyle: React.CSSProperties = {
  padding: '10px', color: 'white', border: 'none',
  cursor: 'pointer', fontSize: '14px', borderRadius: '4px', lineHeight: '1.5',
};
const buttonGridStyle = (columns: number): React.CSSProperties => ({
  display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '10px',
});
const sectionStyle: React.CSSProperties = {
  marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #eee',
};
const tinyButtonStyle: React.CSSProperties = {
  fontSize: '10px', padding: '2px 4px', margin: '0 2px',
};
const libraryListStyle: React.CSSProperties = {
  maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', marginTop: '5px', padding: '5px'
};
const libraryItemStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f9f9f9'
};
const promptAreaStyle: React.CSSProperties = {
  width: '95%', fontSize: '0.9em', padding: '4px', margin: '2px 0 5px 0', display: 'block',
  boxSizing: 'border-box'
};
// ★ 追加: SDパラメータ用スタイル
const sdParamRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '3px 0' };
const sdInputStyle: React.CSSProperties = { width: '60%' };