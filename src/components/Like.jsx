// src/components/Like.js
import React, { useState } from 'react';

function Like() {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  const handleLike = () => {
    if (liked) {
      setCount(count - 1);
      setLiked(false);
    } else {
      setCount(count + 1);
      setLiked(true);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={handleLike}
        style={{
          backgroundColor: liked ? '#ff4d4f' : '#ddd',
          color: liked ? 'white' : 'black',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        {liked ? '💔 Unlike' : '❤️ Like'}
      </button>
      <span>{count}</span>
    </div>
  );
}

export default Like;
