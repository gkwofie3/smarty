import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Alert, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCopy, FaPlus, FaList } from 'react-icons/fa';
import { getDevices, deleteDevice, duplicateDevice } from '../../services/deviceService';
import DeviceModal from './DeviceModal';
import { useNavigate } from 'react-router-dom';

const DeviceList = () => {
    const [devices, setDevices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();

    const fetchDevices = async () => {
        try {
            const response = await getDevices();
            setDevices(response.data);
        } catch (error) {
            console.error('Error fetching devices:', error);
            setNotification({ type: 'danger', message: 'Failed to fetch devices' });
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleAdd = () => {
        setSelectedDevice(null);
        setShowModal(true);
    };

    const handleEdit = (device) => {
        setSelectedDevice(device);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
            try {
                await deleteDevice(id);
                setNotification({ type: 'success', message: 'Device deleted successfully' });
                fetchDevices();
            } catch (error) {
                console.error('Error deleting device:', error);
                setNotification({ type: 'danger', message: 'Failed to delete device' });
            }
        }
    };

    const handleDuplicate = async (id) => {
        if (window.confirm('Are you sure you want to duplicate this device?')) {
            try {
                // Determine a unique name - simplified for now, backend usually handles collision or we prompt
                // For simplicity, we'll just let the backend handle duplication logic if it auto-renames or we pass a generic name
                // Looking at backend duplicate viewset, it expects 'count', 'names' potentially.
                // But simplified duplicate often just duplicates.
                // Let's assume standard duplication with defaults for now.
                // If the backend requires names, we might need a prompt.
                // Based on `BaseDuplicateViewSet` implementation in `views.py`, it accepts POST.

                await duplicateDevice(id, { count: 1 });
                setNotification({ type: 'success', message: 'Device duplicated successfully' });
                fetchDevices();
            } catch (error) {
                console.error('Error duplicating device:', error);
                setNotification({ type: 'danger', message: 'Failed to duplicate device' });
            }
        }
    };

    const handleViewRegisters = (id) => {
        navigate(`/devices/${id}/registers`);
    };

    const handleSave = () => {
        fetchDevices();
        setNotification({ type: 'success', message: `Device ${selectedDevice ? 'updated' : 'created'} successfully` });
    };

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Devices</h2>
                <Button variant="primary" onClick={handleAdd}><FaPlus /> Add Device</Button>
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
                        <th>Slug</th>
                        <th>Type</th>
                        <th>Protocol</th>
                        <th>IP Address</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map(device => (
                        <tr key={device.id}>
                            <td>{device.name}</td>
                            <td>{device.slug}</td>
                            <td>{device.device_type}</td>
                            <td>{device.protocol}</td>
                            <td>{device.ip_address}</td>
                            <td>
                                <Badge bg={device.is_online ? 'success' : 'secondary'}>
                                    {device.is_online ? 'Online' : 'Offline'}
                                </Badge>
                            </td>
                            <td>
                                <Button variant="info" size="sm" className="me-2" onClick={() => handleViewRegisters(device.id)} title="View Registers">
                                    <FaList />
                                </Button>
                                <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(device)} title="Edit">
                                    <FaEdit />
                                </Button>
                                <Button variant="secondary" size="sm" className="me-2" onClick={() => handleDuplicate(device.id)} title="Duplicate">
                                    <FaCopy />
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(device.id)} title="Delete">
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {devices.length === 0 && (
                        <tr>
                            <td colSpan="7" className="text-center">No devices found.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <DeviceModal
                show={showModal}
                onHide={() => setShowModal(false)}
                device={selectedDevice}
                onSave={handleSave}
            />
        </Container>
    );
};

export default DeviceList;
