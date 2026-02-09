import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Toast, ToastContainer, Row, Col } from 'react-bootstrap';
import { getUsers, createUser, updateUser, deleteUser, resetPassword } from '../../services/userService';
import { useForm } from 'react-hook-form';

export const UserList = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // For edit
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [userToReset, setUserToReset] = useState(null);

    const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

    // Form handling
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    // Fetch users
    const fetchUsers = async () => {
        try {
            const res = await getUsers();
            setUsers(res.data);
        } catch (error) {
            showToast('Failed to fetch users', 'danger');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showToast = (message, variant = 'success') => {
        setToast({ show: true, message, variant });
    };

    const handleAdd = () => {
        setCurrentUser(null);
        reset();
        setShowModal(true);
    };

    const handleEdit = (user) => {
        setCurrentUser(user);
        setValue('username', user.username);
        setValue('email', user.email);
        setValue('first_name', user.first_name);
        setValue('last_name', user.last_name);
        setValue('phone', user.phone);
        setValue('admin_type', user.admin_type);
        setValue('is_verified', user.is_verified);
        setShowModal(true);
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteUser(userToDelete.id);
            showToast('User deleted successfully');
            fetchUsers();
        } catch (error) {
            showToast('Failed to delete user', 'danger');
        } finally {
            setShowDeleteConfirm(false);
            setUserToDelete(null);
        }
    };

    const handleResetClick = (user) => {
        setUserToReset(user);
        setShowResetModal(true);
    };

    const onSave = async (data) => {
        try {
            if (currentUser) {
                await updateUser(currentUser.id, data);
                showToast('User updated successfully');
            } else {
                await createUser(data);
                showToast('User created successfully');
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            console.error(error);
            showToast('Operation failed', 'danger');
        }
    };

    const onResetPasswordSubmit = async (e) => {
        e.preventDefault();
        const password = e.target.newPassword.value;
        try {
            await resetPassword(userToReset.id, password);
            showToast('Password reset successfully');
            setShowResetModal(false);
        } catch (error) {
            showToast('Failed to reset password', 'danger');
        }
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between mb-3">
                <h2>Users Management</h2>
                <Button variant="primary" onClick={handleAdd}>Add User</Button>
            </div>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Type</th>
                        <th>Full Name</th>
                        <th>Phone</th>
                        <th>Verified</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.admin_type === 'superadmin' ? 'Super Admin' : user.admin_type === 'admin' ? 'Admin' : user.admin_type}</td>
                            <td>{user.full_name || `${user.first_name} ${user.last_name}`}</td>
                            <td>{user.phone}</td>
                            <td>{user.is_verified ? 'Yes' : 'No'}</td>
                            <td>
                                <Button variant="info" size="sm" className="me-2" onClick={() => handleEdit(user)}>Edit</Button>
                                <Button variant="warning" size="sm" className="me-2" onClick={() => handleResetClick(user)}>Reset Pwd</Button>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteClick(user)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{currentUser ? 'Edit User' : 'Add User'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit(onSave)}>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control type="text" {...register('username', { required: true })} disabled={!!currentUser} />
                            {errors.username && <span className="text-danger">Required</span>}
                        </Form.Group>
                        {!currentUser && (
                            <Form.Group className="mb-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" {...register('password', { required: !currentUser })} />
                                {errors.password && <span className="text-danger">Required</span>}
                            </Form.Group>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control type="text" {...register('first_name')} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control type="text" {...register('last_name')} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control type="text" {...register('phone')} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select {...register('admin_type', { required: true })}>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                            </Form.Select>
                            {errors.admin_type && <span className="text-danger">Required</span>}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check type="checkbox" label="Verified" {...register('is_verified')} />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Save</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete user <strong>{userToDelete?.username}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                </Modal.Footer>
            </Modal>

            {/* Reset Password Modal */}
            <Modal show={showResetModal} onHide={() => setShowResetModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Reset Password for {userToReset?.username}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={onResetPasswordSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control type="password" name="newPassword" required />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" className="me-2" onClick={() => setShowResetModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Reset Password</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Toasts */}
            <ToastContainer position="top-end" className="p-3">
                <Toast show={toast.show} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide bg={toast.variant}>
                    <Toast.Header>
                        <strong className="me-auto">Notification</strong>
                    </Toast.Header>
                    <Toast.Body className={toast.variant === 'success' || toast.variant === 'danger' ? 'text-white' : ''}>
                        {toast.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};
