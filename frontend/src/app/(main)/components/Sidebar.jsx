'use client';

import React from 'react';
import Link from 'next/link';
import { useState } from "react";
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FaChevronDown, FaChevronUp, FaTachometerAlt, FaBuilding, 
  FaFolder, FaBook, FaClipboardList, FaClipboardCheck, 
  FaCalendarAlt, FaFileAlt, FaSearch, FaUsers, FaPlus,
  FaList, FaCheck, FaTimes, FaEye, FaChartBar
} from "react-icons/fa";
import { MdOutlineDashboardCustomize, MdAccountBox } from "react-icons/md";
import Image from 'next/image';

const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  // State for dropdowns
  const [openMenus, setOpenMenus] = useState({
    centre: false,
    category: false,
    course: false,
    courseEntry: false,
    adminCourseEntry: false
  });

  // Toggle dropdown
  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Handle navigation and close sidebar on mobile
  const handleNavigation = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  // Function to set active styles
  const linkClasses = (path) =>
    `block px-4 py-1.5 rounded-lg text-black text-sm  font-semibold transition-all duration-200 flex gap-2 items-center ${
      pathname === path
        ? "bg-gradient-to-r from-lime-200 via-lime-400 to-lime-500 shadow-md"
        : "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300"
    }`;

  const buttonClasses = "w-full flex justify-between items-center bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 px-4 py-1.5 rounded-lg text-black font-semibold text-sm transition-all duration-200";

  const subMenuClasses = "ml-2 mt-2 space-y-1 border-l-2 border-cyan-400 pl-3";

  // Menu items configuration
  const menuItems = [
    {
      type: 'link',
      path: '/dashboard',
      icon: <MdOutlineDashboardCustomize className="text-xl" />,
      label: 'Dashboard'
    },
    {
      type: 'dropdown',
      key: 'Core Settings',
      icon: <MdAccountBox className="text-xl" />,
      label: 'Core Settings',
      items: [
        { path: '/core/centres', icon: <FaBuilding />, label: 'NIELIT Centres' },
        { path: '/core/course-category', icon: <FaBuilding />, label: 'Course Category' },
        { path: '/core/manage-admin', icon: <FaBuilding />, label: 'Manage Admins' },
      ]
    },
    {
      type: 'link',
      path: '/course-management',
      icon: <FaFileAlt className="text-xl" />,
      label: 'Manage Courses'
    },
    {
      type: 'dropdown',
      key: 'student-management',
      icon: <FaFolder className="text-xl" />,
      label: 'Student Management',
      items: [
        { path: '/student-management/#', icon: <FaPlus />, label: 'Temp Link' },
        { path: '/student-management/view', icon: <FaList />, label: 'View Students' },
        { path: '/student-management/batch-students', icon: <FaList />, label: 'Batch Students' },
      ]
    },
    {
      type: 'dropdown',
      key: 'batch-management',
      icon: <FaFolder className="text-xl" />,
      label: 'Batch Management',
      items: [
        { path: '/batch-management/#', icon: <FaPlus />, label: 'Temp Link' },
        { path: '/batch-management/view', icon: <FaList />, label: 'View Batches' }
      ]
    },
   
    {
      type: 'link',
      path: '/mis-data/upload',
      icon: <FaFileAlt className="text-xl" />,
      label: 'Upload MIS FILE'
    },
    
    {
      type: 'link',
      path: '/dashboard/admin/report',
      icon: <FaFileAlt className="text-xl" />,
      label: 'Generate Report'
    },
    {
      type: 'link',
      path: '/dashboard/nl-sql',
      icon: <FaCalendarAlt className="text-xl" />,
      label: 'AI - Chat with DB '
    },
    {
      type: 'link',
      path: '/admin/search-course',
      icon: <FaSearch className="text-xl" />,
      label: 'Search Course'
    },
    {
      type: 'link',
      path: '/admin/users',
      icon: <FaUsers className="text-xl" />,
      label: 'Manage Users'
    }
  ];

  // Render menu item based on type
  const renderMenuItem = (item) => {
    if (item.type === 'link') {
      return (
        <li key={item.path}>
          <Link
            href={item.path}
            className={linkClasses(item.path)}
            onClick={handleNavigation}
          >
            <span className="text-2xl">{item.icon}</span>
            {item.label}
          </Link>
        </li>
      );
    }

    if (item.type === 'dropdown') {
      return (
        <li key={item.key}>
          <button
            onClick={() => toggleMenu(item.key)}
            className={buttonClasses}
          >
            <div className="flex gap-2 items-center">
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {openMenus[item.key] ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
          </button>
          {openMenus[item.key] && (
            <ul className={subMenuClasses}>
              {item.items.map((subItem) => (
                <li key={subItem.path}>
                  <Link
                    href={subItem.path}
                    className={linkClasses(subItem.path)}
                    onClick={handleNavigation}
                  >
                    <span className="text-sm">{subItem.icon}</span>
                    {subItem.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }
  };

  return (
    <>
      <aside
        className={`fixed lg:static left-0 top-0 z-40 h-screen pt-16
        transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 w-64 bg-blue-950 border-r border-gray-200`}
      >
        {/* Header */}
        <div className="p-4 border-b border-cyan-500 flex justify-center">
          <div className="flex flex-col items-center">
            <Image
              src="/assets/testimg.jpg"
              alt="Admin"
              width={200}
              height={200}
              loading="eager"
              className="h-32 w-32 mb-1 rounded-full border-2 border-white object-cover"
              priority={false}
            />
            <h1 className="text-lg font-bold text-white">
              {user?.name || 'Supril Kumar'}
            </h1>
            <h1 className="text-sm text-gray-300">
              {user?.role || 'Admin'}
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-4">
            {menuItems.map(item => renderMenuItem(item))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;