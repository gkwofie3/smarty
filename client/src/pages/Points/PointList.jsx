import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Alert, Breadcrumb } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCopy, FaPlus, FaArrowLeft } from 'react-icons/fa';
import { getPoints, deletePoint, duplicatePoint, getPointGroup } from '../../services/pointService';
import PointModal from './PointModal';
import { useParams, useNavigate, Link } from 'react-router-dom';

const PointList = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [points, setPoints] = useState([]);
    const [group, setGroup] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [notification, setNotification] = useState(null);

    const fetchGroupAndPoints = async () => {
        try {
            const groupResponse = await getPointGroup(groupId);
            setGroup(groupResponse.data);

            const pointResponse = await getPoints(groupId);
            setPoints(pointResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setNotification({ type: 'danger', message: 'Failed to fetch point group data' });
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchGroupAndPoints();
        }
    }, [groupId]);

    const handleAdd = () => {
        setSelectedPoint(null);
        setShowModal(true);
    };

    const handleEdit = (point) => {
        setSelectedPoint(point);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this point?')) {
            try {
                await deletePoint(id);
                setNotification({ type: 'success', message: 'Point deleted successfully' });
                fetchGroupAndPoints();
            } catch (error) {
                console.error('Error deleting point:', error);
                setNotification({ type: 'danger', message: 'Failed to delete point' });
            }
        }
    };

    const handleDuplicate = async (id) => {
        if (window.confirm('Are you sure you want to duplicate this point?')) {
            try {
                await duplicatePoint(id, { count: 1 });
                setNotification({ type: 'success', message: 'Point duplicated successfully' });
                fetchGroupAndPoints();
            } catch (error) {
                console.error('Error duplicating point:', error);
                setNotification({ type: 'danger', message: 'Failed to duplicate point' });
            }
        }
    };

    const handleSave = () => {
        fetchGroupAndPoints();
        setNotification({ type: 'success', message: `Point ${selectedPoint ? 'updated' : 'created'} successfully` });
    };

    return (
        <Container fluid className="p-4">
            <Breadcrumb>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/point-groups" }}>Point Groups</Breadcrumb.Item>
                <Breadcrumb.Item active>{group ? group.name : 'Group'}</Breadcrumb.Item>
            </Breadcrumb>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{group ? `${group.name} - Points` : 'Points'}</h2>
                <div>
                    <Button variant="secondary" className="me-2" onClick={() => navigate('/point-groups')}>
                        <FaArrowLeft /> Back
                    </Button>
                    <Button variant="primary" onClick={handleAdd}><FaPlus /> Add Point</Button>
                </div>
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
                        <th>Type</th>
                        <th>Direction</th>
                        <th>Data Type</th>
                        <th>Unit</th>
                        <th>Value</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {points.map(pt => (
                        <tr key={pt.id}>
                            <td>{pt.name}</td>
                            <td>{pt.point_type}</td>
                            <td>{pt.direction}</td>
                            <td>{pt.data_type}</td>
                            <td>{pt.unit}</td>
                            <td>{pt.read_value}</td>
                            <td>
                                <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(pt)} title="Edit">
                                    <FaEdit />
                                </Button>
                                <Button variant="secondary" size="sm" className="me-2" onClick={() => handleDuplicate(pt.id)} title="Duplicate">
                                    <FaCopy />
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(pt.id)} title="Delete">
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {points.length === 0 && (
                        <tr>
                            <td colSpan="7" className="text-center">No points found for this group.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <PointModal
                show={showModal}
                onHide={() => setShowModal(false)}
                point={selectedPoint}
                groupId={groupId}
                onSave={handleSave}
            />
        </Container>
    );
};

export default PointList;
