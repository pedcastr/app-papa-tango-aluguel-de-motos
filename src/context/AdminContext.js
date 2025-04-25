import React, { createContext, useState } from 'react'; 

export const AdminContext = createContext({});

export function AdminProvider({ children }) {
    const [adminData, setAdminData] = useState(null);

    return (
        <AdminContext.Provider value={{ adminData, setAdminData }}>
            {children}
        </AdminContext.Provider>
    );
}