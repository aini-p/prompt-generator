// src/components/PromptBuilder.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { 
  characterDB as initialCharacterDB, 
  clothingDB as initialClothingDB, 
  backgroundDB as initialBackgroundDB 
} from '../data/mocks';
// ★ 修正点: generatePrompt に加えて resolveCharacter もインポート
import { generatePrompt, SelectedParts, IncludeFlags, resolveCharacter } from '../utils/promptGenerator';
import { AddCharacterForm } from './AddCharacterForm'; 
import { CharacterDefinition, ClothingDefinition, BackgroundDefinition, CharacterBase } from '../types/prompt';

// ... (STORAGE_KEYS, loadFromStorage 関数は変更なし) ...
const STORAGE_KEYS = {
  characters: 'promptBuilder_characters',
  clothing: 'promptBuilder_clothing',
  backgrounds: 'promptBuilder_backgrounds',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage`, error);
    return fallback;
  }
}

interface ExportData {
  characters: Record<string, CharacterDefinition>;
  clothing: Record<string, ClothingDefinition>;
  backgrounds: Record<string, BackgroundDefinition>;
}


export const PromptBuilder: React.FC = () => {
  
  // (DBの state, allCharacters などの state は変更なし)
  const [characterDB, setCharacterDB] = useState<Record<string, CharacterDefinition>>(
    () => loadFromStorage(STORAGE_KEYS.characters, initialCharacterDB)
  );
  const [clothingDB, setClothingDB] = useState<Record<string, ClothingDefinition>>(
    () => loadFromStorage(STORAGE_KEYS.clothing, initialClothingDB)
  );
  const [backgroundDB, setBackgroundDB] = useState<Record<string, BackgroundDefinition>>(
    () => loadFromStorage(STORAGE_KEYS.backgrounds, initialBackgroundDB)
  );

  const allCharacters = useMemo(() => Object.values(characterDB), [characterDB]);
  const allClothing = useMemo(() => Object.values(clothingDB), [clothingDB]);
  const allBackgrounds = useMemo(() => Object.values(backgroundDB), [backgroundDB]);
  
  const [selected, setSelected] = useState<SelectedParts>({
    characterId: allCharacters.length > 0 ? allCharacters[0].id : '',
    clothingId: allClothing.length > 0 ? allClothing[0].id : '',
    backgroundId: allBackgrounds.length > 0 ? allBackgrounds[0].id : '',
  });

  const [flags, setFlags] = useState<IncludeFlags>({
    character: true,
    clothing: true,
    background: true,
  });
  const [charFilter, setCharFilter] = useState("");

  // ★ 修正点: フォーム表示管理用の state
  const [showAddForm, setShowAddForm] = useState(false);
  // ★ 修正点: フォームに渡す初期データ(コピー元)用の state
  const [cloneData, setCloneData] = useState<CharacterBase | null>(null);


  useEffect(() => {
    if (allCharacters.length > 0 && !characterDB[selected.characterId]) {
      setSelected(prev => ({ ...prev, characterId: allCharacters[0].id }));
    }
    if (allClothing.length > 0 && !clothingDB[selected.clothingId]) {
      setSelected(prev => ({ ...prev, clothingId: allClothing[0].id }));
    }
    if (allBackgrounds.length > 0 && !backgroundDB[selected.backgroundId]) {
      setSelected(prev => ({ ...prev, backgroundId: allBackgrounds[0].id }));
    }
  }, [characterDB, clothingDB, backgroundDB, allCharacters, allClothing, allBackgrounds]); // 依存配列にall...を追加

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSelected(prev => ({ ...prev, [name]: value }));
  };

  const handleFlagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFlags(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSaveToLocal = () => {
    // (変更なし)
    try {
      localStorage.setItem(STORAGE_KEYS.characters, JSON.stringify(characterDB));
      localStorage.setItem(STORAGE_KEYS.clothing, JSON.stringify(clothingDB));
      localStorage.setItem(STORAGE_KEYS.backgrounds, JSON.stringify(backgroundDB));
      alert('現在のパーツ一覧をブラウザに保存しました！');
    } catch (error) {
      console.error("Failed to save to localStorage", error);
      alert('保存に失敗しました。');
    }
  };
  
  // ★ 修正点: handleAddCharacter は handleSaveNewCharacter に名前変更
  // (フォームから呼び出される)
  const handleSaveNewCharacter = (newCharacter: CharacterBase) => {
    // Stateを更新 (新しいキャラをDBに追加)
    const newCharacterDB = {
        ...characterDB,
        [newCharacter.id]: newCharacter
    };
    setCharacterDB(newCharacterDB);
    
    // 新しく追加したキャラを自動で選択
    setSelected(prev => ({ ...prev, characterId: newCharacter.id }));
    
    // フォームを閉じる
    setShowAddForm(false);
  };

  // (filteredCharacters, finalPrompt の useMemo は変更なし)
  const filteredCharacters = useMemo(() => {
    if (!charFilter) return allCharacters;
    return allCharacters.filter(char => 
      char.name.includes(charFilter) || 
      char.tags.some(tag => tag.includes(charFilter))
    );
  }, [charFilter, allCharacters]); 

  const finalPrompt = useMemo(() => {
    // ★ 修正点: generatePrompt に characterDB を渡す
    return generatePrompt(selected, flags, characterDB, clothingDB, backgroundDB);
  }, [selected, flags, characterDB, clothingDB, backgroundDB]);


  // (エクスポート/インポートのハンドラは変更なし)
  const handleExport = () => {
    const dataToExport: ExportData = {
      characters: characterDB,
      clothing: clothingDB,
      backgrounds: backgroundDB,
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-builder-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('現在の全データをJSONファイルとしてエクスポートしました。');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedData = JSON.parse(text) as Partial<ExportData>;
        if (importedData.characters && importedData.clothing && importedData.backgrounds) {
          setCharacterDB(importedData.characters);
          setClothingDB(importedData.clothing);
          setBackgroundDB(importedData.backgrounds);
          localStorage.setItem(STORAGE_KEYS.characters, JSON.stringify(importedData.characters));
          localStorage.setItem(STORAGE_KEYS.clothing, JSON.stringify(importedData.clothing));
          localStorage.setItem(STORAGE_KEYS.backgrounds, JSON.stringify(importedData.backgrounds));
          alert('データのインポートに成功しました！ページがリフレッシュされます。');
          window.location.reload(); 
        } else {
          throw new Error('ファイルの形式が正しくありません。');
        }
      } catch (error) {
        console.error("Failed to import file", error);
        alert(`インポートに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // ★ 追加: 新規追加フォームを開く
  const openNewCharacterForm = () => {
    setCloneData(null); // クローンデータは無し (完全新規)
    setShowAddForm(true); // フォームを表示
  };
  
  // ★ 追加: 継承(コピー)フォームを開く
  const openCloneCharacterForm = () => {
    if (!selected.characterId) {
      alert('まず継承元のキャラクターを選択してください。');
      return;
    }
    // 選択中のIDから、継承を解決した最終的なキャラデータを取得
    const resolvedCharacter = resolveCharacter(selected.characterId, characterDB);
    setCloneData(resolvedCharacter); // クローンデータをセット
    setShowAddForm(true); // フォームを表示
  };

  return (
    <> {/* ★ 修正点: AddCharacterForm を兄弟要素に置くため <> で囲む */}
      <div style={{ display: 'flex', fontFamily: 'sans-serif' }}>
        {/* --- 左側：パーツ選択エリア --- */}
        <div style={{ width: '400px', padding: '10px', borderRight: '1px solid #ccc' }}>
          
        {/* ★ 変更: UIをグループ化 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', // 2列
            gap: '10px', 
            marginBottom: '15px' 
          }}>
            {/* 保存ボタン */}
            <button onClick={handleSaveToLocal} style={{...buttonStyle, backgroundColor: '#007bff'}}>
              💾 ブラウザに保存
            </button>
            
            {/* エクスポートボタン */}
            <button onClick={handleExport} style={{...buttonStyle, backgroundColor: '#17a2b8'}}>
              📤 エクスポート
            </button>
            
            {/* インポートボタン (inputをlabelで隠す) */}
            {/* label タグで input[type=file] を囲むと、
              label のクリックでファイル選択ダイアログが開く 
            */}
            <label style={{...buttonStyle, backgroundColor: '#28a745', textAlign: 'center'}}>
              📥 インポート
              <input 
                type="file" 
                accept=".json,application/json" 
                style={{ display: 'none' }} // input自体は隠す
                onChange={handleImport} 
              />
            </label>
          </div>
          
          <h2 style={{ marginTop: '0' }}>1. パーツの組み立て</h2>

          {/* チェックボックス (ON/OFF) */}
          <div style={{ marginBottom: '15px' }}>
            <label>
              <input 
                type="checkbox" 
                name="character" 
                checked={flags.character} 
                onChange={handleFlagChange} 
              />
              キャラクター
            </label>
            <label style={{ marginLeft: '10px' }}>
              <input 
                type="checkbox" 
                name="clothing" 
                checked={flags.clothing} 
                onChange={handleFlagChange} 
              />
              衣装
            </label>
            <label style={{ marginLeft: '10px' }}>
              <input 
                type="checkbox" 
                name="background" 
                checked={flags.background} 
                onChange={handleFlagChange} 
              />
              背景
            </label>
          </div>

          {/* キャラクター選択 (フィルタリング付き) */}
          <div>
            <strong>キャラクター</strong>
            <input 
              type="text"
              placeholder="タグ検索 (e.g. female, male, fantasy)"
              value={charFilter}
              onChange={(e) => setCharFilter(e.target.value)}
              style={{ width: '90%', margin: '5px 0' }}
            />
            <select 
              name="characterId" 
              value={selected.characterId} 
              onChange={handleSelectChange} 
              style={{ width: '100%', fontSize: '16px' }}
            >
              {filteredCharacters.map(char => (
                <option key={char.id} value={char.id}>
                  {char.name} {char.tags.includes('variation') ? ' (Var)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* ★ 修正点: キャラクター追加ボタン */}
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={openNewCharacterForm}>
              ＋ 新規キャラクター追加
            </button>
            <button onClick={openCloneCharacterForm} style={{ backgroundColor: '#ffc107' }}>
              🔄 選択中キャラを継承(コピー)
            </button>
          </div>

          {/* 衣装選択 */}
          <div style={{ marginTop: '15px' }}>
            <strong>衣装</strong>
            <select 
              name="clothingId" 
              value={selected.clothingId} 
              onChange={handleSelectChange} 
              style={{ width: '100%', fontSize: '16px' }}
            >
              {allClothing.map(cloth => (
                <option key={cloth.id} value={cloth.id}>
                  {cloth.name} ({cloth.tags.join(', ')})
                </option>
              ))}
            </select>
          </div>

          {/* 背景選択 */}
          <div style={{ marginTop: '15px' }}>
            <strong>背景</strong>
            <select 
              name="backgroundId" 
              value={selected.backgroundId} 
              onChange={handleSelectChange} 
              style={{ width: '100%', fontSize: '16px' }}
            >
              {allBackgrounds.map(bg => (
                <option key={bg.id} value={bg.id}>
                  {bg.name} ({bg.tags.join(', ')})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* --- 右側：結果表示エリア --- */}
        <div style={{ flex: 1, padding: '10px' }}>
          <h2>2. 生成されたプロンプト</h2>
          <textarea
            readOnly
            value={finalPrompt}
            style={{ width: '95%', height: '200px', fontSize: '1.1em', padding: '10px' }}
          />

          <h3 style={{ marginTop: '20px' }}>デバッグ：現在の状態 (JSON)</h3>
          <pre style={{ backgroundColor: '#f4f4f4', padding: '10px' }}>
            {JSON.stringify({ selected, flags }, null, 2)}
          </pre>
        </div>
      </div>
      
      {/* ★ 修正点: AddCharacterForm を条件付きでレンダリング */}
      {showAddForm && (
        <AddCharacterForm 
          initialData={cloneData}
          onSave={handleSaveNewCharacter}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </>
  );
};

// ★ 追加: ボタン用の共通スタイル
const buttonStyle: React.CSSProperties = {
  padding: '10px',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  borderRadius: '4px',
  lineHeight: '1.5', // label と高さを合わせるため
};