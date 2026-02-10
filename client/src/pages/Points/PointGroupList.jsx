import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Alert, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCopy, FaPlus, FaList } from 'react-icons/fa';
import { getPointGroups, deletePointGroup, duplicatePointGroup } from '../../services/pointService';
import PointGroupModal from './PointGroupModal';
import { useNavigate } from 'react-router-dom';

const PointGroupList = () => {
    const [groups, setGroups] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();

    const fetchGroups = async () => {
        try {
            const response = await getPointGroups();
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching point groups:', error);
            setNotification({ type: 'danger', message: 'Failed to fetch point groups' });
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleAdd = () => {
        setSelectedGroup(null);
        setShowModal(true);
    };

    const handleEdit = (group) => {
        setSelectedGroup(group);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            try {
                await deletePointGroup(id);
                setNotification({ type: 'success', message: 'Group deleted successfully' });
                fetchGroups();
            } catch (error) {
                console.error('Error deleting group:', error);
                setNotification({ type: 'danger', message: 'Failed to delete group' });
            }
        }
    };

    const handleDuplicate = async (id) => {
        if (window.confirm('Are you sure you want to duplicate this group?')) {
            try {
                await duplicatePointGroup(id, { count: 1 });
                setNotification({ type: 'success', message: 'Group duplicated successfully' });
                fetchGroups();
            } catch (error) {
                console.error('Error duplicating group:', error);
                setNotification({ type: 'danger', message: 'Failed to duplicate group' });
            }
        }
    };

    const handleViewPoints = (id) => {
        navigate(`/point-groups/${id}/points`);
    };

    const handleSave = () => {
        fetchGroups();
        setNotification({ type: 'success', message: `Group ${selectedGroup ? 'updated' : 'created'} successfully` });
    };

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Point Groups</h2>
                <Button variant="primary" onClick={handleAdd}><FaPlus /> Add Group</Button>
            </div>

            {notification && (
                <Alert variant={notification.type} onClose={() => setNotification(null)} dismissal>
                    {notification.message}
                </Alert>
            )}

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Slug</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map(group => (
                        <tr key={group.id}>
                            <td>{group.name}</td>
                            <td>{group.description}</td>
                            <td>{group.slug}</td>
                            <td>
                                <Badge bg={group.is_active ? 'success' : 'secondary'}>
                                    {group.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </td>
                            <td>
                                <Button variant="info" size="sm" className="me-2" onClick={() => handleViewPoints(group.id)} title="View Points">
                                    <FaList />
                                </Button>
                                <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(group)} title="Edit">
                                    <FaEdit />
                                </Button>
                                <Button variant="secondary" size="sm" className="me-2" onClick={() => handleDuplicate(group.id)} title="Duplicate">
                                    <FaCopy />
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(group.id)} title="Delete">
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {groups.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center">No point groups found.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <PointGroupModal
                show={showModal}
                onHide={() => setShowModal(false)}
                group={selectedGroup}
                onSave={handleSave}
            />
        </Container>
    );
};

export default PointGroupList;
