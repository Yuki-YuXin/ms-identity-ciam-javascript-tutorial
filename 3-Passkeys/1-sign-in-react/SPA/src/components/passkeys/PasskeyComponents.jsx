import { useState } from 'react';
import { Button, ListGroup, Alert, Spinner, Collapse, Row, Col } from 'react-bootstrap';
import { FaKey, FaPlus, FaExclamationTriangle, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { HiOutlineTrash } from 'react-icons/hi';

/**
 * Dropdown details component for expanded passkey information
 */
const DropdownDetails = ({ passkey }) => {
    return (
        <div className="mt-3 pt-3 border-top bg-light rounded p-3">
            {/* Two rows, two columns layout for expanded details */}
            <div className="flex-grow-1">
                <Row className="g-3 mb-2">
                    <Col xs={4} className="text-start">
                        <div>
                            <small className="text-muted d-block">Date Registered</small>
                            <span className="small">{passkey.created || 'N/A'}</span>
                        </div>
                    </Col>
                    <Col xs={8} className="text-start ps-3">
                        <div>
                            <small className="text-muted d-block">AAGUID</small>
                            <span className="small">
                                {passkey.aaGuid || 'N/A'}
                            </span>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

/**
 * Individual passkey item component for displaying passkey information
 * @param {Object} props - Component props
 * @param {Object} props.passkey - Passkey object containing id, name, model, created, lastUsed
 * @param {Function} props.onDelete - Callback function when delete button is clicked
 * @param {boolean} [props.isLoading=false] - Whether component is in loading state
 * @returns {JSX.Element} Rendered passkey item
 */
export const PasskeyItem = ({ passkey, onDelete, isLoading = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const parseDeviceModel = (modelString) => {
        if (!modelString) {
            return { device: 'Unknown Device', method: 'Unknown Method' };
        }
        
        const withIndex = modelString.toLowerCase().indexOf(' with ');
        
        if (withIndex === -1) {
            // No "with" found, return full string as device
            return { authenticatorDevice: modelString.trim(), method: 'Standard' };
        }
        
        const authenticatorDevice = modelString.substring(0, withIndex).trim();
        const method = modelString.substring(withIndex + 6).trim(); // +6 for " with "
        
        return { 
            authenticatorDevice: authenticatorDevice || 'Unknown Device', 
            method: method || 'Unknown Method' 
        };
    };

    const deviceDetais = parseDeviceModel(passkey.model);
    return (
        <ListGroup.Item className="passkey-item border-bottom" style={{ borderColor: '#e9ecef', borderWidth: '1px' }}>
            {/* Main Row - always visible */}
            <div className="d-flex justify-content-between align-items-center">
                {/* Two rows, two columns content area */}
                <div className="flex-grow-1">
                    <Row className="g-2 mb-1">
                        <Col xs={6} className="text-start">
                            <strong>Passkey ({passkey.passkeyType})</strong>
                        </Col>
                        <Col xs={6} className="text-start">
                            <span className="text-muted small">{deviceDetais.authenticatorDevice} - {deviceDetais.method}</span>
                        </Col>
                    </Row>
                    <Row className="g-2">
                        <Col xs={6} className="text-start">
                            <small className="text-muted">{deviceDetais.authenticatorDevice}</small>
                        </Col>
                        <Col xs={6} className="text-start">
                            <small className="text-muted">{deviceDetais.method} device</small>
                        </Col>
                    </Row>
                </div>
                
                {/* Buttons: Delete first, then Dropdown */}
                <div className="d-flex align-items-center gap-2">
                    <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent expanding when clicking delete
                            onDelete(passkey.id, passkey.name);
                        }}
                        disabled={isLoading}
                    >
                        <HiOutlineTrash />
                    </Button>
                    <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={handleToggleExpand}
                        className="border-0"
                    >
                        {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                    </Button>
                </div>
            </div>

            {/* Expandable Details */}
            <Collapse in={isExpanded}>
                <div>
                    <DropdownDetails passkey={passkey} />
                </div>
            </Collapse>
        </ListGroup.Item>
    );
};

/**
 * List component for displaying multiple passkeys with loading and error states
 * @param {Object} props - Component props
 * @param {Array} props.passkeys - Array of passkey objects to display
 * @param {Function} props.onDelete - Callback function when a passkey is deleted
 * @param {boolean} [props.isLoading=false] - Whether list is in loading state
 * @param {string|null} [props.error=null] - Error message to display if any
 * @returns {JSX.Element} Rendered passkeys list
 */
export const PasskeysList = ({ passkeys, onDelete, isLoading = false, error = null }) => {
    if (error) {
        return (
            <Alert variant="danger" className="mb-0">
                <div className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    <div>
                        <Alert.Heading className="mb-1">Error loading passkeys</Alert.Heading>
                        <p className="mb-0">{error}</p>
                    </div>
                </div>
            </Alert>
        );
    }

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status" className="mb-3" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="text-muted mb-0">Loading your passkeys...</p>
            </div>
        );
    }

    if (passkeys.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="mb-3">
                    <FaKey size={48} className="text-muted opacity-50" />
                </div>
                <h6 className="text-muted mb-2">No passkeys configured yet</h6>
                <p className="text-muted small mb-0">
                    Create a passkey to sign in faster and more securely
                </p>
            </div>
        );
    }

    return (
        <ListGroup variant="flush">
            {passkeys.map(passkey => (
                <PasskeyItem 
                    key={passkey.id} 
                    passkey={passkey} 
                    onDelete={onDelete}
                    isLoading={isLoading}
                />
            ))}
        </ListGroup>
    );
};

/**
 * Header component for passkeys section with count display and add button
 * @param {Object} props - Component props
 * @param {number} props.count - Current number of passkeys
 * @param {number} props.maxCount - Maximum allowed number of passkeys
 * @param {Function} props.onAddClick - Callback function when add button is clicked
 * @param {boolean} [props.isLoading=false] - Whether component is in loading state
 * @returns {JSX.Element} Rendered passkeys header
 */
export const PasskeysHeader = ({ count, maxCount, onAddClick, isLoading = false }) => {
    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">Passkeys ({count}/{maxCount})</h5>
            </div>
            <Button 
                variant="primary" 
                size="sm"
                onClick={onAddClick}
                disabled={count >= maxCount || isLoading}
            >
                <FaPlus className="me-1" />
                Add Passkey
            </Button>
        </div>
    );
};
