import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FloatingAddButton.css';

function FloatingAddButton() {
    const navigate = useNavigate();

    return (
        <button 
            className="floating-add-btn" 
            onClick={() => navigate('/add')}
            aria-label="Create new post"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </button>
    );
}

export default FloatingAddButton;
