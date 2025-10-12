interface User {
  id: string;
  email: string | null;
  name: string | null;
}

interface Props {
  users: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUserSelect: (user: User) => void;
  selectedUser: User | null;
}

export default function UserSearch({ 
  users, 
  searchQuery, 
  onSearchChange, 
  onUserSelect,
  selectedUser 
}: Props) {
  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const name = user.name?.toLowerCase() || '';
    return email.includes(query) || name.includes(query) || user.id.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search users by email, name, or ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-coral-500 focus:border-coral-500 text-lg"
        />
      </div>

      {/* Search Results */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {searchQuery && filteredUsers.length === 0 && (
          <p className="text-gray-500 text-center py-4">No users found matching &quot;{searchQuery}&quot;</p>
        )}
        
        {(searchQuery ? filteredUsers : users.slice(0, 10)).map((user) => (
          <div
            key={user.id}
            onClick={() => onUserSelect(user)}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedUser?.id === user.id
                ? 'bg-coral-50 border-coral-300'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">
                  {user.name || 'No name set'}
                </div>
                <div className="text-sm text-gray-600">
                  {user.email || 'No email'}
                </div>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                {user.id.slice(0, 12)}...
              </div>
            </div>
          </div>
        ))}
        
        {!searchQuery && users.length > 10 && (
          <p className="text-gray-500 text-center py-2 text-sm">
            Showing first 10 users. Use search to find specific users.
          </p>
        )}
      </div>
      
      {selectedUser && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-coral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-coral-900">Selected User:</span>
            <span className="text-coral-700">
              {selectedUser.name || selectedUser.email || selectedUser.id}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}