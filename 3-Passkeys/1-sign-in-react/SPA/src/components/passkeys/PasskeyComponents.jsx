import { Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { FaKey, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import { HiOutlineTrash } from 'react-icons/hi';

/**
 * Individual passkey item component for displaying passkey information
 * @param {Object} props - Component props
 * @param {Object} props.passkey - Passkey object containing id, name, model, created, lastUsed
 * @param {Function} props.onDelete - Callback function when delete button is clicked
 * @param {boolean} [props.isLoading=false] - Whether component is in loading state
 * @returns {JSX.Element} Rendered passkey item
 */
export const PasskeyItem = ({ passkey, onDelete, isLoading = false }) => {
    return (
        <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <div>
                <div className="d-flex align-items-center mb-1">
                    <strong>{passkey.name}</strong>
                </div>
                <small className="text-muted">
                    Device: {passkey.model} • Created: {passkey.created}
                    {passkey.lastUsed !== 'Never' && ` • Last used: ${passkey.lastUsed}`}
                </small>
            </div>
            <div>
                <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => onDelete(passkey.id)}
                    disabled={isLoading}
                >
                    <HiOutlineTrash />
                </Button>
            </div>
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
