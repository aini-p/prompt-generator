// src/components/AddActorForm.tsx

import React, { useState, useEffect } from 'react';
import { Actor, FullDatabase } from '../types/prompt';

interface AddActorFormProps {
  initialData: Actor | null; 
  db: FullDatabase; 
  onSave: (actor: Actor) => void;
  onCancel: () => void;
}

export const AddActorForm: React.FC<AddActorFormProps> = ({
  initialData,
  db,
  onSave,
  onCancel,
}) => {
  // フォームの内部状態
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(''); 
  const [baseCostumeId, setBaseCostumeId] = useState('');
  const [basePoseId, setBasePoseId] = useState('');
  const [baseExpressionId, setBaseExpressionId] = useState('');
  const [workTitle, setWorkTitle] = useState(''); // ★ 追加
  const [characterName, setCharacterName] = useState(''); // ★ 追加

  // initialData が変更されたら、フォームをリセット
  useEffect(() => {
    if (initialData) {
      // 編集
      setName(initialData.name);
      setTags(initialData.tags.join(', '));
      setPrompt(initialData.prompt);
      setNegativePrompt(initialData.negative_prompt); 
      setBaseCostumeId(initialData.base_costume_id);
      setBasePoseId(initialData.base_pose_id);
      setBaseExpressionId(initialData.base_expression_id);
      setWorkTitle(initialData.work_title); // ★ 追加
      setCharacterName(initialData.character_name); // ★ 追加
    } else {
      // 新規
      setName('');
      setTags('');
      setPrompt('1boy, ...');
      setNegativePrompt('ugly, watermark'); 
      setBaseCostumeId(Object.keys(db.costumes)[0] || '');
      setBasePoseId(Object.keys(db.poses)[0] || '');
      setBaseExpressionId(Object.keys(db.expressions)[0] || '');
      setWorkTitle(''); // ★ 追加
      setCharacterName(''); // ★ 追加
    }
  }, [initialData, db]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !prompt || !workTitle || !characterName) { // ★ 追加
      alert('名前, プロンプト, 作品タイトル, キャラクター名は必須です。');
      return;
    }

    const savedActor: Actor = {
      id: initialData ? initialData.id : `actor_${Date.now()}`,
      name: name,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      prompt: prompt,
      negative_prompt: negativePrompt, 
      base_costume_id: baseCostumeId,
      base_pose_id: basePoseId,
      base_expression_id: baseExpressionId,
      work_title: workTitle, // ★ 追加
      character_name: characterName, // ★ 追加
    };
    onSave(savedActor);
  };

  return (
    <div style={modalOverlayStyle}>
      <form onSubmit={handleSubmit} style={modalContentStyle}>
        <h3 style={{ marginTop: 0 }}>{initialData ? '役者を編集' : '新規役者を追加'}</h3>

        <div style={formGroupStyle}><label>名前:</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} /></div>
        <div style={formGroupStyle}><label>タグ:</label><input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} /></div>
        {/* ★ 追加 */}
        <div style={formGroupStyle}><label>作品タイトル (ファイル名用):</label><input type="text" value={workTitle} onChange={(e) => setWorkTitle(e.target.value)} required style={inputStyle} /></div>
        <div style={formGroupStyle}><label>キャラクター名 (ファイル名用):</label><input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)} required style={inputStyle} /></div>
        
        <div style={formGroupStyle}><label>基本プロンプト (Positive):</label><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required style={{...inputStyle, height: '60px'}} /></div>
        <div style={formGroupStyle}><label>基本ネガティブプロンプト (Negative):</label><textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} style={{...inputStyle, height: '40px'}} /></div>
        <div style={formGroupStyle}><label>基本衣装:</label><select value={baseCostumeId} onChange={(e) => setBaseCostumeId(e.target.value)} style={inputStyle}>{Object.values(db.costumes).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div style={formGroupStyle}><label>基本ポーズ:</label><select value={basePoseId} onChange={(e) => setBasePoseId(e.target.value)} style={inputStyle}>{Object.values(db.poses).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div style={formGroupStyle}><label>基本表情:</label><select value={baseExpressionId} onChange={(e) => setBaseExpressionId(e.target.value)} style={inputStyle}>{Object.values(db.expressions).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={onCancel} style={{ backgroundColor: '#6c757d', color: 'white' }}>キャンセル</button>
          <button type="submit" style={{ backgroundColor: '#007bff', color: 'white' }}>保存</button>
        </div>
      </form>
    </div>
  );
};

// --- スタイル定義 ---
const modalOverlayStyle: React.CSSProperties = { /* ... */ };
const modalContentStyle: React.CSSProperties = { /* ... */ };
const formGroupStyle: React.CSSProperties = { /* ... */ };
const inputStyle: React.CSSProperties = { /* ... */ };