// src/components/GroupAdminModal.tsx
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X, UserX, ShieldAlert, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GroupMember {
  _id: string;
  fullName: string;
}

interface Group {
  _id: string;
  admin: { _id: string };
  members: GroupMember[];
}

interface GroupAdminModalProps {
  group: Group;
  onClose: () => void;
  onGroupUpdate: () => void;
}

const GroupAdminModal = ({ group, onClose, onGroupUpdate }: GroupAdminModalProps) => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member from the group?')) {
      try {
        await api.post(`/api/groups/${group._id}/remove-member`, { memberId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        onGroupUpdate(); // Refresh group details in the parent component
      } catch (error) {
        console.error("Failed to remove member:", error);
        alert('Failed to remove member.');
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('DANGER: Are you sure you want to permanently delete this group and all its posts? This action cannot be undone.')) {
      try {
        await api.delete(`/api/groups/${group._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Group deleted successfully.');
        navigate('/groups'); // Navigate to the groups discovery page after deletion
      } catch (error) {
        console.error("Failed to delete group:", error);
        alert('Failed to delete group.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Manage Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-white">Members</h3>
          <ul className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {group.members.map(member => (
              <li key={member._id} className="flex justify-between items-center p-2 rounded hover:bg-gray-700/50">
                <span className="text-gray-300">{member.fullName}</span>
                {member._id !== group.admin._id && (
                  <button onClick={() => handleRemoveMember(member._id)} title="Remove member" className="text-red-400 hover:text-red-600">
                    <UserX size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-semibold text-red-500 flex items-center"><ShieldAlert size={18} className="mr-2"/> Danger Zone</h3>
            <p className="text-xs text-gray-400 mt-1">These actions are permanent and cannot be undone.</p>
            <button onClick={handleDeleteGroup} className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors">
              <Trash2 size={16} className="mr-2"/> Delete Group Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupAdminModal;
