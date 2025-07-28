import React, { useContext } from 'react'
import { UserContext } from '../../context/userContext'
import SideMenu from './SideMenu';
import Navbar from './Navbar';

const DashboardLayout = ({children, activeMenu}) => {
    const { user } = useContext(UserContext);

    return (
        <div className="h-screen flex flex-col">
            <Navbar activeMenu={activeMenu} />

            {user && (
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Fixed Width, Sticky Left */}
                    <div className="w-64 shrink-0 border-r border-gray-200 bg-white h-full overflow-y-auto">
                        <SideMenu activeMenu={activeMenu} />
                    </div>

                    {/* Main Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
                        {children}
                    </div>
                </div>
            )}
        </div>
    )
}

export default DashboardLayout
