import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Alert, Breadcrumb } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCopy, FaPlus, FaArrowLeft } from 'react-icons/fa';
import { getRegisters, deleteRegister, duplicateRegister, getDevice } from '../../services/deviceService';
import RegisterModal from './RegisterModal';
import { useParams, useNavigate, Link } from 'react-router-dom';

const RegisterList = () => {
    const { deviceId } = useParams();
    const navigate = useNavigate();
    const [registers, setRegisters] = useState([]);
    const [device, setDevice] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedRegister, setSelectedRegister] = useState(null);
    const [notification, setNotification] = useState(null);

    const fetchDeviceAndRegisters = async () => {
        try {
            const devResponse = await getDevice(deviceId);
            setDevice(devResponse.data);

            const regResponse = await getRegisters(deviceId);
            setRegisters(regResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setNotification({ type: 'danger', message: 'Failed to fetch device data' });
        }
    };

    useEffect(() => {
        if (deviceId) {
            fetchDeviceAndRegisters();
        }
    }, [deviceId]);

    const handleAdd = () => {
        setSelectedRegister(null);
        setShowModal(true);
    };

    const handleEdit = (register) => {
        setSelectedRegister(register);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this register?')) {
            try {
                await deleteRegister(id);
                setNotification({ type: 'success', message: 'Register deleted successfully' });
                fetchDeviceAndRegisters();
            } catch (error) {
                console.error('Error deleting register:', error);
                setNotification({ type: 'danger', message: 'Failed to delete register' });
            }
        }
    };

    const handleDuplicate = async (id) => {
        if (window.confirm('Are you sure you want to duplicate this register?')) {
            try {
                await duplicateRegister(id, { count: 1 });
                setNotification({ type: 'success', message: 'Register duplicated successfully' });
                fetchDeviceAndRegisters();
            } catch (error) {
                console.error('Error duplicating register:', error);
                setNotification({ type: 'danger', message: 'Failed to duplicate register' });
            }
        }
    };

    const handleSave = () => {
        fetchDeviceAndRegisters();
        setNotification({ type: 'success', message: `Register ${selectedRegister ? 'updated' : 'created'} successfully` });
    };

    return (
        <Container fluid className="p-4">
            <Breadcrumb>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/devices" }}>Devices</Breadcrumb.Item>
                <Breadcrumb.Item active>{device ? device.name : 'Device'}</Breadcrumb.Item>
            </Breadcrumb>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{device ? `${device.name} - Registers` : 'Registers'}</h2>
                <div>
                    <Button variant="secondary" className="me-2" onClick={() => navigate('/devices')}>
                        <FaArrowLeft /> Back
                    </Button>
                    <Button variant="primary" onClick={handleAdd}><FaPlus /> Add Register</Button>
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
                        {device?.protocol?.startsWith('BACnet') ? (
                            <>
                                <th>Object Type</th>
                                <th>Instance</th>
                            </>
                        ) : (
                            <>
                                <th>Address</th>
                                <th>Functions (R/W)</th>
                            </>
                        )}
                        <th>Signal</th>
                        <th>Direction</th>
                        <th>Current Value</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {registers.map(reg => (
                        <tr key={reg.id}>
                            <td>{reg.name}</td>
                            {device?.protocol?.startsWith('BACnet') ? (
                                <>
                                    <td>{reg.bacnet_object_type}</td>
                                    <td>{reg.bacnet_instance_number}</td>
                                </>
                            ) : (
                                <>
                                    <td>{reg.address}</td>
                                    <td>{reg.read_function_code} / {reg.write_function_code}</td>
                                </>
                            )}
                            <td>{reg.signal_type}</td>
                            <td>{reg.direction}</td>
                            <td>{reg.current_value}</td>
                            <td>
                                <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(reg)} title="Edit">
                                    <FaEdit />
                                </Button>
                                <Button variant="secondary" size="sm" className="me-2" onClick={() => handleDuplicate(reg.id)} title="Duplicate">
                                    <FaCopy />
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(reg.id)} title="Delete">
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {registers.length === 0 && (
                        <tr>
                            <td colSpan={device?.protocol?.startsWith('BACnet') ? "7" : "7"} className="text-center">No registers found for this device.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <RegisterModal
                show={showModal}
                onHide={() => setShowModal(false)}
                register={selectedRegister}
                deviceId={deviceId}
                protocol={device?.protocol}
                onSave={handleSave}
            />
        </Container>
    );
};

export default RegisterList;
