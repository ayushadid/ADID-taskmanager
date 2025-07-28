import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';
import { SIDE_MENU_DATA, SIDE_MENU_USER_DATA } from '../../utils/data';

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const [sideMenuData, setSideMenuData] = useState([]);
  const navigate = useNavigate();

  const handleClick = (route) => {
    if (route === 'logout') {
      handleLogout();
      return;
    }
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.clear();
    clearUser(); // ✅ Call the function
    navigate('/login');
  };

  useEffect(() => {
    if (user) {
      setSideMenuData(user.role === 'admin' ? SIDE_MENU_DATA : SIDE_MENU_USER_DATA);
    }
  }, [user]);

  return (
    <div className='p-4'>
      <div className='mb-6'>
        {user?.profileImageUrl && (
          <img
            src={user.profileImageUrl}
            alt='Profile'
            className='w-17 h-17 rounded-full object-cover'
          />
        )}
        {user?.role === 'admin' && (
          <div className='text-xs text-gray-500'>Admin</div>
        )}
        <h5 className='text-md font-semibold'>{user?.name || ''}</h5>
        <p className='text-sm text-gray-600'>{user?.email || ''}</p>
      </div>

      <div>
        {sideMenuData.map((item, index) => (
          <button
            key={`menu_${index}`}
            className={`w-full flex items-center gap-4 text-[15px] ${
              activeMenu === item.label
                ? 'text-primary bg-gradient-to-r from-blue-50/40 to-blue-100/50 border-r-[3px] border-blue-500'
                : ''
            } py-3 px-6 mb-3 cursor-pointer`}
            onClick={() => handleClick(item.path)}
          >
            <item.icon className="text-xl" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SideMenu;
