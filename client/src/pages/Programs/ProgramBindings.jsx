import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button } from 'react-bootstrap';
import axios from 'axios';

const ProgramBindings = () => {
    const [programs, setPrograms] = useState([]);
    const [bindings, setBindings] = useState({});

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            const res = await axios.get('/api/fbd/programs/');
            setPrograms(res.data);

            // Initialize local bindings state from programs
            const initialBindings = {};
            res.data.forEach(p => {
                if (p.bindings) {
                    Object.assign(initialBindings, p.bindings); // Merge all logic? 
                    // Actually, structure should be ProgramID -> BlockID -> PointID.
                    // But here we might just flatten or keep per program.
                    // Let's keep it simple: We save to program.bindings object.
                    // So we don't need global state, we update program directly.
                }
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleBindingChange = (programId, blockId, pointId) => {
        const program = programs.find(p => p.id === programId);
        if (program) {
            const newBindings = { ...program.bindings, [blockId]: pointId };
            // Update local state deeply
            const newPrograms = programs.map(p =>
                p.id === programId ? { ...p, bindings: newBindings } : p
            );
            setPrograms(newPrograms);
        }
    };

    const saveBindings = async (program) => {
        try {
            await axios.patch(`/api/fbd/programs/${program.id}/`, { bindings: program.bindings });
            alert(`Bindings saved for ${program.name}`);
        } catch (err) {
            console.error(err);
            alert('Failed to save bindings');
        }
    };

    return (
        <Container className="mt-4">
            <h2>IO Bindings</h2>
            {programs.map(program => {
                const nodes = program.diagram_json?.nodes || [];
                const ioBlocks = nodes.filter(n => n.type === 'INPUT' || n.type === 'OUTPUT');

                if (ioBlocks.length === 0) return null;

                return (
                    <div key={program.id} className="mb-4">
                        <h5>{program.name}</h5>
                        <Table striped bordered size="sm">
                            <thead>
                                <tr>
                                    <th>Block Type</th>
                                    <th>Block ID</th>
                                    <th>Bound Point ID</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ioBlocks.map(block => (
                                    <tr key={block.id}>
                                        <td>{block.type}</td>
                                        <td>{block.label || block.id.substring(0, 8)}</td>
                                        <td>
                                            <Form.Control
                                                type="text"
                                                size="sm"
                                                placeholder="Enter Point ID"
                                                value={program.bindings?.[block.id] || ''}
                                                onChange={(e) => handleBindingChange(program.id, block.id, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <Button variant="primary" size="sm" onClick={() => saveBindings(program)}>
                                                Save
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                );
            })}
        </Container>
    );
};

export default ProgramBindings;
