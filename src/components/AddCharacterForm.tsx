// src/components/AddCharacterForm.tsx

import React, { useState, useEffect } from 'react';
import { CharacterBase } from '../types/prompt';

// このコンポーネントが受け取るプロパティの型
interface AddCharacterFormProps {
  // 編集する初期データ (null の場合は完全新規)
  initialData: Partial<CharacterBase> | null; 
  // 保存ボタンが押されたときのコールバック
  onSave: (newCharacter: CharacterBase) => void;
  // キャンセルボタンが押されたときのコールバック
  onCancel: () => void;
}

export const AddCharacterForm: React.FC<AddCharacterFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel 
}) => {
  // フォームの各入力フィールドの状態
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [gender, setGender] = useState('1girl');
  const [age, setAge] = useState('20s');
  const [hairColor, setHairColor] = useState('brown');
  const [hairStyle, setHairStyle] = useState('long');
  const [eyeColor, setEyeColor] = useState('blue');
  const [expression, setExpression] = useState('neutral');

  // --- ★ 修正点 ---
  // initialData (初期データ) が変更されたら、フォームの内部状態を更新する
  useEffect(() => {
    if (initialData) {
      // 継承（コピー）の場合
      setName(initialData.name ? `${initialData.name} (コピー)` : '');
      setTags(initialData.tags ? initialData.tags.join(', ') : '');
      setGender(initialData.gender || '1girl');
      setAge(initialData.age || '20s');
      setHairColor(initialData.hair?.color || 'brown');
      setHairStyle(initialData.hair?.style || 'long');
      setEyeColor(initialData.eyes?.color || 'blue');
      setExpression(initialData.expression || 'neutral');
    } else {
      // 完全新規の場合 (フォームをリセット)
      setName('');
      setTags('');
      setGender('1girl');
      setAge('20s');
      setHairColor('brown');
      setHairStyle('long');
      setEyeColor('blue');
      setExpression('neutral');
    }
  }, [initialData]); // initialData が変わるたびに実行

  // 保存ボタンが押されたときの処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('名前を入力してください。');
      return;
    }

    const newCharacter: CharacterBase = {
      // ★ 変更点: IDは常に新規発行 (コピー元とは別物にする)
      id: `char_new_${Date.now()}`, 
      name: name,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      type: 'Character',
      
      // フォームの現在の状態からオブジェクトを構築
      gender: gender,
      age: age,
      hair: { style: hairStyle, color: hairColor },
      eyes: { color: eyeColor },
      expression: expression,
    };

    onSave(newCharacter);
  };

  // UI
  return (
    // ★ 変更点: フォーム全体をモーダルウィンドウのように見せる
    <div style={{
      position: 'fixed', // 画面に固定
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明の背景
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <form onSubmit={handleSubmit} style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '400px'
      }}>
        <h3 style={{ marginTop: 0 }}>
          {initialData ? 'キャラクターを継承 (コピー)' : '新規キャラクターを追加'}
        </h3>
        
        {/* 各種フォーム入力 */}
        <div>
          <label>名前: </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required 
            style={{ width: '90%' }}/>
        </div>
        <div style={{ marginTop: '5px' }}>
          <label>タグ (カンマ区切り): </label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} 
            style={{ width: '90%' }}/>
        </div>
        <div style={{ marginTop: '5px' }}>
          <label>性別: </label>
          <input type="text" value={gender} onChange={(e) => setGender(e.target.value)} />
        </div>
        <div style={{ marginTop: '5px' }}>
          <label>年齢: </label>
          <input type="text" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div style={{ marginTop: '5px' }}>
          <label>髪色: </label>
          <input type="text" value={hairColor} onChange={(e) => setHairColor(e.target.value)} />
          <label> 髪型: </label>
          <input type="text" value={hairStyle} onChange={(e) => setHairStyle(e.target.value)} />
        </div>
        <div style={{ marginTop: '5px' }}>
          <label>目の色: </label>
          <input type="text" value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} />
        </div>
        <div style={{ marginTop: '5px' }}>
          <label>表情: </label>
          <input type="text" value={expression} onChange={(e) => setExpression(e.target.value)} />
        </div>
        
        {/* ★ 変更点: 保存ボタンとキャンセルボタン */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={onCancel} style={{ backgroundColor: '#6c757d', color: 'white' }}>
            キャンセル
          </button>
          <button type="submit" style={{ backgroundColor: '#007bff', color: 'white' }}>
            この内容で保存
          </button>
        </div>
      </form>
    </div>
  );
};