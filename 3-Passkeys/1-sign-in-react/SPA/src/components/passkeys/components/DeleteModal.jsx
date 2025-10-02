import { Button, Modal, Spinner } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';

/**
 * Confirmation modal for passkey deletion
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether modal is visible
 * @param {Object} props.passkey - Passkey object to delete
 * @param {Function} props.onConfirm - Callback when user confirms deletion
 * @param {Function} props.onCancel - Callback when user cancels deletion
 * @param {boolean} [props.isDeleting=false] - Whether deletion is in progress
 * @returns {JSX.Element} Rendered confirmation modal
 */
const DeleteModal = ({ show, passkey, onConfirm, onCancel, isDeleting = false }) => {
    return (
        <Modal show={show} onHide={onCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title>Delete Passkey</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex align-items-center mb-3">
                    <FaExclamationTriangle className="text-warning me-3" size={24} />
                    <div>
                        <p className="mb-2">
                            Are you sure you want to delete the passkey <strong>"{passkey?.name || 'Unknown'}"</strong>?
                        </p>
                        <p className="text-muted small mb-0">
                            This action cannot be undone. You'll need to set up a new passkey if you want to use passkey authentication again.
                        </p>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
                    Cancel
                </Button>
                <Button 
                    variant="danger" 
                    onClick={onConfirm}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            Deleting...
                        </>
                    ) : (
                        'Delete Passkey'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteModal;
