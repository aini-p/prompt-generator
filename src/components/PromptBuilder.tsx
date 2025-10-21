// src/components/PromptBuilder.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { initialMockDatabase } from '../data/mocks';
import { generateBatchPrompts, ActorAssignments } from '../utils/promptGenerator'; // ★ DirectionAssignments を削除
import { 
  FullDatabase, STORAGE_KEYS, Scene, Actor, Direction, PromptPartBase, GeneratedPrompt
} from '../types/prompt';

// --- フォームをすべてインポート ---
import { AddActorForm } from './AddActorForm';
import { AddSceneForm } from './AddSceneForm';
import { AddDirectionForm } from './AddDirectionForm';
import { AddSimplePartForm } from './AddSimplePartForm';

// ... (loadFromStorage ヘルパー関数は変更なし) ...
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) { console.warn(error); return fallback; }
}

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

type DatabaseKey = keyof FullDatabase;

export const PromptBuilder: React.FC = () => {

  // --- 状態 (State) 管理 ---
  const [db, setDb] = useState<FullDatabase>(() => {
    const loadedDb: any = {};
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      loadedDb[key] = loadFromStorage(storageKey, (initialMockDatabase as any)[key]);
    }
    return loadedDb as FullDatabase;
  });

  const [selectedSceneId, setSelectedSceneId] = useState<string>(() => {
    return Object.keys(db.scenes)[0] || '';
  });

  // ★ v10: 配役
  const [actorAssignments, setActorAssignments] = useState<ActorAssignments>(new Map());
  // (★ v10: 演出リストの state は不要になったので削除)
  
  const [finalPrompts, setFinalPrompts] = useState<GeneratedPrompt[]>([]); 
  const [modal, setModal] = useState<ModalState | null>(null);

  // --- メモ化 ---
  const allScenes = useMemo(() => Object.values(db.scenes), [db.scenes]);
  const allActors = useMemo(() => Object.values(db.actors), [db.actors]);
  // (allDirections は LibraryList でのみ使うのでメモ化不要)
  const selectedScene = useMemo(
    () => db.scenes[selectedSceneId] || null,
    [selectedSceneId, db.scenes]
  );

  // ★ シーン変更時に State をリセット
  useEffect(() => {
    setActorAssignments(new Map());
    setFinalPrompts([]); 
  }, [selectedSceneId]);
  
  // (シーン削除時のフォールバック - 変更なし)
  useEffect(() => {
    if (allScenes.length > 0 && !db.scenes[selectedSceneId]) {
      setSelectedSceneId(allScenes[0].id);
    } else if (allScenes.length === 0) { setSelectedSceneId(''); }
  }, [db.scenes, selectedSceneId, allScenes]);

  // --- ハンドラ: データ管理 (Save/Export/Import) ---
  const handleSaveToLocal = () => { /* ... (変更なし) ... */ };
  const handleExport = () => { /* ... (変更なし) ... */ };
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... (変更なし) ... */ };


  // --- ハンドラ: 汎用 CRUD ---
  const handleSavePart = (dbKey: DatabaseKey, part: PromptPartBase | Actor | Scene | Direction) => {
    setDb(prevDb => ({ ...prevDb, [dbKey]: { ...prevDb[dbKey], [part.id]: part } }));
    setModal(null);
    if (dbKey === 'scenes') setSelectedSceneId(part.id);
  };
  
  const handleDeletePart = (dbKey: DatabaseKey, partId: string) => {
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
      // (★ v10: 演出リストは Scene 側が持つので、Direction 削除時のロジックは不要)
      return newFullDb;
    });
  };
  
  // (LibraryList コンポーネントは変更なし)
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
  
  // --- ハンドラ: v10 プロンプト生成 ---
  
  // ★ 配役(Actor)の割り当て
  const handleRoleAssignment = (roleId: string, actorId: string) => {
    setActorAssignments(prevMap => new Map(prevMap).set(roleId, actorId));
    setFinalPrompts([]); // 配役を変えたら生成結果をリセット
  };

  // ★ バッチ生成
  const handleGenerate = () => {
    if (!selectedScene) { alert("シーンが選択されていません。"); return; }
    for (const role of selectedScene.roles) {
      if (!actorAssignments.get(role.id)) {
        alert(`配役「${role.name_in_scene}」が設定されていません。`); return;
      }
    }
    // ★ v10: 演出リスト(directionAssignments) を渡す必要がなくなった
    const prompts: GeneratedPrompt[] = generateBatchPrompts(selectedSceneId, actorAssignments, db);
    setFinalPrompts(prompts);
  };


  return (
    <>
      <div style={{ display: 'flex', fontFamily: 'sans-serif', height: '100vh' }}>
        
        {/* --- 左側：設定・編集エリア --- */}
        <div style={{ width: '450px', padding: '10px', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
          
          <div style={sectionStyle}>
            <h3>データ管理</h3>
            {/* (v8 と同じ Save/Export/Import UI) */}
            <div style={buttonGridStyle(3)}>
              <button onClick={handleSaveToLocal} style={{...buttonStyle, backgroundColor: '#007bff'}}>💾 保存</button>
              <button onClick={handleExport} style={{...buttonStyle, backgroundColor: '#17a2b8'}}>📤 エクスポート</button>
              <label style={{...buttonStyle, backgroundColor: '#28a745', textAlign: 'center'}}>
                📥 インポート
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </label>
            </div>
          </div>
          
          {/* --- ★ v10 プロンプト生成 UI --- */}
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
                    // ★ 演出リストのUIを削除
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
            
            <button onClick={handleGenerate} style={{...buttonStyle, width: '100%', marginTop: '15px', fontSize: '18px', backgroundColor: '#28a745'}} disabled={!selectedScene}>
              ⚡️ バッチ生成
            </button>
          </div>

          {/* --- ライブラリ編集 (アコーディオン UI) --- */}
          <div style={sectionStyle}>
            <h3>ライブラリ編集</h3>
            <details>
              <summary>Scenes (シーン)</summary>
              <LibraryList dbKey="scenes" modalType="SCENE" />
            </details>
            <details>
              <summary>Actors (役者)</summary>
              <LibraryList dbKey="actors" modalType="ACTOR" />
            </details>
            <details>
              <summary>Directions (演出)</summary>
              <LibraryList dbKey="directions" modalType="DIRECTION" />
            </details>
            <details>
              <summary>Costumes (衣装)</summary>
              <LibraryList dbKey="costumes" modalType="COSTUME" />
            </details>
            <details>
              <summary>Poses (ポーズ)</summary>
              <LibraryList dbKey="poses" modalType="POSE" />
            </details>
            <details>
              <summary>Expressions (表情)</summary>
              <LibraryList dbKey="expressions" modalType="EXPRESSION" />
            </details>
            <details>
              <summary>Backgrounds (背景)</summary>
              <LibraryList dbKey="backgrounds" modalType="BACKGROUND" />
            </details>
            <details>
              <summary>Lighting (照明)</summary>
              <LibraryList dbKey="lighting" modalType="LIGHTING" />
            </details>
            <details>
              <summary>Compositions (構図)</summary>
              <LibraryList dbKey="compositions" modalType="COMPOSITION" />
            </details>
          </div>

        </div>

        {/* --- 右側：結果表示エリア --- */}
        <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
          <h2>生成されたプロンプト (バッチ処理)</h2>
          {finalPrompts.length === 0 && (
            <p>「バッチ生成」ボタンを押してください</p>
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
      {/* (v9 と同じ) */}
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
// (v8の directionItemStyle は不要になったので削除)