'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import UserSearch from './components/UserSearch';
import VisitEditor from './components/VisitEditor';
import ConfirmationModal from './components/ConfirmationModal';

interface User {
  id: string;
  email: string | null;
  name: string | null;
}

interface Restaurant {
  id: string;
  name: string;
  code: string;
}

interface Visit {
  restaurant_id: string;
  created_at: string;
}

interface VisitChange {
  restaurantId: string;
  restaurantName: string;
  action: 'add' | 'remove';
}

export default function AdminContent() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setIsAdmin] = useState<boolean | null>(null);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userVisits, setUserVisits] = useState<Visit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit states
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setLoading(false);
        setError('Please sign in to access admin panel');
        return;
      }

      try {
        const adminStatus = await DatabaseService.users.isAdmin(user.id);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          setLoading(false);
          setError('Access denied: Admin privileges required');
          return;
        }

        // Load initial data
        await Promise.all([
          loadUsers(),
          loadRestaurants()
        ]);
        
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Error verifying permissions');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  const loadUsers = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadRestaurants = async () => {
    try {
      const restaurants = await DatabaseService.restaurants.getAll();
      setRestaurants(restaurants);
    } catch (err) {
      console.error('Error loading restaurants:', err);
    }
  };

  const loadUserVisits = async (userId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('visits')
        .select('restaurant_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserVisits(data || []);
      
      // Initialize pending changes map
      const currentVisits = new Map<string, boolean>();
      (data || []).forEach(visit => {
        currentVisits.set(visit.restaurant_id, true);
      });
      setPendingChanges(new Map(currentVisits));
      
    } catch (err) {
      console.error('Error loading user visits:', err);
    }
  };

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    await loadUserVisits(user.id);
  };

  const handleVisitToggle = (restaurantId: string, checked: boolean) => {
    const newChanges = new Map(pendingChanges);
    newChanges.set(restaurantId, checked);
    setPendingChanges(newChanges);
  };

  const getChanges = (): VisitChange[] => {
    if (!selectedUser) return [];
    
    const currentVisits = new Set(userVisits.map(v => v.restaurant_id));
    const changes: VisitChange[] = [];
    
    pendingChanges.forEach((shouldHaveVisit, restaurantId) => {
      const currentlyHasVisit = currentVisits.has(restaurantId);
      const restaurant = restaurants.find(r => r.id === restaurantId);
      
      if (shouldHaveVisit && !currentlyHasVisit) {
        changes.push({
          restaurantId,
          restaurantName: restaurant?.name || 'Unknown Restaurant',
          action: 'add'
        });
      } else if (!shouldHaveVisit && currentlyHasVisit) {
        changes.push({
          restaurantId,
          restaurantName: restaurant?.name || 'Unknown Restaurant',
          action: 'remove'
        });
      }
    });
    
    return changes;
  };

  const handleSaveChanges = () => {
    const changes = getChanges();
    if (changes.length > 0) {
      setShowConfirmModal(true);
    }
  };

  const confirmSaveChanges = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    setShowConfirmModal(false);
    
    try {
      const changes = getChanges();
      const { supabase } = await import('@/lib/supabase');
      
      for (const change of changes) {
        if (change.action === 'add') {
          // Add visit
          await supabase
            .from('visits')
            .insert({
              user_id: selectedUser.id,
              restaurant_id: change.restaurantId,
              created_at: new Date().toISOString()
            });
        } else {
          // Remove visit
          await supabase
            .from('visits')
            .delete()
            .eq('user_id', selectedUser.id)
            .eq('restaurant_id', change.restaurantId);
        }
      }
      
      // Reload user visits to show updated state
      await loadUserVisits(selectedUser.id);
      
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-coral-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const changes = getChanges();

  return (
    <div className="space-y-8">
      {/* User Search Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Select User</h2>
        <UserSearch 
          users={users}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUserSelect={handleUserSelect}
          selectedUser={selectedUser}
        />
      </div>

      {/* Visit Editor Section */}
      {selectedUser && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Manage Visits for {selectedUser.name || selectedUser.email}
              </h2>
              <p className="text-gray-600 mt-1">
                Check/uncheck restaurants to add or remove visits
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {changes.length > 0 && (
                <span className="text-sm text-orange-600 font-medium">
                  {changes.length} pending change{changes.length !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={handleSaveChanges}
                disabled={changes.length === 0 || saving}
                className="px-4 py-2 bg-coral-600 text-white rounded-lg hover:bg-coral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          
          <VisitEditor
            restaurants={restaurants}
            pendingChanges={pendingChanges}
            onVisitToggle={handleVisitToggle}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSaveChanges}
        changes={changes}
        userName={selectedUser?.name || selectedUser?.email || 'Selected User'}
      />
    </div>
  );
}