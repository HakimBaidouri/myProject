import { useState } from 'react';

export default function ChapterEditorSandbox() {
  const [text, setText] = useState('');

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>📝 Éditeur Cahier des charges (mode local)</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: '100%',
          height: '300px',
          fontSize: '1rem',
          padding: '1rem',
          borderRadius: '5px',
          border: '1px solid #ccc',
          fontFamily: 'inherit',
          resize: 'vertical'
        }}
        placeholder="Testez votre éditeur ici sans connexion à l'app principale..."
      />
    </div>
  );
}
