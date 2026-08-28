import React, { useState } from 'react';
import DocViewer from '../components/Docs/DocViewer';
import DocManager from '../components/Docs/DocManager';
import { useAuth } from '../lib/AuthContext';

export default function DocsPage() {
  const [isManageOpen, setIsManageOpen] = useState(false);
  const { user, profile } = useAuth();

  const isSuperAdminEmail = (email?: string | null) => {
    if (!email) return false;
    const e = email.toLowerCase().trim();
    const adminEnv = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
    return ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(e) || (adminEnv && e === adminEnv);
  };

  const isSuperAdmin = Boolean(
    user && (profile?.role === 'superadmin' || isSuperAdminEmail(user.email))
  );

  return (
    <>
      <DocViewer 
        onOpenManageModal={isSuperAdmin ? () => setIsManageOpen(true) : undefined} 
        isSuperAdmin={isSuperAdmin}
      />
      {isSuperAdmin && (
        <DocManager 
          isOpen={isManageOpen} 
          onClose={() => setIsManageOpen(false)} 
        />
      )}
    </>
  );
}

