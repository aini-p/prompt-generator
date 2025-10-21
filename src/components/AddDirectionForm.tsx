// src/components/AddDirectionForm.tsx

import React, { useState, useEffect } from 'react';
import { Direction, FullDatabase } from '../types/prompt';

interface AddDirectionFormProps {
  initialData: Direction | null;
  db: FullDatabase;
  onSave: (direction: Direction) => void;
  onCancel: () => void;
}

export const AddDirectionForm: React.FC<AddDirectionFormProps> = ({
  initialData,
  db,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [costumeId, setCostumeId] = useState<string | undefined>('');
  const [poseId, setPoseId] = useState<string | undefined>('');
  const [expressionId, setExpressionId] = useState<string | undefined>('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTags(initialData.tags.join(', '));
      setPrompt(initialData.prompt);
      setNegativePrompt(initialData.negative_prompt);
      setCostumeId(initialData.costume_id);
      setPoseId(initialData.pose_id);
      setExpressionId(initialData.expression_id);
    } else {
      setName('');
      setTags('');
      setPrompt('');
      setNegativePrompt('');
      setCostumeId(undefined);
      setPoseId(undefined);
      setExpressionId(undefined);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { alert('名前は必須です。'); return; }

    const savedDirection: Direction = {
      id: initialData ? initialData.id : `dir_${Date.now()}`,
      name: name,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      prompt: prompt,
      negative_prompt: negativePrompt,
      costume_id: costumeId || undefined, // 空文字は undefined に
      pose_id: poseId || undefined,
      expression_id: expressionId || undefined,
    };
    onSave(savedDirection);
  };

  const selectStyle = {...inputStyle, backgroundColor: '#f0f0f0'};

  return (
    <div style={modalOverlayStyle}>
      <form onSubmit={handleSubmit} style={modalContentStyle}>
        <h3 style={{ marginTop: 0 }}>{initialData ? '演出を編集' : '新規演出を追加'}</h3>

        <div style={formGroupStyle}>
          <label>名前:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label>タグ:</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label>追加プロンプト (Positive):</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{...inputStyle, height: '40px'}} />
        </div>
        <div style={formGroupStyle}>
          <label>追加ネガティブプロンプト (Negative):</label>
          <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} style={{...inputStyle, height: '40px'}} />
        </div>
        <hr style={{margin: '15px 0'}} />
        <p style={{marginTop: 0, fontSize: '0.9em', color: '#555'}}>↓ 状態を上書きする場合のみ選択</p>
        
        <div style={formGroupStyle}>
          <label>衣装 (上書き):</label>
          <select value={costumeId || ''} onChange={(e) => setCostumeId(e.target.value)} style={selectStyle}>
            <option value="">-- 上書きしない --</option>
            {Object.values(db.costumes).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={formGroupStyle}>
          <label>ポーズ (上書き):</label>
          <select value={poseId || ''} onChange={(e) => setPoseId(e.target.value)} style={selectStyle}>
            <option value="">-- 上書きしない --</option>
            {Object.values(db.poses).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={formGroupStyle}>
          <label>表情 (上書き):</label>
          <select value={expressionId || ''} onChange={(e) => setExpressionId(e.target.value)} style={selectStyle}>
            <option value="">-- 上書きしない --</option>
            {Object.values(db.expressions).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

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
  borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto'
};
const formGroupStyle: React.CSSProperties = {
  marginBottom: '10px', display: 'flex', flexDirection: 'column',
};
const inputStyle: React.CSSProperties = {
  width: '95%', padding: '8px', marginTop: '4px', fontSize: '14px',
};