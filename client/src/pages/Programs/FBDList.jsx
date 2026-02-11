import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaPlay } from 'react-icons/fa';

const FDBList = () => {
    const [programs, setPrograms] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentProgram, setCurrentProgram] = useState({ name: '', description: '', is_active: false });
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            const response = await axios.get('/api/fbd/programs/');
            setPrograms(response.data);
        } catch (error) {
            console.error('Error fetching programs:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/fbd/programs/${id}/`);
            fetchPrograms();
        } catch (error) {
            console.error('Error deleting program:', error);
        }
    };

    const handleSave = async () => {
        try {
            if (isEditing) {
                await axios.put(`/api/fbd/programs/${currentProgram.id}/`, currentProgram);
            } else {
                await axios.post('/api/fbd/programs/', currentProgram);
            }
            setShowModal(false);
            fetchPrograms();
            setCurrentProgram({ name: '', description: '', is_active: false });
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving program:', error);
        }
    };

    const openEditModal = (program) => {
        setCurrentProgram(program);
        setIsEditing(true);
        setShowModal(true);
    };

    const openAddModal = () => {
        setCurrentProgram({ name: '', description: '', is_active: false });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEditEditor = (id) => {
        // Navigate to the separate FBD Editor App
        // Assuming the editor is hosted at /fdb/editor/:id or similar
        // For now, we'll route to a local route, but later we might need to change this if it's a separate app
        // The user request said "Add another button... redirects to FBD editor app (e.g. /fdb/editor/{program_id})"
        // Since we are building the editor in a separate 'fdb' folder, how do we serve it?
        // If it's a separate Vite app, it might be on a different port during dev.
        // For production, it might be under /editor/
        // I'll assume for now it's a route within the same app or I'll implement the editor in the 'fdb' folder and figure out serving later.
        // Actually, the plan said "Frontend FBD Editor (Editor) -> Build FBD React App".
        // Let's assume we navigate to an external URL or a specific route handled by Django that serves that app.
        // For now, I'll put a placeholder URL.
        window.location.href = `/editor/?id=${id}`;
    };

    return (
        <div className="container mt-4">
            <h2>FBD Programs</h2>
            <Button variant="primary" className="mb-3" onClick={openAddModal}>
                <FaPlus /> New Program
            </Button>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {programs.map((program) => (
                        <tr key={program.id}>
                            <td>{program.id}</td>
                            <td>{program.name}</td>
                            <td>{program.description}</td>
                            <td>{program.is_active ? 'Yes' : 'No'}</td>
                            <td>
                                <Button variant="info" size="sm" className="me-2" onClick={() => openEditModal(program)}>
                                    <FaEdit /> Edit Properties
                                </Button>
                                <Button variant="warning" size="sm" className="me-2" onClick={() => handleEditEditor(program.id)}>
                                    <FaPlay /> Logic Editor
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(program.id)}>
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Edit Program' : 'New Program'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentProgram.name}
                                onChange={(e) => setCurrentProgram({ ...currentProgram, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={currentProgram.description}
                                onChange={(e) => setCurrentProgram({ ...currentProgram, description: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Active"
                                checked={currentProgram.is_active}
                                onChange={(e) => setCurrentProgram({ ...currentProgram, is_active: e.target.checked })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FBDList;
