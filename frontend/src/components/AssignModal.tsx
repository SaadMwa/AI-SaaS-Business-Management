import Modal from "./Modal";
import Dropdown from "./Dropdown";
import { AssignableUser } from "../services/user.service";

export default function AssignModal({
  open,
  users,
  selectedUserId,
  saving,
  onChange,
  onClose,
  onAssign,
}: {
  open: boolean;
  users: AssignableUser[];
  selectedUserId: string;
  saving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onAssign: () => void;
}) {
  return (
    <Modal title="Assign Task" open={open} onClose={onClose}>
      <div className="space-y-4">
        <Dropdown value={selectedUserId} onChange={onChange}>
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
        </Dropdown>
        <button className="btn-primary w-full" onClick={onAssign} disabled={saving}>
          {saving ? "Assigning..." : "Assign"}
        </button>
      </div>
    </Modal>
  );
}
