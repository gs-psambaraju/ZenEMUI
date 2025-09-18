import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, ClipboardDocumentListIcon, CalendarDaysIcon, UsersIcon, UserIcon, RocketLaunchIcon, Cog6ToothIcon, ClipboardDocumentCheckIcon, ChevronDownIcon, ChevronRightIcon, ChevronLeftIcon, BoltIcon } from '@heroicons/react/24/outline';
import { UserHeader } from '../dashboard/UserHeader';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { ROUTES } from '../../utils/constants';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Home', icon: HomeIcon },
  { to: ROUTES.EPICS, label: 'Epics', icon: ClipboardDocumentListIcon },
  { to: ROUTES.RELEASES, label: 'Releases', icon: RocketLaunchIcon },
  { to: ROUTES.TEAMS, label: 'Teams', icon: UsersIcon },
  { to: ROUTES.TEAMMATES, label: 'Teammates', icon: UserIcon },
  { to: ROUTES.CALENDAR, label: 'Calendar', icon: CalendarDaysIcon },
  { to: ROUTES.SPRINTS, label: 'Sprints', icon: BoltIcon },
  {
    label: 'Admin',
    icon: Cog6ToothIcon,
    children: [
      { to: ROUTES.ADMIN_CONNECTORS, label: 'Connectors', icon: Cog6ToothIcon },
      { to: ROUTES.ADMIN_PLANNING_PERIODS, label: 'Planning Periods', icon: ClipboardDocumentCheckIcon },
      { to: ROUTES.ADMIN_OKR_TYPES, label: 'OKR Types', icon: Cog6ToothIcon },
    ]
  },
];

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { tenantName } = useTenant();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load sidebar state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  // State for collapsed submenu (pinned when clicked)
  const [pinnedSubmenu, setPinnedSubmenu] = useState<string | null>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  // Auto-expand admin section if user is on an admin route
  useEffect(() => {
    if (location.pathname.startsWith('/admin/')) {
      setAdminExpanded(true);
    }
  }, [location.pathname]);

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Handle click outside pinned submenu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        setPinnedSubmenu(null);
      }
    };

    if (pinnedSubmenu && sidebarCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [pinnedSubmenu, sidebarCollapsed]);

  // Clear pinned submenu when sidebar is expanded
  useEffect(() => {
    if (!sidebarCollapsed) {
      setPinnedSubmenu(null);
    }
  }, [sidebarCollapsed]);

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const Icon = item.icon;
    const isCollapsed = sidebarCollapsed && !isMobile;
    
    if (item.children) {
      // Parent item with children
      const hasActiveChild = item.children.some(child => child.to === location.pathname);
      
      if (isCollapsed) {
        // Collapsed parent item - show submenu on hover or when pinned
        const isSubmenuVisible = pinnedSubmenu === item.label;
        
        return (
          <div key={item.label} className="relative group">
            <button
              onClick={() => {
                // Toggle pinned state for this submenu
                setPinnedSubmenu(pinnedSubmenu === item.label ? null : item.label);
              }}
              className={`w-full flex items-center justify-center p-3 rounded-md mb-1 transition-colors ${
                hasActiveChild || isSubmenuVisible
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              {/* Small indicator when submenu has children */}
              {item.children && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-400 rounded-full"></div>
              )}
            </button>
            
            {/* Tooltip - only show when not pinned */}
            {!isSubmenuVisible && (
              <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
            
            {/* Collapsed submenu - show on hover OR when pinned */}
            <div 
              ref={submenuRef}
              className={`absolute left-full top-0 ml-2 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 transition-all duration-200 ${
                isSubmenuVisible 
                  ? 'opacity-100 pointer-events-auto' 
                  : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
              }`}
            >
              {item.children?.map((child) => {
                const ChildIcon = child.icon;
                const isActive = location.pathname === child.to;
                
                return (
                  <NavLink
                    key={child.to}
                    to={child.to!}
                    onClick={() => setPinnedSubmenu(null)} // Close pinned submenu when navigating
                    className={({ isActive: active }) =>
                      `flex items-center px-3 py-2 text-sm whitespace-nowrap hover:bg-gray-50 transition-colors ${
                        active || isActive
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-700'
                      }`
                    }
                  >
                    <ChildIcon className="h-4 w-4 mr-2" />
                    {child.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      }
      
      return (
        <div key={item.label}>
          <button
            onClick={() => setAdminExpanded(!adminExpanded)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md mb-1 transition-colors border-l-4 ${
              hasActiveChild
                ? 'bg-blue-50 text-blue-700 border-blue-600'
                : 'text-gray-700 hover:bg-gray-50 border-transparent'
            }`}
          >
            <div className="flex items-center">
              <Icon className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {adminExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
          
          {adminExpanded && (
            <div className="ml-4 mb-1">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const isActive = location.pathname === child.to;
                
                return (
                  <NavLink
                    key={child.to}
                    to={child.to!}
                    onClick={() => isMobile && setMobileOpen(false)}
                    className={({ isActive: active }) =>
                      `flex items-center px-3 py-2 rounded-md mb-1 transition-colors border-l-4 ${
                        active || isActive
                          ? 'bg-blue-50 text-blue-700 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 border-transparent'
                      }`
                    }
                  >
                    <ChildIcon className="h-4 w-4 mr-3" />
                    <span className="text-sm font-medium">{child.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      );
    } else {
      // Regular nav item
      const isActive = location.pathname === item.to;
      
      if (isCollapsed) {
        // Collapsed nav item - icon only with tooltip
        return (
          <div key={item.to} className="relative group">
            <NavLink
              to={item.to!}
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive: active }) =>
                `flex items-center justify-center p-3 rounded-md mb-1 transition-colors ${
                  active || isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </NavLink>
            
            {/* Tooltip */}
            <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </div>
        );
      }
      
      return (
        <NavLink
          key={item.to}
          to={item.to!}
          onClick={() => isMobile && setMobileOpen(false)}
          className={({ isActive: active }) =>
            `flex items-center px-3 py-2 rounded-md mb-1 transition-colors border-l-4 ${
              active || isActive
                ? 'bg-blue-50 text-blue-700 border-blue-600'
                : 'text-gray-700 hover:bg-gray-50 border-transparent'
            }`
          }
        >
          <Icon className="h-5 w-5 mr-3" />
          <span className="text-sm font-medium">{item.label}</span>
        </NavLink>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {user && (
        <UserHeader user={user} companyName={tenantName || user.tenantId} onLogout={logout} />
      )}

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className={`relative flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-56 lg:w-64 xl:w-72'
          }`}>
            <nav className="flex-1 bg-white border-r border-gray-200 pt-4 pb-4 overflow-y-auto">
              <div className={sidebarCollapsed ? 'px-2' : 'px-3'}>
                {navItems.map((item) => renderNavItem(item))}
              </div>
            </nav>
            
            {/* Toggle button positioned at the edge of the sidebar */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`absolute -right-3 top-6 z-20 p-1.5 bg-white border border-gray-300 rounded-full shadow-md hover:shadow-lg transition-all duration-200 ${
                sidebarCollapsed ? 'opacity-100' : 'opacity-80 hover:opacity-100'
              }`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile top nav */}
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              aria-label="Open navigation menu"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              Menu
            </button>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="py-4 px-2 sm:px-3 lg:px-4">
              {children}
            </div>
          </main>
        </div>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setMobileOpen(false)} aria-label="Close navigation">✕</button>
            </div>
            <nav>
              {navItems.map((item) => renderNavItem(item, true))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarLayout;
