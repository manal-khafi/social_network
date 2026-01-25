import React from 'react';
import { useAppSelector } from '../hooks';
import { Navigate } from 'react-router-dom';
import PersonalizationWizard from '../Components/Acount/viewgenerale';

const PersonalizeGuard: React.FC = () => {
    const { user } = useAppSelector((state) => state.auth);

    if (user?.onboarding_done) {
        return <Navigate to="/home" replace />;
    }

    return <PersonalizationWizard />;
};

export default PersonalizeGuard;
