import { Outlet } from "react-router-dom";
import SettingsView from "../Views/settings/SettingsView";

const SettingsLayout = () => {
    return (
        <div>
            <SettingsView />
            <Outlet />
        </div>
    );
};

export default SettingsLayout;
