import React from 'react';
import { Button, Offcanvas, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';

function Menu({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { logOut } = useUserAuth();

    const handleLogout = async () => {
        try {
            await logOut();
            navigate('/');
        } catch(err) {
            console.log(err.message);
        }
    };

    return (
        <Offcanvas
            id="main-menu"
            show={isOpen}
            onHide={onClose}
            placement="start"
            backdrop
            scroll
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <ListGroup variant="flush">
                    <ListGroup.Item
                        action
                        onClick={() => { navigate('/home'); onClose(); }}>
                        comming soon
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        onClick={() => { navigate('/home'); onClose(); }}>
                        comming soon
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        onClick={() => { navigate('/home'); onClose(); }}>
                        comming soon
                    </ListGroup.Item>
                    <ListGroup.Item
                        action
                        onClick={() => { navigate('/home'); onClose(); }}>
                        comming soon
                    </ListGroup.Item>
                </ListGroup>

                <hr />

                <Button onClick={handleLogout} variant="danger" className="w-100">
                    Logout
                </Button>
            </Offcanvas.Body>
        </Offcanvas>
    );
}

export default Menu;