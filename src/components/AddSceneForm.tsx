// src/components/AddSceneForm.tsx

import React, { useState, useEffect } from 'react';
import { Scene, FullDatabase, SceneRole, RoleDirection } from '../types/prompt';

interface AddSceneFormProps {
  initialData: Scene | null; 
  db: FullDatabase; 
  onSave: (scene: Scene) => void;
  onCancel: () => void;
}

export const AddSceneForm: React.FC<AddSceneFormProps> = ({
  initialData,
  db,
  onSave,
  onCancel,
}) => {
  // --- フォームの内部状態 ---
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [negativeTemplate, setNegativeTemplate] = useState('');
  const [backgroundId, setBackgroundId] = useState('');
  const [lightingId, setLightingId] = useState('');
  const [compositionId, setCompositionId] = useState('');
  
  const [roles, setRoles] = useState<SceneRole[]>([]);
  // ★ v10: Roleごとの演出リスト
  const [roleDirections, setRoleDirections] = useState<RoleDirection[]>([]);

  // initialData が変更されたら、フォームをリセット
  useEffect(() => {
    if (initialData) {
      // 編集
      setName(initialData.name);
      setTags(initialData.tags.join(', '));
      setPromptTemplate(initialData.prompt_template);
      setNegativeTemplate(initialData.negative_template);
      setBackgroundId(initialData.background_id);
      setLightingId(initialData.lighting_id);
      setCompositionId(initialData.composition_id);
      setRoles(JSON.parse(JSON.stringify(initialData.roles)));
      setRoleDirections(JSON.parse(JSON.stringify(initialData.role_directions)));
    } else {
      // 新規
      setName('');
      setTags('');
      setPromptTemplate('masterpiece, best quality, ([R1])');
      setNegativeTemplate('worst quality, low quality');
      const newRoleId = 'r1';
      setRoles([{ id: newRoleId, name_in_scene: "主人公" }]);
      setRoleDirections([{ role_id: newRoleId, direction_ids: [] }]); // 演出リストも同期
      setBackgroundId(Object.keys(db.backgrounds)[0] || '');
      setLightingId(Object.keys(db.lighting)[0] || '');
      setCompositionId(Object.keys(db.compositions)[0] || '');
    }
  }, [initialData, db]);

  // --- Roles 編集ハンドラ ---
  const handleAddRole = () => {
    const nextRoleId = `r${roles.length + 1}`;
    // Role を追加
    setRoles(prevRoles => [
      ...prevRoles,
      { id: nextRoleId, name_in_scene: `配役 ${roles.length + 1}` }
    ]);
    // ★ Role に対応する 演出リスト も追加
    setRoleDirections(prevDirs => [
      ...prevDirs,
      { role_id: nextRoleId, direction_ids: [] }
    ]);
  };
  
  const handleRoleChange = (index: number, field: 'id' | 'name_in_scene', value: string) => {
    const oldRoleId = roles[index].id;
    const newRoleId = (field === 'id') ? value.toLowerCase() : oldRoleId;
    
    setRoles(prevRoles => 
      prevRoles.map((role, i) => 
        i === index ? { ...role, [field]: value } : role
      )
    );
    
    // ★ Role ID が変更されたら、演出リストの role_id も追従
    if (field === 'id' && oldRoleId !== newRoleId) {
      setRoleDirections(prevDirs =>
        prevDirs.map(dir => 
          dir.role_id === oldRoleId ? { ...dir, role_id: newRoleId } : dir
        )
      );
    }
  };
  
  const handleRemoveRole = (index: number) => {
    const roleIdToRemove = roles[index].id;
    // ★ 演出リストから該当 Role の定義を削除
    setRoleDirections(prevDirs => prevDirs.filter(dir => dir.role_id !== roleIdToRemove));
    // Role を削除
    setRoles(prevRoles => prevRoles.filter((_, i) => i !== index));
  };
  
  // --- RoleDirections 編集ハンドラ ---
  const handleAddDirectionToRole = (roleId: string, directionId: string) => {
    if (!directionId) return;
    setRoleDirections(prevDirs =>
      prevDirs.map(roleDir => {
        if (roleDir.role_id !== roleId) return roleDir;
        // 重複追加しない
        if (roleDir.direction_ids.includes(directionId)) return roleDir;
        return {
          ...roleDir,
          direction_ids: [...roleDir.direction_ids, directionId]
        };
      })
    );
  };
  
  const handleRemoveDirectionFromRole = (roleId: string, directionId: string) => {
     setRoleDirections(prevDirs =>
      prevDirs.map(roleDir => 
        roleDir.role_id === roleId 
        ? { ...roleDir, direction_ids: roleDir.direction_ids.filter(id => id !== directionId) } 
        : roleDir
      )
    );
  };


  // --- 保存処理 ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roleIds = roles.map(r => r.id);
    const hasDuplicate = roleIds.some((id, index) => roleIds.indexOf(id) !== index);
    if (hasDuplicate) {
      alert('配役(Role)のID (r1, r2...) が重複しています。'); return;
    }

    const savedScene: Scene = {
      id: initialData ? initialData.id : `scene_${Date.now()}`,
      name: name,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      prompt_template: promptTemplate,
      negative_template: negativeTemplate,
      background_id: backgroundId,
      lighting_id: lightingId,
      composition_id: compositionId,
      roles: roles,
      role_directions: roleDirections, // ★ v10
    };
    onSave(savedScene);
  };

  return (
    <div style={modalOverlayStyle}>
      <form onSubmit={handleSubmit} style={modalContentStyle}>
        <h3 style={{ marginTop: 0 }}>{initialData ? 'シーンを編集' : '新規シーンを追加'}</h3>

        {/* --- 基本情報 --- */}
        <div style={sectionStyle}>
          {/* (Name, Tags, Background, Lighting, Composition は v9 と同じ) */}
          <div style={formGroupStyle}><label>名前:</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} /></div>
          <div style={formGroupStyle}><label>タグ:</label><input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} /></div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px'}}>
            <select value={backgroundId} onChange={(e) => setBackgroundId(e.target.value)}>{Object.values(db.backgrounds).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            <select value={lightingId} onChange={(e) => setLightingId(e.target.value)}>{Object.values(db.lighting).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
            <select value={compositionId} onChange={(e) => setCompositionId(e.target.value)}>{Object.values(db.compositions).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
        </div>
        
        {/* --- 台本 (Prompt) 編集 (★ v9 と同じ) --- */}
        <div style={sectionStyle}>
          <strong>台本 (Prompt)</strong>
          <div style={formGroupStyle}>
            <label>Positive (プレイスホルダー `[R1]` などを使用):</label>
            <textarea value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)} style={{...inputStyle, height: '100px', fontFamily: 'monospace'}} />
          </div>
          <div style={formGroupStyle}>
            <label>Negative (プレイスホルダー `[R1]` などを使用):</label>
            <textarea value={negativeTemplate} onChange={(e) => setNegativeTemplate(e.target.value)} style={{...inputStyle, height: '60px', fontFamily: 'monospace'}} />
          </div>
        </div>

        {/* --- 配役 (Roles) & 演出 (Directions) 編集 (★ v10) --- */}
        <div style={sectionStyle}>
          <strong>配役 (Roles) と 演出リスト</strong>
          <p style={{fontSize: '0.8em', margin: '2px 0 5px 0', color: '#555'}}>
            ID (例: `r1`) を決めると、台本で `[R1]` として使えます。
          </p>
          {roles.map((role, index) => {
            const currentRoleDirs = roleDirections.find(rd => rd.role_id === role.id)?.direction_ids || [];
            return (
              <div key={role.id} style={{border: '1px solid #ddd', padding: '8px', margin: '5px 0', borderRadius: '4px'}}>
                {/* Role 編集 */}
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '5px', gap: '5px'}}>
                  <input type="text" value={role.id} onChange={(e) => handleRoleChange(index, 'id', e.target.value.toLowerCase())} style={{...inputStyle, width: '20%'}} placeholder="ID (r1)"/>
                  <input type="text" value={role.name_in_scene} onChange={(e) => handleRoleChange(index, 'name_in_scene', e.target.value)} style={{...inputStyle, width: '60%'}} placeholder="表示名 (主人公)"/>
                  <button type="button" onClick={() => handleRemoveRole(index)} style={tinyButtonStyle}>🗑️</button>
                </div>
                {/* 演出リスト 編集 */}
                <div style={{paddingLeft: '10px'}}>
                  <label style={{fontSize: '0.9em'}}>演出リスト:</label>
                  {currentRoleDirs.length === 0 && <div style={{fontSize: '0.8em', color: '#777'}}> (演出なし - 役者の基本状態を使用)</div>}
                  {currentRoleDirs.map(dirId => (
                    <div key={dirId} style={directionItemStyle}>
                      <span>{db.directions[dirId]?.name || 'N/A'}</span>
                      <button type="button" onClick={() => handleRemoveDirectionFromRole(role.id, dirId)} style={tinyButtonStyle}>🗑️</button>
                    </div>
                  ))}
                  <select onChange={(e) => handleAddDirectionToRole(role.id, e.target.value)} value={""} style={{width: '100%', marginTop: '4px', fontSize: '0.9em'}}>
                    <option value="">＋ 演出を追加...</option>
                    {Object.values(db.directions).map(dir => <option key={dir.id} value={dir.id}>{dir.name}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
          <button type="button" onClick={handleAddRole} style={tinyButtonStyle}>＋ 配役を追加</button>
        </div>

        {/* --- 保存/キャンセル --- */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={onCancel} style={{ backgroundColor: '#6c757d', color: 'white' }}>キャンセル</button>
          <button type="submit" style={{ backgroundColor: '#007bff', color: 'white' }}>保存</button>
        </div>
      </form>
    </div>
  );
};

// --- スタイル定義 ---
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalContentStyle: React.CSSProperties = {
  border: '1px solid #ccc', padding: '20px', backgroundColor: 'white',
  borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto'
};
const formGroupStyle: React.CSSProperties = {
  marginBottom: '10px', display: 'flex', flexDirection: 'column',
};
const inputStyle: React.CSSProperties = {
  width: '95%', padding: '8px', marginTop: '4px', fontSize: '14px',
};
const sectionStyle: React.CSSProperties = {
  marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee',
};
const tinyButtonStyle: React.CSSProperties = {
  fontSize: '10px', padding: '2px 4px', margin: '0 2px',
};
const directionItemStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', padding: '2px 4px', 
  fontSize: '0.9em', backgroundColor: '#f9f9f9', margin: '2px 0', borderRadius: '3px'
};