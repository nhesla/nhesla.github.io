import React, { useState } from 'react';

interface SidebarProps {
  children: React.ReactNode;
  width?: string;
  collapsedWidth?: string;
  backgroundColor?: string;
  collapseButtonColor?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  children,
  width = '350px',
  collapsedWidth = '20px',
  backgroundColor = '#30303080',
  collapseButtonColor = '#ddd',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const sidebarStyle: React.CSSProperties = {
    width: isCollapsed ? collapsedWidth : width,
    backgroundColor:  backgroundColor,
    transition: 'width 0.3s ease',
    overflowX: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
  };

  const collapseButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '2px',
    cursor: 'pointer',
    color: collapseButtonColor,
  };

  return (
    <div style={sidebarStyle}>
      <div style={collapseButtonStyle} onClick={toggleCollapse}>
        {isCollapsed ? '▶' : '◀'}
      </div>
      {children}
    </div>
  );
};

export default Sidebar;