// src/components/AddSimplePartForm.tsx

import React, { useState, useEffect } from 'react';
import { PromptPartBase } from '../types/prompt';

interface AddSimplePartFormProps {
  initialData: PromptPartBase | null;
  objectType: string; // "Costume", "Pose" などの表示用
  onSave: (part: PromptPartBase) => void;
  onCancel: () => void;
}

export const AddSimplePartForm: React.FC<AddSimplePartFormProps> = ({
  initialData,
  objectType,
  onSave,
  onCancel,
}) => {
  // フォームの内部状態
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');

  useEffect(() => {
    if (initialData) {
      // 編集
      setName(initialData.name);
      setTags(initialData.tags.join(', '));
      setPrompt(initialData.prompt);
      setNegativePrompt(initialData.negative_prompt);
    } else {
      // 新規
      setName('');
      setTags('');
      setPrompt('');
      setNegativePrompt('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('名前は必須です。');
      return;
    }

    const savedPart: PromptPartBase = {
      id: initialData ? initialData.id : `${objectType.toLowerCase()}_${Date.now()}`,
      name: name,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      prompt: prompt,
      negative_prompt: negativePrompt,
    };
    onSave(savedPart);
  };

  return (
    <div style={modalOverlayStyle}>
      <form onSubmit={handleSubmit} style={modalContentStyle}>
        <h3 style={{ marginTop: 0 }}>{initialData ? 'Edit' : 'New'} {objectType}</h3>

        <div style={formGroupStyle}>
          <label>名前:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label>タグ (カンマ区切り):</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label>プロンプト (Positive):</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{...inputStyle, height: '60px'}} />
        </div>
        <div style={formGroupStyle}>
          <label>ネガティブプロンプト (Negative):</label>
          <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} style={{...inputStyle, height: '40px'}} />
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