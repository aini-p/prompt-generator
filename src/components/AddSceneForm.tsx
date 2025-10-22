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
  const [roleDirections, setRoleDirections] = useState<RoleDirection[]>([]);
  const [refImagePath, setRefImagePath] = useState(''); // ★ 追加
  const [imageMode, setImageMode] = useState<Scene['image_mode']>('txt2img'); // ★ 追加

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
      setRefImagePath(initialData.reference_image_path); // ★ 追加
      setImageMode(initialData.image_mode); // ★ 追加
    } else {
      // 新規
      setName('');
      setTags('');
      setPromptTemplate('masterpiece, best quality, ([R1])');
      setNegativeTemplate('worst quality, low quality');
      const newRoleId = 'r1';
      setRoles([{ id: newRoleId, name_in_scene: "主人公" }]);
      setRoleDirections([{ role_id: newRoleId, direction_ids: [] }]); 
      setBackgroundId(Object.keys(db.backgrounds)[0] || '');
      setLightingId(Object.keys(db.lighting)[0] || '');
      setCompositionId(Object.keys(db.compositions)[0] || '');
      setRefImagePath(''); // ★ 追加
      setImageMode('txt2img'); // ★ 追加
    }
  }, [initialData, db]);

  // (Roles, RoleDirections の編集ハンドラは v10 と同じ)
  const handleAddRole = () => { /* ... */ };
  const handleRoleChange = (index: number, field: 'id' | 'name_in_scene', value: string) => { /* ... */ };
  const handleRemoveRole = (index: number) => { /* ... */ };
  const handleAddDirectionToRole = (roleId: string, directionId: string) => { /* ... */ };
  const handleRemoveDirectionFromRole = (roleId: string, directionId: string) => { /* ... */ };

  // --- 保存処理 ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roleIds = roles.map(r => r.id);
    const hasDuplicate = roleIds.some((id, index) => roleIds.indexOf(id) !== index);
    if (hasDuplicate) { alert('配役(Role)のIDが重複'); return; }

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
      role_directions: roleDirections,
      reference_image_path: refImagePath, // ★ 追加
      image_mode: imageMode, // ★ 追加
    };
    onSave(savedScene);
  };

  return (
    <div style={modalOverlayStyle}>
      <form onSubmit={handleSubmit} style={modalContentStyle}>
        <h3 style={{ marginTop: 0 }}>{initialData ? 'シーンを編集' : '新規シーンを追加'}</h3>

        {/* --- 基本情報 --- */}
        <div style={sectionStyle}>
          {/* (Name, Tags, Background, Lighting, Composition は変更なし) */}
        </div>
        
        {/* --- ★ 画像モード設定 --- */}
        <div style={sectionStyle}>
           <strong>画像生成モード</strong>
           <div style={formGroupStyle}>
              <label>参考画像パス (URL or Local Path):</label>
              <input type="text" value={refImagePath} onChange={(e) => setRefImagePath(e.target.value)} style={inputStyle} 
                 placeholder="例: C:\images\ref.png や http://..." />
              <small style={{color:'#555'}}>※空欄の場合は txt2img になります。D&Dは未実装。</small>
           </div>
           <div style={formGroupStyle}>
              <label>モード (参考画像がある場合):</label>
              <select value={imageMode} onChange={(e) => setImageMode(e.target.value as Scene['image_mode'])} style={inputStyle}>
                 <option value="txt2img">txt2img (参考画像なし)</option>
                 <option value="img2img">img2img</option>
                 <option value="img2img_polish">img2img_polish</option>
              </select>
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